// actionPlan.mjs — the brain. Given a patient's GOAL, assemble everything they can do into one
// ordered plan: deadlines, drafted letters, documents to gather, escalation, and free human help.
//
// This is the durable logic the eventual dead-simple consumer UI is a thin shell over. Each intent
// maps a plain-language goal to a concierge playbook built from the existing engines.
import { buildPathway } from "./navigator.mjs";
import { generateLetter } from "./letters.mjs";
import { buildChecklist } from "./intake.mjs";
import { getPlanType } from "./planTypes.mjs";
import { withDisclaimer } from "./disclaimer.mjs";

export const INTENTS = [
  {
    id: "overturn-denial",
    label: "I got a denial and want to do everything I can to overturn it",
    short: "Fight a denial",
  },
  {
    id: "grievance-underpayment",
    label: "My insurance keeps underpaying — I want to file a grievance",
    short: "File a grievance",
  },
];

const URGENCY_RANK = { now: 0, deadline: 1, soon: 2, ongoing: 3 };

/** Free human help tailored to the plan type. */
function freeHelp(plan) {
  const lines = ["You don't have to do this alone — free help is available:"];
  if (plan.category === "medicare") lines.push("• SHIP (State Health Insurance Assistance Program) — free Medicare counseling.");
  if (plan.category === "medicaid") lines.push("• Your state Medicaid managed-care ombudsman.");
  if (plan.id === "erisa-self-funded" || plan.category === "commercial") lines.push("• U.S. Department of Labor / EBSA — 1-866-444-3272 (job-based plans).");
  lines.push("• Your State Department of Insurance, and a Consumer Assistance Program (CAP) if your state has one.");
  return lines.join("\n");
}

/** Who to escalate a complaint to, by plan type. */
function regulator(plan) {
  if (plan.id === "erisa-self-funded") return "the U.S. Department of Labor (EBSA), 1-866-444-3272 — your state insurance department does not regulate self-funded plans";
  if (plan.category === "medicare") return "1-800-MEDICARE and your SHIP";
  if (plan.category === "medicaid") return "your state Medicaid agency and its managed-care ombudsman";
  return "your State Department of Insurance";
}

/** Map a denial type to the best intake scenario. */
function scenarioFor(denialType) {
  if (denialType === "drug") return "drug-denied";
  if (denialType === "pre-service") return "prior-auth-denied";
  if (denialType === "termination") return "claim-denied";
  return "claim-denied";
}

function gatherAction(scenario, planTypeId) {
  const checklist = buildChecklist({ scenario, planTypeId });
  const required = checklist.items.filter((i) => i.required);
  return {
    key: "gather",
    title: "Gather these documents",
    why: "You'll need them to back up your appeal — get them now so a deadline never catches you waiting.",
    urgency: "soon",
    documents: required.map((i) => ({ name: i.name, howToGet: i.howToGet })),
    sources: [],
  };
}

function buildOverturnDenial({ plan, denialType, denialDate, today, hasBill }) {
  const pathway = buildPathway({ planTypeId: plan.id, denialType, denialDate, today });
  const first = pathway.steps[0] || {};
  const actions = [];

  // 1. Get the evidence used against you (free, ERISA/ACA right) — do this immediately.
  actions.push({
    key: "claim-file",
    title: "Get the evidence they used to deny you",
    why: "It's free and often shows the denial was wrong — and you need the criteria to rebut it.",
    urgency: "now",
    letter: generateLetter({ type: "claim-file-request", context: {} }),
    sources: first.sources || [],
  });
  if (plan.category === "commercial") {
    actions.push({
      key: "plan-docs",
      title: "Demand your plan documents (SPD)",
      why: "Your plan's own rules decide what's covered — and they must give them to you free.",
      urgency: "now",
      letter: generateLetter({ type: "spd-request", context: {} }),
      sources: [],
    });
  }

  // 2. Continuation of benefits — only if care is being stopped, and it's the most time-critical.
  if (denialType === "termination") {
    actions.unshift({
      key: "continuation",
      title: "Keep your care going during the appeal — act today",
      why: "If you ask in time, your benefits continue while you appeal. Miss the window and you pay out of pocket.",
      urgency: "now",
      letter: generateLetter({ type: "continuation-of-benefits", context: {} }),
      sources: [],
    });
  }

  // 3. Get your doctor on record (for clinical denials) — the single biggest boost.
  actions.push({
    key: "medical-necessity",
    title: "Get your doctor on your side, in writing",
    why: "A letter of medical necessity tying your care to clinical guidelines is the strongest thing you can add.",
    urgency: "soon",
    do: "Ask your treating provider for a letter of medical necessity that answers the exact reason on your denial.",
    sources: [],
  });

  // 4. File the appeal — the core action, on the deadline.
  actions.push({
    key: "appeal",
    title: pathway.nextAction ? `File your appeal — ${pathway.nextAction.step}` : "File your internal appeal",
    why: "This is your formal challenge. It must be in before the deadline below.",
    urgency: "deadline",
    deadlineDate: first.fileByDate || null,
    daysRemaining: first.daysRemaining ?? null,
    deadlineText: pathway.nextAction ? `File by ${pathway.nextAction.fileBy}` : null,
    letter: generateLetter({ type: "internal-appeal", context: {} }),
    sources: first.sources || [],
  });

  // 5. Gather documents.
  actions.push(gatherAction(scenarioFor(denialType), plan.id));

  // 6. If billing is involved, audit it too.
  if (hasBill) {
    actions.push({
      key: "audit",
      title: "Check the bill for errors while you're at it",
      why: "Denials often come with billing mistakes you don't owe — they can be fixed without an appeal.",
      urgency: "soon",
      do: "Run your EOB/bill through the bill audit (the 'Audit a bill' tool) to catch charges you may not owe.",
      sources: [],
    });
  }

  // 7. Escalate to independent external review if they still say no.
  const ext = pathway.steps.find((s) => /external|reconsideration|fair hearing|ire/i.test(s.name));
  actions.push({
    key: "escalate",
    title: "If they still say no, demand an independent review",
    why: "An outside reviewer decides — and for most plans their decision is binding on the insurer.",
    urgency: "soon",
    letter: generateLetter({ type: "external-review-request", context: {} }),
    sources: ext?.sources || [],
  });

  // 8. Free help.
  actions.push({
    key: "help",
    title: "Get free expert help",
    why: "Trained advocates can do this with you at no cost.",
    urgency: "ongoing",
    do: freeHelp(plan),
    sources: [],
  });

  return {
    title: "Overturn your denial",
    summary: "Here's everything that gives you the best shot at overturning this — in order.",
    pathway,
    actions,
  };
}

