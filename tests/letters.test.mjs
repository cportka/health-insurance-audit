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

test("continuation-of-benefits letter is time-critical and requests unchanged benefits", () => {
  const r = generateLetter({ type: "continuation-of-benefits", context: {} });
  assert.match(r.body, /continue|continuation/i);
  assert.match(r.howToSend, /10 days|IMMEDIATELY|time-critical/i);
});

test("records-request cites the HIPAA right of access and 30-day clock", () => {
  const r = generateLetter({ type: "records-request", context: {} });
  assert.match(r.body, /164\.524|HIPAA/);
  assert.match(r.body, /30 days/);
});

test("spd-request cites the ERISA penalty", () => {
  const r = generateLetter({ type: "spd-request", context: {} });
  assert.match(r.body, /\$110 per day|ERISA/);
});

test("every letter carries a disclaimer and attachments", () => {
  for (const { id } of listLetterTypes()) {
    const r = generateLetter({ type: id, context: {} });
    assert.match(r._disclaimer, /not.*advice/i);
    assert.ok(Array.isArray(r.attachments));
  }
});
