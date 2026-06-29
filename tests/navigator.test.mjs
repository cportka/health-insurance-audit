import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPathway, DENIAL_TYPES } from "../src/navigator.mjs";
import { PATHWAYS } from "../src/data/pathways.mjs";
import { statsForFramework, GENERAL_STATS } from "../src/data/outcomeStats.mjs";

test("ACA post-service pathway computes the 180-day internal deadline", () => {
  const r = buildPathway({
    planTypeId: "aca-individual",
    denialType: "post-service",
    denialDate: "2026-01-01",
    today: "2026-01-15",
  });
  const internal = r.steps[0];
  assert.equal(internal.key, "internal-appeal");
  // 2026-01-01 + 180 days = 2026-06-30
  assert.equal(internal.fileByDate, "2026-06-30");
  assert.equal(internal.status, "ok");
  assert.ok(internal.daysRemaining > 100);
  assert.match(internal.decisionWithin, /60 days/); // post-service appeal decision
});

test("urgent denial selects the 72-hour decision clock", () => {
  const r = buildPathway({ planTypeId: "aca-individual", denialType: "urgent" });
  assert.match(r.steps[0].decisionWithin, /72 hours/);
});

test("overdue filing produces a warning and overdue status", () => {
  const r = buildPathway({
    planTypeId: "aca-individual",
    denialType: "post-service",
    denialDate: "2024-01-01",
    today: "2026-01-01",
  });
  assert.equal(r.steps[0].status, "overdue");
  assert.ok(r.warnings.some((w) => /may have passed/.test(w)));
});

test("self-funded ERISA uses the federal external review", () => {
  const r = buildPathway({ planTypeId: "erisa-self-funded" });
  const external = r.steps.find((s) => s.key === "external-review");
  assert.match(external.decidedBy, /HHS|MAXIMUS|federal/i);
});

test("Original Medicare exposes the 5 levels with thresholds", () => {
  const r = buildPathway({ planTypeId: "original-medicare", denialType: "post-service" });
  assert.equal(r.steps.length, 5);
  assert.equal(r.steps[0].key, "redetermination");
  assert.ok(r.steps.some((s) => s.amountInControversy));
});

test("weaker-rights plan surfaces a warning", () => {
  const r = buildPathway({ planTypeId: "short-term" });
  assert.ok(r.warnings.some((w) => /weaker|confirm/i.test(w)));
});

test("every step in every framework has an authority citation", () => {
  for (const [fw, p] of Object.entries(PATHWAYS)) {
    for (const s of p.steps) {
      assert.ok(s.authority, `${fw}/${s.key} missing authority`);
      assert.ok(Array.isArray(s.sources) && s.sources.length, `${fw}/${s.key} missing sources`);
    }
  }
});

test("result carries the disclaimer", () => {
  const r = buildPathway({ planTypeId: "aca-individual" });
  assert.match(r._disclaimer, /not.*advice/i);
});

test("navigator surfaces plan-specific outcome odds with sources", () => {
  const ma = buildPathway({ planTypeId: "medicare-advantage" });
  assert.ok(ma.outcomeOdds.headline);
  assert.match(ma.outcomeOdds.detail, /75%/); // OIG MA prior-auth overturn
  assert.ok(ma.outcomeOdds.sources.length > 0);
  const aca = buildPathway({ planTypeId: "aca-individual" });
  assert.match(aca.outcomeOdds.detail, /1%|appeal/i);
});

test("statsForFramework falls back to a general nudge", () => {
  assert.equal(statsForFramework("does-not-exist"), GENERAL_STATS);
});

test("termination denial warns about continuation of benefits", () => {
  const r = buildPathway({ planTypeId: "medicaid-managed-care", denialType: "termination" });
  assert.ok(r.warnings.some((w) => /continuation of benefits|keep your current benefits/i.test(w)));
});

test("payment denial selects the Part D 14-day payment clock", () => {
  const r = buildPathway({ planTypeId: "medicare-part-d", denialType: "payment" });
  const redetermination = r.steps.find((s) => s.key === "redetermination");
  assert.match(redetermination.decisionWithin, /14 days/);
});

test("DENIAL_TYPES includes payment and termination", () => {
  assert.ok(DENIAL_TYPES.includes("payment"));
  assert.ok(DENIAL_TYPES.includes("termination"));
});
