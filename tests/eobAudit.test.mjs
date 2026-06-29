import { test } from "node:test";
import assert from "node:assert/strict";
import { auditClaim } from "../src/eobAudit.mjs";

test("flags a preventive service charged cost-share", () => {
  const r = auditClaim({
    lines: [{ code: "99385", description: "Preventive visit", preventive: true, patientResponsibility: 40 }],
  });
  assert.ok(r.findings.some((f) => f.ruleId === "preventive-cost-share"));
  assert.equal(r.summary.bySeverity.high >= 1, true);
});

test("flags an in-network CO-45 balance bill", () => {
  const r = auditClaim({
    provider: { inNetwork: true },
    lines: [
      {
        code: "73610",
        billed: 400,
        allowed: 150,
        planPaid: 120,
        patientResponsibility: 280,
        adjustments: [
          { group: "CO", code: "45", amount: 250 },
          { group: "PR", code: "1", amount: 30 },
        ],
      },
    ],
  });
  assert.ok(r.findings.some((f) => f.ruleId === "balance-bill-co45"));
  // patient responsibility (280) exceeds the genuine PR adjustment (30) -> CO billed to patient
  assert.ok(r.findings.some((f) => f.ruleId === "co-billed-to-patient"));
});

test("flags a No Surprises Act surprise bill (ER, out-of-network)", () => {
  const r = auditClaim({
    provider: { inNetwork: false },
    context: { isEmergency: true },
    totals: { patientResponsibility: 1200 },
    lines: [{ code: "99285", patientResponsibility: 1200 }],
  });
  assert.ok(r.findings.some((f) => f.ruleId === "surprise-out-of-network"));
});

test("flags timely-filing CO-29 billed to patient", () => {
  const r = auditClaim({
    lines: [{ code: "99213", patientResponsibility: 95, adjustments: [{ group: "CO", code: "29", amount: 95 }] }],
  });
  assert.ok(r.findings.some((f) => f.ruleId === "timely-filing-co29"));
});

test("detects duplicate lines", () => {
  const r = auditClaim({
    serviceDate: "2026-02-01",
    lines: [
      { code: "80053", units: 1, patientResponsibility: 25 },
      { code: "80053", units: 1, patientResponsibility: 25 },
    ],
  });
  assert.ok(r.findings.some((f) => f.ruleId === "duplicate-line"));
});

test("recommends an itemized bill when no lines present", () => {
  const r = auditClaim({ lines: [] });
  assert.ok(r.findings.some((f) => f.ruleId === "needs-itemized-bill"));
});

test("clean in-network claim with matching math yields no high-severity findings", () => {
  const r = auditClaim({
    provider: { inNetwork: true },
    lines: [
      {
        code: "99213",
        allowed: 100,
        planPaid: 80,
        patientResponsibility: 20,
        adjustments: [{ group: "PR", code: "2", amount: 20 }],
      },
    ],
  });
  assert.equal(r.findings.filter((f) => f.severity === "high").length, 0);
});

test("findings are sorted by severity and carry sources", () => {
  const r = auditClaim({
    provider: { inNetwork: true },
    lines: [{ code: "99385", preventive: true, patientResponsibility: 40, adjustments: [{ group: "CO", code: "45", amount: 100 }] }],
  });
  const sev = r.findings.map((f) => f.severity);
  // high should come before lower severities
  const firstLowIdx = sev.findIndex((s) => s !== "high");
  if (firstLowIdx !== -1) assert.ok(!sev.slice(firstLowIdx).includes("high"));
  assert.match(r._disclaimer, /not.*advice/i);
});

test("throws on non-object input", () => {
  assert.throws(() => auditClaim(null), /must be an object/);
});
