import { test } from "node:test";
import assert from "node:assert/strict";
import { generateLetter, listLetterTypes } from "../src/letters.mjs";

test("lists the core letter templates", () => {
  const ids = listLetterTypes().map((t) => t.id);
  for (const id of ["internal-appeal", "external-review-request", "grievance", "claim-file-request"]) {
    assert.ok(ids.includes(id), `missing template ${id}`);
  }
});

test("internal appeal merges context and requests the claim file", () => {
  const r = generateLetter({
    type: "internal-appeal",
    context: { memberName: "Jane Doe", claimNumber: "ABC123", denialReason: "not medically necessary" },
  });
  assert.match(r.body, /Jane Doe/);
  assert.match(r.body, /ABC123/);
  assert.match(r.body, /claim file/i);
  assert.match(r.subject, /ABC123/);
});

test("missing fields surface as placeholders", () => {
  const r = generateLetter({ type: "internal-appeal", context: {} });
  assert.ok(r.placeholders.length > 0);
  assert.ok(r.placeholders.some((p) => /YOUR FULL NAME/.test(p)));
});

test("external review letter mentions IRO and is binding", () => {
  const r = generateLetter({ type: "external-review-request", context: {} });
  assert.match(r.body, /Independent Review Organization|IRO/);
  assert.match(r.body, /binding/i);
});

test("no surprises complaint references the help desk", () => {
  const r = generateLetter({ type: "no-surprises-complaint", context: {} });
  assert.match(r.howToSend, /1-800-985-3059|nosurprises/);
});

test("unknown type throws with the available list", () => {
  assert.throws(() => generateLetter({ type: "nope" }), /Unknown letter type/);
});

test("every letter carries a disclaimer and attachments", () => {
  for (const { id } of listLetterTypes()) {
    const r = generateLetter({ type: id, context: {} });
    assert.match(r._disclaimer, /not.*advice/i);
    assert.ok(Array.isArray(r.attachments));
  }
});
