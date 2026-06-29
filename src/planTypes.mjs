// planTypes.mjs — public helpers over the plan-type registry.
import { PLAN_TYPES, allPlanTypes, findPlanType } from "./data/planTypes.mjs";

export { PLAN_TYPES, allPlanTypes, findPlanType };

/** Get a plan type by id, or throw a friendly error listing valid ids. */
export function getPlanType(id) {
  const p = findPlanType(id);
  if (!p) {
    const ids = PLAN_TYPES.map((x) => x.id).join(", ");
    throw new Error(`Unknown plan type "${id}". Valid plan types: ${ids}`);
  }
  return p;
}

/**
 * Best-effort guess of a plan type from free text (for the "I don't know what I have" user).
 * Returns an array of { id, name, score } sorted best-first. Never throws.
 */
export function guessPlanType(text = "") {
  const q = String(text).toLowerCase();
  const scored = PLAN_TYPES.map((p) => {
    let score = 0;
    const hay = [p.name, ...(p.aka || []), p.notes || "", p.howToIdentify || ""]
      .join(" ")
      .toLowerCase();
    for (const word of q.split(/\W+/).filter((w) => w.length > 3)) {
      if (hay.includes(word)) score += 1;
    }
    if (p.aka?.some((a) => q.includes(a.toLowerCase()))) score += 3;
    return { id: p.id, name: p.name, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored;
}

/** Quick boolean: does this plan type have weaker-than-ACA appeal rights? */
export function hasWeakerRights(id) {
  const p = findPlanType(id);
  return !!(p && p.weakerRights);
}
