// navigator.mjs — Deadline & Pathway Navigator.
//
// Given a plan type, the kind of denial, and the key dates from the patient's notice, produce the
// ordered appeal/grievance pathway with each step's filing deadline, who decides it, how long they
// have to decide, and the governing authority. The first step's deadline is computed as a concrete
// date from the denial date; later steps are shown as relative windows (we can't know future denial
// dates yet) and recomputed as the patient advances.
import { getPlanType } from "./planTypes.mjs";
import { PATHWAYS } from "./data/pathways.mjs";
import { parseDate, formatDate, addDuration, daysBetween, durationLabel } from "./dates.mjs";
import { withDisclaimer } from "./disclaimer.mjs";

/**
 * @param {object} args
 *   planTypeId   {string}  e.g. "aca-individual"
 *   denialType   {string}  "pre-service" | "post-service" | "urgent" | "drug" | "grievance"
 *   denialDate   {string}  YYYY-MM-DD on the denial notice (optional but recommended)
 *   today        {string}  YYYY-MM-DD override for testing (defaults to system date)
 * @returns {object} { planType, framework, denialType, steps, nextAction, warnings, _disclaimer }
 */
export function buildPathway({ planTypeId, denialType = "post-service", denialDate, today } = {}) {
  const plan = getPlanType(planTypeId);
  const pathway = PATHWAYS[plan.framework];
  if (!pathway) {
    throw new Error(`No pathway defined for framework "${plan.framework}" (plan ${plan.id}).`);
  }

  const denial = denialDate ? parseDate(denialDate) : null;
  const now = today ? parseDate(today) : new Date();
  const warnings = [];

  if (denialDate && !denial) warnings.push(`Could not parse denialDate "${denialDate}" (use YYYY-MM-DD).`);
  if (plan.weakerRights) {
    warnings.push(
      `${plan.name} plans may not have the standardized federal appeal protections — confirm your ` +
        `exact rights and deadlines in your policy and with ${plan.regulator}.`,
    );
  }

  const steps = pathway.steps.map((step, idx) => {
    const clock = pickDecisionClock(step, denialType);
    const out = {
      order: idx + 1,
      key: step.key,
      name: step.name,
      what: step.what || "",
      decidedBy: step.decidedBy,
      fileWithin: step.fileWithin ? durationLabel(step.fileWithin) : null,
      fileFrom: step.fileFrom || (idx === 0 ? "the date on your denial notice" : "the previous denial"),
      decisionWithin: clock ? durationLabel(clock) : step.decisionNote || null,
      expedited: step.expedited || null,
      authority: step.authority || null,
      amountInControversy: step.amountInControversy || null,
      binding: step.binding || false,
      sources: step.sources || [],
    };

    // Concretely date the FIRST step's filing deadline from the denial date.
    if (idx === 0 && denial && step.fileWithin) {
      const due = addDuration(denial, step.fileWithin);
      out.fileByDate = formatDate(due);
      if (now) {
        const left = daysBetween(now, due);
        out.daysRemaining = left;
        out.status = left < 0 ? "overdue" : left <= 14 ? "urgent" : "ok";
        if (left < 0) {
          warnings.push(
            `The standard window to file the ${step.name.toLowerCase()} may have passed ` +
              `(${out.fileByDate}). You may still have options — ask the plan about good cause / ` +
              `deemed exhaustion and contact ${plan.regulator} right away.`,
          );
        }
      }
    }
    return out;
  });

  const firstActionable = steps.find((s) => s.status !== "overdue") || steps[0];

  return withDisclaimer({
    planType: { id: plan.id, name: plan.name, regulator: plan.regulator, funding: plan.funding },
    framework: { id: pathway.id, name: pathway.name, appliesTo: pathway.appliesTo || null },
    denialType,
    grievanceNote: pathway.grievanceNote || null,
    steps,
    nextAction: firstActionable
      ? {
          step: firstActionable.name,
          fileBy: firstActionable.fileByDate || `within ${firstActionable.fileWithin || "the stated window"}`,
          decidedBy: firstActionable.decidedBy,
        }
      : null,
    warnings,
  });
}

// Choose the right decision clock for a step given the denial type. Steps may define a single
// `decisionWithin` (duration) or a map keyed by pre-service/post-service/urgent/standard/expedited.
function pickDecisionClock(step, denialType) {
  const dw = step.decisionWithin;
  if (!dw) return null;
  if (typeof dw.amount === "number") return dw; // single duration
  if (denialType === "urgent") return dw.urgent || dw.expedited || dw.preService || dw.standard || null;
  if (denialType === "pre-service") return dw.preService || dw.standard || null;
  if (denialType === "drug") return dw.standard || dw.preService || null;
  return dw.postService || dw.standard || null;
}
