import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allPlanTypes,
  findPlanType,
  getPlanType,
  guessPlanType,
  hasWeakerRights,
} from "../src/planTypes.mjs";
import { PATHWAYS } from "../src/data/pathways.mjs";

test("registry covers the major plan categories", () => {
  const cats = new Set(allPlanTypes().map((p) => p.category));
  for (const c of ["commercial", "medicare", "medicaid", "government"]) {
    assert.ok(cats.has(c), `missing category ${c}`);
  }
  assert.ok(allPlanTypes().length >= 10, "expected at least 10 plan types");
});

test("every plan type points at a defined pathway framework", () => {
  for (const p of allPlanTypes()) {
    assert.ok(PATHWAYS[p.framework], `plan ${p.id} -> unknown framework ${p.framework}`);
  }
});

test("every plan type has a source citation", () => {
  for (const p of allPlanTypes()) {
    assert.ok(Array.isArray(p.sources) && p.sources.length > 0, `plan ${p.id} has no sources`);
  }
});

test("getPlanType throws helpfully on unknown id", () => {
  assert.throws(() => getPlanType("nope"), /Unknown plan type/);
  assert.equal(getPlanType("aca-individual").id, "aca-individual");
});

test("short-term is flagged as weaker rights", () => {
  assert.equal(hasWeakerRights("short-term"), true);
  assert.equal(hasWeakerRights("aca-individual"), false);
});

test("guessPlanType finds self-funded from a description", () => {
  const guesses = guessPlanType("through my job, big employer pays the claims itself, self-insured");
  assert.ok(guesses.length > 0);
  assert.ok(guesses.some((g) => g.id === "erisa-self-funded"));
});

test("findPlanType returns null for unknown", () => {
  assert.equal(findPlanType("xyz"), null);
});
