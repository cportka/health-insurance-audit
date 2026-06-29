// planTypes.mjs — registry of the major US health plan types.
//
// This registry holds the STABLE facts about each plan type (who regulates it, which appeal
// framework governs it, whether its appeal rights are weaker than ACA/ERISA). The deadline-bearing
// pathway steps live separately in pathways.mjs, keyed by `framework`, so the safety-critical
// numbers have one home and one set of citations.
//
// `framework` -> a key in pathways.mjs.
// `weakerRights: true` -> the tool warns the user their standardized federal appeal protections
//   may not apply.

export const PLAN_TYPES = [
  {
    id: "aca-individual",
    name: "ACA Marketplace / Individual plan",
    aka: ["Obamacare plan", "Healthcare.gov plan", "individual market", "exchange plan"],
    category: "commercial",
    funding: "fully-insured",
    regulator: "Your state's Department of Insurance, with federal floor set by HHS/CMS (CCIIO)",
    framework: "aca",
    weakerRights: false,
    howToIdentify:
      "You bought it yourself (not through a job) on HealthCare.gov or a state exchange, or directly from an insurer.",
    notes:
      "Non-grandfathered individual plans get the full ACA internal-appeal + external-review protections. External review uses your STATE process.",
    sources: ["https://www.law.cornell.edu/cfr/text/45/147.136", "https://www.healthcare.gov/appeal-insurance-company-decision/"],
  },
  {
    id: "group-fully-insured",
    name: "Job-based plan (fully insured)",
    aka: ["employer plan through an insurance company", "fully-insured group"],
    category: "commercial",
    funding: "fully-insured",
    regulator: "Your state's Department of Insurance + (for job-based plans) US DOL/EBSA under ERISA",
    framework: "aca",
    weakerRights: false,
    howToIdentify:
      "You get it through work and the employer BUYS coverage from an insurance company (the insurer's name is on the card and pays claims).",
    notes:
      "Fully-insured group plans follow ERISA claim clocks AND ACA protections, and use the STATE external review process.",
    sources: ["https://www.law.cornell.edu/cfr/text/45/147.136"],
  },
  {
    id: "erisa-self-funded",
    name: "Job-based plan (self-funded / ERISA)",
    aka: ["self-insured employer plan", "ASO plan", "self-funded group health plan"],
    category: "commercial",
    funding: "self-funded",
    regulator: "US Department of Labor (EBSA) under ERISA — NOT your state insurance department",
    framework: "erisa",
    weakerRights: false,
    howToIdentify:
      "Your large employer PAYS claims itself and hires an insurer only to administer them (look for 'administered by' on the card; ask HR if the plan is self-funded).",
    notes:
      "Self-funded ERISA plans are exempt from state insurance law and use the FEDERAL external review process (HHS-administered/MAXIMUS or a private accredited IRO). State DOI complaints generally do not apply; escalate to US DOL/EBSA.",
    sources: ["https://www.dol.gov/agencies/ebsa", "https://www.law.cornell.edu/cfr/text/29/2560.503-1"],
  },
  {
    id: "medicare-advantage",
    name: "Medicare Advantage (Part C)",
    aka: ["Medicare Part C", "MA plan", "Medicare HMO/PPO"],
    category: "medicare",
    funding: "medicare-contracted",
    regulator: "Centers for Medicare & Medicaid Services (CMS)",
    framework: "medicare-advantage",
    weakerRights: false,
    howToIdentify:
      "A private plan that replaces Original Medicare (often with extra benefits); the card is from the private insurer, not red-white-blue Medicare.",
    notes:
      "Five appeal levels: plan reconsideration → Independent Review Entity (IRE) → OMHA ALJ → Medicare Appeals Council → federal court. Expedited (72-hour) track for urgent pre-service needs.",
    sources: ["https://www.medicare.gov/claims-appeals", "https://www.cms.gov/medicare/appeals-grievances/managed-care"],
  },
  {
    id: "medicare-part-d",
    name: "Medicare Part D (prescription drugs)",
    aka: ["Medicare drug plan", "PDP", "MA-PD drug coverage"],
    category: "medicare",
    funding: "medicare-contracted",
    regulator: "Centers for Medicare & Medicaid Services (CMS)",
    framework: "medicare-part-d",
    weakerRights: false,
    howToIdentify: "Your prescription-drug coverage under Medicare (standalone PDP or built into a Medicare Advantage plan).",
    notes:
      "Starts with a coverage determination / exception request, then redetermination, IRE, ALJ, Council, court. Expedited 24-hour track for urgent drugs.",
    sources: ["https://www.medicare.gov/claims-appeals/file-an-appeal/appeals-in-a-medicare-drug-plan-part-d"],
  },
  {
    id: "original-medicare",
    name: "Original Medicare (Parts A & B)",
    aka: ["Traditional Medicare", "fee-for-service Medicare"],
    category: "medicare",
    funding: "medicare",
    regulator: "Centers for Medicare & Medicaid Services (CMS)",
    framework: "original-medicare",
    weakerRights: false,
    howToIdentify: "You have the red-white-and-blue Medicare card and see any provider that accepts Medicare.",
    notes:
      "Appeals start from your Medicare Summary Notice (MSN): redetermination → reconsideration (QIC) → OMHA ALJ → Council → court. Special fast tracks (QIO/BFCC-QIO) for hospital-discharge and ending of SNF/home-health/hospice services.",
    sources: ["https://www.medicare.gov/claims-appeals/how-do-i-file-an-appeal"],
  },
  {
    id: "medicaid-managed-care",
    name: "Medicaid or CHIP (managed care)",
    aka: ["Medicaid MCO", "Medicaid health plan", "CHIP managed care"],
    category: "medicaid",
    funding: "medicaid",
    regulator: "Your state Medicaid agency, under federal rules (42 CFR Part 438) + CMS",
    framework: "medicaid-managed-care",
    weakerRights: false,
    howToIdentify: "Government coverage for lower income / disability delivered through a private health plan (an MCO) you chose or were assigned.",
    notes:
      "You must usually exhaust the plan's internal appeal before a State Fair Hearing. You can keep benefits during the appeal if you ask in time. Strong consumer protections, but timelines and steps vary by state.",
    sources: ["https://www.law.cornell.edu/cfr/text/42/part-438/subpart-F", "https://www.medicaid.gov/"],
  },
  {
    id: "medicaid-ffs",
    name: "Medicaid (fee-for-service)",
    aka: ["straight Medicaid", "traditional Medicaid"],
    category: "medicaid",
    funding: "medicaid",
    regulator: "Your state Medicaid agency, under federal rules (42 CFR Part 431) + CMS",
    framework: "medicaid-ffs",
    weakerRights: false,
    howToIdentify: "Government Medicaid coverage that is NOT through a private health plan — the state pays providers directly.",
    notes: "Appeals go straight to a State Fair Hearing; aid-paid-pending (keeping benefits) is available if requested in time. Timelines vary by state.",
    sources: ["https://www.law.cornell.edu/cfr/text/42/part-431/subpart-E"],
  },
  {
    id: "fehb",
    name: "Federal Employees Health Benefits (FEHB)",
    aka: ["federal employee plan", "OPM plan"],
    category: "government",
    funding: "fehb",
    regulator: "U.S. Office of Personnel Management (OPM)",
    framework: "fehb",
    weakerRights: false,
    howToIdentify: "Health coverage you have as a current or retired federal employee (e.g., BCBS FEP, GEHB).",
    notes:
      "Appeal the plan first, then ask OPM to review the disputed claim. FEHB is governed by OPM, not state law or the ACA external-review process.",
    sources: ["https://www.opm.gov/healthcare-insurance/healthcare/plan-information/disputed-claims/"],
  },
  {
    id: "tricare",
    name: "TRICARE (military)",
    aka: ["military health plan", "TRICARE Prime/Select"],
    category: "government",
    funding: "tricare",
    regulator: "Defense Health Agency (DHA)",
    framework: "tricare",
    weakerRights: false,
    howToIdentify: "Health coverage for active-duty/retired service members and families.",
    notes:
      "TRICARE has its own appeal process (reconsideration by the contractor, then formal review / independent hearing) with its own deadlines, distinct from ACA/ERISA.",
    sources: ["https://www.tricare.mil/appeals"],
  },
  {
    id: "cobra",
    name: "COBRA continuation coverage",
    aka: ["COBRA"],
    category: "commercial",
    funding: "varies",
    regulator: "Same as the underlying job-based plan (ERISA/EBSA or state DOI)",
    framework: "aca",
    weakerRights: false,
    howToIdentify: "You kept your former employer's plan after leaving a job by paying the full premium.",
    notes:
      "For appeals, COBRA coverage works like the underlying employer plan — follow that plan's framework (self-funded vs fully-insured). This entry defaults to the ACA/ERISA internal-appeal + external-review path; confirm whether the underlying plan is self-funded.",
    sources: ["https://www.dol.gov/general/topic/health-plans/cobra"],
  },
  {
    id: "short-term",
    name: "Short-term limited-duration plan",
    aka: ["short-term health insurance", "STLD", "temporary plan"],
    category: "commercial",
    funding: "fully-insured",
    regulator: "Mostly your state's Department of Insurance (NOT ACA-regulated)",
    framework: "short-term",
    weakerRights: true,
    howToIdentify: "A temporary, often cheap plan you bought to bridge a gap; it can deny pre-existing conditions and is not 'minimum essential coverage'.",
    notes:
      "These plans are NOT subject to the ACA's appeal/external-review guarantees. Your rights come from the policy and state law and are often weaker — read the policy and contact your state DOI.",
    sources: ["https://www.cms.gov/marketplace/private-health-insurance/short-term-limited-duration-insurance"],
  },
  {
    id: "student-health",
    name: "Student health plan",
    aka: ["college/university student health insurance"],
    category: "commercial",
    funding: "fully-insured",
    regulator: "Your state's Department of Insurance + ACA market rules (most student plans)",
    framework: "aca",
    weakerRights: false,
    howToIdentify: "Coverage offered through your college or university, usually underwritten by an insurer.",
    notes:
      "Most fully-insured student health plans follow individual-market ACA protections, but confirm — some self-funded university plans differ.",
    sources: ["https://www.law.cornell.edu/cfr/text/45/147.145"],
  },
];

const BY_ID = new Map(PLAN_TYPES.map((p) => [p.id, p]));

/** Return the full registry (optionally filtered by category). */
export function allPlanTypes(category) {
  return category ? PLAN_TYPES.filter((p) => p.category === category) : PLAN_TYPES.slice();
}

/** Look up a plan type by id. */
export function findPlanType(id) {
  return BY_ID.get(id) || null;
}