function buildGrievanceUnderpayment({ plan, denialDate, today, hasBill }) {
  const pathway = buildPathway({ planTypeId: plan.id, denialType: "payment", denialDate, today });
  const first = pathway.steps[0] || {};
  const actions = [];

  actions.push({
    key: "gather",
    title: "Pull together the EOBs for the underpaid claims",
    why: "The pattern is your case — line them up so the underpayment is undeniable.",
    urgency: "now",
    documents: buildChecklist({ scenario: "balance-bill", planTypeId: plan.id })
      .items.filter((i) => i.required)
      .map((i) => ({ name: i.name, howToGet: i.howToGet })),
    sources: [],
  });

  actions.push({
    key: "audit",
    title: "Audit the payments for errors",
    why: "Find exactly how they're underpaying — contractual amounts billed to you, wrong allowed amounts, coordination-of-benefits mistakes.",
    urgency: "soon",
    do: "Run each EOB through the bill audit (the 'Audit a bill' tool) and note every underpayment.",
    sources: [],
  });

  actions.push({
    key: "appeal-claims",
    title: "Appeal the specific underpaid claims",
    why: "A grievance flags the pattern; an appeal actually recovers the money on each claim.",
    urgency: "deadline",
    deadlineDate: first.fileByDate || null,
    daysRemaining: first.daysRemaining ?? null,
    deadlineText: pathway.nextAction ? `File by ${pathway.nextAction.fileBy}` : null,
    letter: generateLetter({ type: "internal-appeal", context: {} }),
    sources: first.sources || [],
  });

  actions.push({
    key: "grievance",
    title: "File a grievance about the pattern",
    why: "This puts the systemic underpayment on the record and forces a written response.",
    urgency: "soon",
    letter: generateLetter({
      type: "grievance",
      context: { grievanceSubject: "a pattern of underpaying my claims below the plan's allowed amounts" },
    }),
    sources: [],
  });

  actions.push({
    key: "regulator",
    title: "Escalate the pattern to the regulator",
    why: "Systemic underpayment is exactly what regulators want reported — and it carries weight.",
    urgency: "soon",
    do: `Report the pattern to ${regulator(plan)}.`,
    sources: [],
  });

  actions.push({
    key: "help",
    title: "Get free expert help",
    why: "Trained advocates can do this with you at no cost.",
    urgency: "ongoing",
    do: freeHelp(plan),
    sources: [],
  });

  return {
    title: "File a grievance for underpayment",
    summary: "Here's how to document the underpayment, recover what you're owed, and put it on the record.",
    pathway,
    actions,
  };
}

/**
 * Build a complete action plan for a patient's goal.
 * @param {object} args
 *   intent      {string}  one of INTENTS[].id
 *   planTypeId  {string}  required (the one thing we genuinely need; the UI helps the user find it)
 *   denialType  {string}  optional (default depends on intent)
 *   denialDate  {string}  YYYY-MM-DD on the notice (optional but improves the deadline)
 *   hasBill     {boolean} whether a bill/EOB is involved
 *   today       {string}  test override
 * @returns {object} { intent, planType, title, summary, nextStep, actions, _disclaimer }
 */
export function buildActionPlan({ intent, planTypeId, denialType, denialDate, hasBill = false, today } = {}) {
  const plan = getPlanType(planTypeId); // throws helpfully if missing/unknown
  let built;
  if (intent === "overturn-denial") {
    built = buildOverturnDenial({ plan, denialType: denialType || "post-service", denialDate, today, hasBill });
  } else if (intent === "grievance-underpayment") {
    built = buildGrievanceUnderpayment({ plan, denialDate, today, hasBill });
  } else {
    const ids = INTENTS.map((i) => i.id).join(", ");
    throw new Error(`Unknown intent "${intent}". Valid intents: ${ids}`);
  }

  // Stable priority sort (now → deadline → soon → ongoing), preserving insertion order within a tier.
  const actions = built.actions
    .map((a, i) => ({ a, i }))
    .sort((x, y) => (URGENCY_RANK[x.a.urgency] ?? 9) - (URGENCY_RANK[y.a.urgency] ?? 9) || x.i - y.i)
    .map(({ a }) => a);

  const nextStep = actions[0] || null;

  return withDisclaimer({
    intent,
    planType: { id: plan.id, name: plan.name, regulator: plan.regulator },
    title: built.title,
    summary: built.summary,
    nextStep: nextStep
      ? { title: nextStep.title, why: nextStep.why, deadlineText: nextStep.deadlineText || null, deadlineDate: nextStep.deadlineDate || null }
      : null,
    outcomeOdds: built.pathway.outcomeOdds || null,
    actions,
  });
}
