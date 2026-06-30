import { test } from "node:test";
import assert from "node:assert/strict";
import { buildActionPlan, INTENTS } from "../src/actionPlan.mjs";

test("INTENTS expose the two primary use cases", () => {
  const ids = INTENTS.map((i) => i.id);
  assert.ok(ids.includes("overturn-denial"));
  assert.ok(ids.includes("grievance-underpayment"));
});

test("overturn-denial assembles a complete, ordered plan", () => {
  const plan = buildActionPlan({
    intent: "overturn-denial",
    planTypeId: "aca-individual",
    denialType: "post-service",
    denialDate: "2026-06-01",
    today: "2026-06-15",
    hasBill: true,
  });
  assert.equal(plan.title, "Overturn your denial");
  assert.ok(plan.actions.length >= 5);
  // includes the core moves
  const keys = plan.actions.map((a) => a.key);
  for (const k of ["claim-file", "appeal", "gather", "escalate", "help"]) {
    assert.ok(keys.includes(k), `missing action ${k}`);
  }
  // the appeal action carries a drafted letter and a real deadline date
  const appeal = plan.actions.find((a) => a.key === "appeal");
  assert.ok(appeal.letter && appeal.letter.body, "appeal action has a drafted letter");
  assert.equal(appeal.deadlineDate, "2026-11-28"); // 2026-06-01 + 180 days
  // hasBill adds the audit step
  assert.ok(keys.includes("audit"));
});

test("the single next step is the most urgent action", () => {
  const plan = buildActionPlan({
    intent: "overturn-denial",
    planTypeId: "aca-individual",
    denialType: "post-service",
    denialDate: "2026-06-01",
    today: "2026-06-15",
  });
  assert.ok(plan.nextStep);
  // a "now" action (get the evidence) outranks the deadline action
  assert.equal(plan.actions[0].urgency, "now");
});

test("termination puts continuation-of-benefits first (most time-critical)", () => {
  const plan = buildActionPlan({
    intent: "overturn-denial",
    planTypeId: "medicaid-managed-care",
    denialType: "termination",
  });
  assert.equal(plan.actions[0].key, "continuation");
  assert.match(plan.actions[0].title, /Keep your care going/i);
});

test("grievance-underpayment routes to audit + grievance + appeal", () => {
  const plan = buildActionPlan({ intent: "grievance-underpayment", planTypeId: "group-fully-insured" });
  const keys = plan.actions.map((a) => a.key);
  for (const k of ["gather", "audit", "appeal-claims", "grievance", "regulator", "help"]) {
    assert.ok(keys.includes(k), `missing action ${k}`);
  }
  const grievance = plan.actions.find((a) => a.key === "grievance");
  assert.ok(grievance.letter.body.length > 0);
});

test("self-funded ERISA escalates to DOL, not the state", () => {
  const plan = buildActionPlan({ intent: "grievance-underpayment", planTypeId: "erisa-self-funded" });
  const reg = plan.actions.find((a) => a.key === "regulator");
  assert.match(reg.do, /Department of Labor|EBSA/i);
});

test("plan carries outcome odds, a next step, and the disclaimer", () => {
  const plan = buildActionPlan({ intent: "overturn-denial", planTypeId: "medicare-advantage" });
  assert.ok(plan.outcomeOdds && plan.outcomeOdds.headline);
  assert.ok(plan.nextStep.title);
  assert.match(plan._disclaimer, /not.*advice/i);
});

test("unknown intent and missing plan throw helpfully", () => {
  assert.throws(() => buildActionPlan({ intent: "nope", planTypeId: "aca-individual" }), /Unknown intent/);
  assert.throws(() => buildActionPlan({ intent: "overturn-denial", planTypeId: "nope" }), /Unknown plan type/);
});
