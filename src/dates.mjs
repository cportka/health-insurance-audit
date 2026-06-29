// dates.mjs — small, dependency-free date arithmetic for deadline math.
// All functions are pure and operate on native Date objects (UTC-safe via date-only handling).

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parse a YYYY-MM-DD (or ISO) string to a UTC date at midnight. Returns null on bad input. */
export function parseDate(input) {
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  if (typeof input !== "string") return null;
  const m = input.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Format a Date as YYYY-MM-DD (UTC). */
export function formatDate(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** Add N calendar days. */
export function addDays(d, n) {
  return new Date(d.getTime() + n * MS_PER_DAY);
}

/** Add N months, clamping to the end of the target month (e.g. Jan 31 + 1mo -> Feb 28/29). */
export function addMonths(d, n) {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  const target = new Date(Date.UTC(y, m + n, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

/** Add N business days (skip Sat/Sun). Does not account for federal holidays. */
export function addBusinessDays(d, n) {
  let result = new Date(d.getTime());
  let added = 0;
  const step = n >= 0 ? 1 : -1;
  const count = Math.abs(n);
  while (added < count) {
    result = addDays(result, step);
    const dow = result.getUTCDay();
    if (dow !== 0 && dow !== 6) added += 1;
  }
  return result;
}

/**
 * Add a structured duration to a date.
 * duration: { amount: number, unit: "days"|"months"|"hours", businessDays?: boolean }
 * Hours are converted to whole days (ceil) for deadline-date purposes, but the raw hours are
 * preserved by callers for display. Returns a Date.
 */
export function addDuration(d, duration) {
  if (!duration || typeof duration.amount !== "number") return d;
  const { amount, unit, businessDays } = duration;
  if (unit === "months") return addMonths(d, amount);
  if (unit === "hours") return addDays(d, Math.ceil(amount / 24));
  // default: days
  return businessDays ? addBusinessDays(d, amount) : addDays(d, amount);
}

/** Whole days from `from` to `to` (to - from). Negative if `to` is before `from`. */
export function daysBetween(from, to) {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/** Human string for a structured duration, e.g. {amount:180,unit:"days"} -> "180 days". */
export function durationLabel(duration) {
  if (!duration || typeof duration.amount !== "number") return "no fixed deadline";
  const { amount, unit, businessDays } = duration;
  if (unit === "hours") return `${amount} hours`;
  if (unit === "months") return `${amount} month${amount === 1 ? "" : "s"}`;
  return `${amount} ${businessDays ? "business " : ""}day${amount === 1 ? "" : "s"}`;
}
