// index.mjs — public API for the health-insurance-audit library.
//
// Everything here is offline and dependency-free. No patient data leaves the process.

export { DISCLAIMER, SHORT_DISCLAIMER, withDisclaimer } from "./disclaimer.mjs";

export {
  PLAN_TYPES,
  allPlanTypes,
  findPlanType,
  getPlanType,
  guessPlanType,
  hasWeakerRights,
} from "./planTypes.mjs";

export { buildPathway } from "./navigator.mjs";
export { PATHWAYS } from "./data/pathways.mjs";

export { generateLetter, listLetterTypes } from "./letters.mjs";

export { auditClaim } from "./eobAudit.mjs";

export { buildChecklist, listScenarios } from "./intake.mjs";

export { listConnectors, getConnector } from "./connectors/index.mjs";

export const VERSION_NOTE =
  "Health Insurance Audit & Grievance Filer — general information, not legal/medical advice.";
