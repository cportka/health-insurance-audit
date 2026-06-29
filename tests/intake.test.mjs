import { test } from "node:test";
import assert from "node:assert/strict";
import { buildChecklist, listScenarios } from "../src/intake.mjs";

test("lists scenarios", () => {
  const ids = listScenarios().map((s) => s.id);
  assert.ok(ids.includes("claim-denied"));
  assert.ok(ids.includes("surprise-bill"));
});

test("claim-denied checklist requires the denial letter and EOB", () => {
  const r = buildChecklist({ scenario: "claim-denied" });
  const required = r.items.filter((i) => i.required).map((i) => i.id);
  assert.ok(required.includes("denialLetter"));
  assert.ok(required.includes("eob"));
  assert.ok(r.items.every((i) => i.why && i.howToGet));
});

test("Medicare plan adds the CMS-1696 note", () => {
  const r = buildChecklist({ scenario: "claim-denied", planTypeId: "medicare-advantage" });
  assert.ok(r.notes.some((n) => /CMS-1696/.test(n)));
});

test("self-funded plan adds the claim-file rights note", () => {
  const r = buildChecklist({ scenario: "claim-denied", planTypeId: "erisa-self-funded" });
  assert.ok(r.notes.some((n) => /claim file|SPD/i.test(n)));
});

test("weaker-rights plan warns the user", () => {
  const r = buildChecklist({ scenario: "claim-denied", planTypeId: "short-term" });
  assert.ok(r.notes.some((n) => /weaker/i.test(n)));
});

test("unknown scenario throws", () => {
  assert.throws(() => buildChecklist({ scenario: "nope" }), /Unknown scenario/);
});

test("checklist carries a disclaimer", () => {
  const r = buildChecklist({ scenario: "surprise-bill" });
  assert.match(r._disclaimer, /not.*advice/i);
});
