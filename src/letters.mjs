// letters.mjs — generate an appeal/grievance letter from a template + the patient's context.
import { TEMPLATES } from "./data/letterTemplates.mjs";
import { withDisclaimer } from "./disclaimer.mjs";

/** List available letter types (id + label). */
export function listLetterTypes() {
  return Object.entries(TEMPLATES).map(([id, t]) => ({ id, label: t.label }));
}

/**
 * Generate a letter.
 * @param {object} args { type, context }
 * @returns {object} { type, subject, body, attachments, howToSend, _disclaimer }
 */
export function generateLetter({ type, context = {} } = {}) {
  const tpl = TEMPLATES[type];
  if (!tpl) {
    const ids = Object.keys(TEMPLATES).join(", ");
    throw new Error(`Unknown letter type "${type}". Available: ${ids}`);
  }
  // Default the date to today (YYYY-MM-DD) if not supplied.
  const ctx = { ...context };
  if (!ctx.date) ctx.date = new Date().toISOString().slice(0, 10);

  const { subject, body, attachments, howToSend } = tpl.build(ctx);

  // Surface which placeholders the user still needs to fill in.
  const placeholders = Array.from(new Set((body.match(/\[[^\]]+\]/g) || []).map((s) => s.slice(1, -1))));

  return withDisclaimer({
    type,
    label: tpl.label,
    subject,
    body,
    attachments: attachments || [],
    howToSend: howToSend || "",
    placeholders,
  });
}
