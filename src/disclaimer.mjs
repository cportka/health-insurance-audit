// disclaimer.mjs — the single source of truth for the not-legal-advice notice that must
// accompany every patient-facing output. Keeping it here means one place to update the language.

export const DISCLAIMER = [
  "This tool provides general information to help you understand and exercise your insurance",
  "appeal and grievance rights. It is NOT legal, medical, or tax advice, and it is not a",
  "substitute for your plan documents or a licensed professional. Deadlines and rules vary by",
  "plan, state, and your specific situation — always confirm the exact deadline on your denial",
  "notice and with your plan or the listed regulator before you rely on a date. When in doubt,",
  "file early. Free help is available: your State Insurance Department, the Consumer Assistance",
  "Program (CAP) in many states, a State Health Insurance Assistance Program (SHIP) for Medicare,",
  "your state Medicaid ombudsman, and the U.S. Department of Labor (EBSA) for job-based plans.",
].join(" ");

export const SHORT_DISCLAIMER =
  "General information, not legal/medical advice. Confirm every deadline on your own notice and " +
  "with your plan. When in doubt, file early.";

/** Attach the disclaimer to a result object under `_disclaimer` without mutating the input. */
export function withDisclaimer(result, short = false) {
  return { ...result, _disclaimer: short ? SHORT_DISCLAIMER : DISCLAIMER };
}
