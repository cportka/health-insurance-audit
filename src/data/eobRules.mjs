// eobRules.mjs — the rules engine for the Bill & EOB audit.
//
// Each rule inspects a normalized claim (see docs/ARCHITECTURE.md → "Claim shape") and returns
// zero or more findings. Findings are advisory: they flag *likely* errors a patient should
// question, with the reasoning and what to do next. Severity drives sort order.
//
// Group/reason code background (X12 CARC + group codes), which most checks hinge on:
//   CO = Contractual Obligation  -> the PROVIDER must write this off; you should NOT be billed it.
//   PR = Patient Responsibility  -> legitimately yours (deductible, coinsurance, copay, non-covered).
//   OA = Other Adjustment, PI = Payer Initiated -> also NOT patient responsibility.
// So any CO/OA/PI dollars that show up in what you're asked to pay is a top red flag.

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const sumAdj = (line, pred) =>
  round2((line.adjustments || []).filter(pred).reduce((s, a) => s + (Number(a.amount) || 0), 0));
const hasCode = (line, group, code) =>
  (line.adjustments || []).some(
    (a) => (!group || a.group === group) && (!code || String(a.code) === String(code)),
  );

export const SEVERITY_ORDER = { high: 0, medium: 1, low: 2, info: 3 };

export const RULES = [
  {
    id: "co-billed-to-patient",
    name: "Provider write-off billed to you",
    category: "balance-billing",
    severity: "high",
    evaluate(claim) {
      const out = [];
      for (const line of claim.lines || []) {
        const nonPatient = sumAdj(line, (a) => ["CO", "OA", "PI"].includes(a.group));
        const pr = Number(line.patientResponsibility) || 0;
        const prAdj = sumAdj(line, (a) => a.group === "PR");
        // If you're asked to pay more than the sum of genuine PR adjustments, and there are
        // contractual write-offs on the line, you may be billed amounts the provider must eat.
        if (nonPatient > 0 && pr > round2(prAdj + 0.01)) {
          out.push({
            line: line.code,
            title: "You may be billed an amount the provider agreed to write off",
            detail:
              `Line ${line.code || "(unknown)"} has ${money(nonPatient)} in contractual/other ` +
              `adjustments (CO/OA/PI) that are the provider's responsibility, but your patient ` +
              `responsibility (${money(pr)}) exceeds the genuine patient-responsibility (PR) ` +
              `adjustments (${money(prAdj)}). In-network providers cannot bill you their CO write-offs.`,
            estimatedImpact: round2(pr - prAdj),
            suggestedAction:
              "Ask the provider's billing office to remove the contractual write-off (CO) amounts " +
              "from your bill, and compare the bill against your EOB's 'patient responsibility' column.",
          });
        }
      }
      return out;
    },
    sources: [
      "https://x12.org/codes/claim-adjustment-reason-codes",
      "https://www.cms.gov/medicare/coordination-benefits-recovery/overview",
    ],
  },
  {
    id: "balance-bill-co45",
    name: "Balance billing above the allowed amount (CO-45)",
    category: "balance-billing",
    severity: "high",
    evaluate(claim) {
      const out = [];
      const inNet =
        claim.provider?.inNetwork === true || claim.facility?.inNetwork === true;
      for (const line of claim.lines || []) {
        const co45 = sumAdj(line, (a) => a.group === "CO" && String(a.code) === "45");
        if (co45 > 0 && inNet) {
          out.push({
            line: line.code,
            title: "In-network balance bill (charge above the contracted rate)",
            detail:
              `Line ${line.code || "(unknown)"} shows a CO-45 adjustment of ${money(co45)} ` +
              `(charge exceeds the plan's allowed amount). For an in-network provider this is a ` +
              `contractual write-off — you should not be billed the difference.`,
            estimatedImpact: co45,
            suggestedAction:
              "If the provider's bill is higher than your EOB's patient responsibility, dispute " +
              "the difference as a prohibited in-network balance bill.",
          });
        }
      }
      return out;
    },
    sources: ["https://x12.org/codes/claim-adjustment-reason-codes"],
  },
  {
    id: "preventive-cost-share",
    name: "Cost-sharing charged for a $0 preventive service",
    category: "preventive",
    severity: "high",
    evaluate(claim) {
      const out = [];
      for (const line of claim.lines || []) {
        const pr = Number(line.patientResponsibility) || 0;
        if (line.preventive === true && pr > 0) {
          out.push({
            line: line.code,
            title: "You were charged for a preventive service that should be free",
            detail:
              `Line ${line.code || "(unknown)"} (${line.description || "preventive service"}) is ` +
              `flagged preventive but has ${money(pr)} of patient responsibility. Under the ACA, ` +
              `in-network preventive services on the federal lists must be covered with no copay, ` +
              `coinsurance, or deductible.`,
            estimatedImpact: pr,
            suggestedAction:
              "Ask the plan to reprocess the claim as preventive (no cost share). If the service " +
              "was coded as diagnostic, ask the provider whether a preventive code applies.",
          });
        }
      }
      return out;
    },
    sources: [
      "https://www.healthcare.gov/coverage/preventive-care-benefits/",
      "https://www.cms.gov/marketplace/about/oversight/other-insurance-protections/preventive-health-services",
    ],
  },
  {
    id: "timely-filing-co29",
    name: "Provider's late filing billed to you (CO-29)",
    category: "billing-error",
    severity: "high",
    evaluate(claim) {
      const out = [];
      for (const line of claim.lines || []) {
        const co29 = sumAdj(line, (a) => a.group === "CO" && String(a.code) === "29");
        const pr = Number(line.patientResponsibility) || 0;
        if (hasCode(line, "CO", "29") && (co29 > 0 || pr > 0)) {
          out.push({
            line: line.code,
            title: "You should not pay for the provider's late claim filing",
            detail:
              `Line ${line.code || "(unknown)"} was denied for timely filing (CO-29). When a ` +
              `provider misses the plan's filing deadline, that is the provider's loss — they ` +
              `cannot bill you for it.`,
            estimatedImpact: pr || co29,
            suggestedAction:
              "Tell the billing office the CO-29 timely-filing denial is not patient-billable and " +
              "ask them to write it off.",
          });
        }
      }
      return out;
    },
    sources: ["https://x12.org/codes/claim-adjustment-reason-codes"],
  },
  {
    id: "duplicate-line",
    name: "Duplicate charge",
    category: "billing-error",
    severity: "medium",
    evaluate(claim) {
      const out = [];
      const seen = new Map();
      for (const line of claim.lines || []) {
        const key = `${line.code || ""}|${line.serviceDate || claim.serviceDate || ""}|${line.units || 1}`;
        const prev = seen.get(key);
        if (prev && line.code) {
          out.push({
            line: line.code,
            title: "Possible duplicate charge",
            detail:
              `Code ${line.code} on ${line.serviceDate || claim.serviceDate || "this date"} appears ` +
              `more than once with the same units. This can be a duplicate, or a CO-18 duplicate ` +
              `denial — verify the service was actually performed twice.`,
            estimatedImpact: Number(line.patientResponsibility) || 0,
            suggestedAction:
              "Request an itemized bill and confirm each repeated line was a separate, real service.",
          });
        }
        seen.set(key, line);
        if (hasCode(line, "CO", "18") || hasCode(line, "PR", "18")) {
          out.push({
            line: line.code,
            title: "Duplicate-claim denial (code 18)",
            detail: `Line ${line.code || "(unknown)"} carries a duplicate denial (code 18).`,
            suggestedAction: "Confirm this is not a real second service before paying anything.",
          });
        }
      }
      return out;
    },
    sources: ["https://x12.org/codes/claim-adjustment-reason-codes"],
  },
  {
    id: "surprise-out-of-network",
    name: "Surprise out-of-network bill (No Surprises Act)",
    category: "no-surprises-act",
    severity: "high",
    evaluate(claim) {
      const out = [];
      const oonProvider = claim.provider?.inNetwork === false;
      const emergency = claim.context?.isEmergency === true;
      const atInNetFacility =
        claim.facility?.inNetwork === true && claim.context?.atInNetworkFacility !== false;
      if (oonProvider && (emergency || atInNetFacility)) {
        out.push({
          title: "You may be protected from this surprise out-of-network bill",
          detail:
            (emergency
              ? "This was emergency care from an out-of-network provider. "
              : "This was from an out-of-network provider at an in-network facility. ") +
            "Under the federal No Surprises Act, you generally cannot be balance billed beyond your " +
            "in-network cost-sharing for these services (limited exceptions apply, and some require " +
            "a notice-and-consent form you did NOT have to sign for emergencies).",
          estimatedImpact: Number(claim.totals?.patientResponsibility) || null,
          suggestedAction:
            "Do not pay the balance-billed amount yet. File a No Surprises Act complaint with CMS " +
            "(1-800-985-3059) and ask the plan to reprocess at the in-network cost-share.",
        });
      }
      return out;
    },
    sources: [
      "https://www.cms.gov/nosurprises",
      "https://www.cms.gov/files/document/no-surprises-act-fact-sheet.pdf",
    ],
  },
  {
    id: "cob-22",
    name: "Coordination-of-benefits routing (CO-22)",
    category: "billing-error",
    severity: "medium",
    evaluate(claim) {
      const out = [];
      for (const line of claim.lines || []) {
        if (hasCode(line, "CO", "22") || hasCode(line, "OA", "22")) {
          out.push({
            line: line.code,
            title: "Claim should go to another insurer first",
            detail:
              `Line ${line.code || "(unknown)"} was adjusted for coordination of benefits (code 22) ` +
              `— the plan thinks another insurer is primary. This is a routing issue, not your bill.`,
            suggestedAction:
              "Confirm which plan is primary, update coordination-of-benefits info with both plans, " +
              "and have the claim resubmitted in the right order.",
          });
        }
      }
      return out;
    },
    sources: ["https://www.cms.gov/medicare/coordination-benefits-recovery/overview"],
  },
  {
    id: "not-medically-necessary-50",
    name: "Medical-necessity denial (code 50) — appealable",
    category: "appealable-denial",
    severity: "medium",
    evaluate(claim) {
      const out = [];
      for (const line of claim.lines || []) {
        if (hasCode(line, "CO", "50") || hasCode(line, "PR", "50")) {
          out.push({
            line: line.code,
            title: "Denied as 'not medically necessary' — this is appealable",
            detail:
              `Line ${line.code || "(unknown)"} was denied for medical necessity (code 50). These ` +
              `denials are frequently overturned on appeal with a letter of medical necessity from ` +
              `your doctor.`,
            suggestedAction:
              "Request the plan's clinical criteria, get a letter of medical necessity, and file an " +
              "appeal. Use this tool's letter generator and deadline navigator.",
          });
        }
      }
      return out;
    },
    sources: ["https://www.dol.gov/agencies/ebsa/laws-and-regulations/laws/affordable-care-act"],
  },
  {
    id: "line-math-mismatch",
    name: "EOB line math does not add up",
    category: "billing-error",
    severity: "low",
    evaluate(claim) {
      const out = [];
      for (const line of claim.lines || []) {
        const allowed = Number(line.allowed);
        const planPaid = Number(line.planPaid);
        const pr = Number(line.patientResponsibility);
        if ([allowed, planPaid, pr].every((n) => Number.isFinite(n))) {
          if (Math.abs(allowed - (planPaid + pr)) > 0.01) {
            out.push({
              line: line.code,
              title: "Allowed amount ≠ plan paid + your responsibility",
              detail:
                `Line ${line.code || "(unknown)"}: allowed ${money(allowed)} but plan paid ` +
                `${money(planPaid)} + your share ${money(pr)} = ${money(planPaid + pr)}. ` +
                `These should reconcile.`,
              suggestedAction: "Ask the plan to explain the difference; request a corrected EOB.",
            });
          }
        }
      }
      return out;
    },
    sources: [],
  },
  {
    id: "needs-itemized-bill",
    name: "Only a summary bill is present",
    category: "documentation",
    severity: "info",
    evaluate(claim) {
      if (!claim.lines || claim.lines.length === 0) {
        return [
          {
            title: "Request an itemized bill before paying",
            detail:
              "No line-item detail was provided. A summary bill hides duplicate charges, upcoding, " +
              "and services never received. You have the right to a fully itemized bill.",
            suggestedAction:
              "Call the provider and request a line-item itemized bill (CPT/HCPCS codes, dates, " +
              "and charges), then re-run the audit.",
          },
        ];
      }
      return [];
    },
    sources: [],
  },
];

function money(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "$0.00";
  return `$${v.toFixed(2)}`;
}
