// eobAudit.mjs — run the EOB/bill audit rules engine over a normalized claim.
import { RULES, SEVERITY_ORDER } from "./data/eobRules.mjs";
import { withDisclaimer } from "./disclaimer.mjs";

/**
 * Audit a claim/EOB for likely billing errors and patient-protection issues.
 * @param {object} claim normalized claim (see docs/ARCHITECTURE.md → "Claim shape")
 * @param {object} [opts] { rules } to override the rule set (mainly for tests)
 * @returns {object} { findings, summary, _disclaimer }
 */
export function auditClaim(claim, opts = {}) {
  if (!claim || typeof claim !== "object") {
    throw new TypeError("auditClaim(claim): claim must be an object");
  }
  const ruleSet = opts.rules || RULES;
  const findings = [];

  for (const rule of ruleSet) {
    let raw;
    try {
      raw = rule.evaluate(claim) || [];
    } catch (err) {
      raw = [];
    }
    for (const f of raw) {
      findings.push({
        ruleId: rule.id,
        category: rule.category,
        severity: rule.severity,
        sources: rule.sources || [],
        ...f,
      });
    }
  }

  findings.sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9) ||
      a.ruleId.localeCompare(b.ruleId),
  );

  const potentialSavings = findings.reduce(
    (s, f) => s + (Number.isFinite(Number(f.estimatedImpact)) ? Number(f.estimatedImpact) : 0),
    0,
  );
  const bySeverity = findings.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {});

  return withDisclaimer({
    findings,
    summary: {
      total: findings.length,
      bySeverity,
      potentialPatientSavings: Math.round((potentialSavings + Number.EPSILON) * 100) / 100,
      rulesRun: ruleSet.length,
    },
  });
}
