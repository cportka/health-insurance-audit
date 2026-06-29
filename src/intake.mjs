// intake.mjs — build a document intake checklist for a patient's scenario and plan type.
import { DOCUMENTS, SCENARIOS } from "./data/intakeChecklists.mjs";
import { getPlanType } from "./planTypes.mjs";
import { withDisclaimer } from "./disclaimer.mjs";

/** List the available intake scenarios (id + label). */
export function listScenarios() {
  return Object.entries(SCENARIOS).map(([id, s]) => ({ id, label: s.label }));
}

/**
 * Build a checklist for a scenario, optionally tailored to a plan type.
 * @param {object} args { scenario, planTypeId }
 * @returns {object} { scenario, planType, items, _disclaimer }
 */
export function buildChecklist({ scenario, planTypeId } = {}) {
  const def = SCENARIOS[scenario];
  if (!def) {
    const known = Object.keys(SCENARIOS).join(", ");
    throw new Error(`Unknown scenario "${scenario}". Known scenarios: ${known}`);
  }
  const plan = planTypeId ? getPlanType(planTypeId) : null;

  const toItem = (id, required) => {
    const doc = DOCUMENTS[id];
    return {
      id,
      name: doc.name,
      required,
      why: doc.why,
      howToGet: doc.howToGet,
    };
  };

  const items = [
    ...def.required.map((id) => toItem(id, true)),
    ...def.helpful.map((id) => toItem(id, false)),
  ];

  // Plan-type tailoring: Medicare uses CMS-1696 for representation; flag weaker-rights plans.
  const notes = [];
  if (plan) {
    if (/medicare/.test(plan.id)) {
      notes.push(
        "For Medicare, use Form CMS-1696 (Appointment of Representative) if someone is appealing for you.",
      );
    }
    if (plan.weakerRights) {
      notes.push(
        `Heads up: ${plan.name} plans often have weaker appeal protections than ACA/ERISA plans — ` +
          "confirm your specific appeal rights in the plan document before relying on standard timelines.",
      );
    }
    if (plan.id === "erisa-self-funded") {
      notes.push(
        "Self-funded job-based plans must give you your full claim file and the SPD free of charge — request them in writing.",
      );
    }
  }

  return withDisclaimer({
    scenario: { id: scenario, label: def.label },
    planType: plan ? { id: plan.id, name: plan.name } : null,
    items,
    notes,
    counts: { required: def.required.length, helpful: def.helpful.length },
  });
}
