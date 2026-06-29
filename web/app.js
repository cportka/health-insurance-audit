// app.js — front end for the Health Insurance Audit & Grievance Filer.
// Imports the dependency-free library directly (same engine the CLI uses). 100% client-side.
import {
  allPlanTypes,
  guessPlanType,
  getPlanType,
  buildPathway,
  DENIAL_TYPES,
  listLetterTypes,
  generateLetter,
  auditClaim,
  listScenarios,
  buildChecklist,
  DISCLAIMER,
} from "../src/index.mjs";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const srcLinks = (sources = []) =>
  sources.length
    ? `<p class="src">${sources.map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener">source ↗</a>`).join("")}</p>`
    : "";

const state = { planTypeId: "" };

const DENIAL_LABELS = {
  "pre-service": "A service I need approved before getting it",
  "post-service": "Care I already got (a claim was denied/underpaid)",
  payment: "A payment/reimbursement claim",
  urgent: "Urgent — waiting could seriously harm my health",
  termination: "An approved service is being stopped or reduced",
  drug: "A prescription drug",
  grievance: "A complaint about service or quality of care",
};

// ---------- init ----------
function init() {
  // plan picker (grouped by category)
  const sel = $("#plan-select");
  const cats = { commercial: "Job-based & individual", medicare: "Medicare", medicaid: "Medicaid / CHIP", government: "Government (FEHB / TRICARE)" };
  const byCat = {};
  for (const p of allPlanTypes()) (byCat[p.category] ||= []).push(p);
  for (const [cat, label] of Object.entries(cats)) {
    if (!byCat[cat]) continue;
    const og = document.createElement("optgroup");
    og.label = label;
    for (const p of byCat[cat]) {
      const o = document.createElement("option");
      o.value = p.id;
      o.textContent = p.name + (p.weakerRights ? "  ⚠ weaker rights" : "");
      og.appendChild(o);
    }
    sel.appendChild(og);
  }

  // denial types
  const dsel = $("#denial-type");
  for (const t of DENIAL_TYPES) {
    const o = document.createElement("option");
    o.value = t;
    o.textContent = DENIAL_LABELS[t] || t;
    if (t === "post-service") o.selected = true;
    dsel.appendChild(o);
  }

  // letter types
  const lsel = $("#letter-type");
  for (const t of listLetterTypes()) {
    const o = document.createElement("option");
    o.value = t.id;
    o.textContent = t.label;
    lsel.appendChild(o);
  }

  // scenarios
  const ssel = $("#scenario-select");
  for (const s of listScenarios()) {
    const o = document.createElement("option");
    o.value = s.id;
    o.textContent = s.label;
    ssel.appendChild(o);
  }

  $("#full-disclaimer").textContent = DISCLAIMER;
  $("#version-note").textContent = "Health Insurance Audit & Grievance Filer";

  wireTabs();
  $("#plan-select").addEventListener("change", onPlanChange);
  $("#plan-guess-btn").addEventListener("click", onGuess);
  $("#navigate-btn").addEventListener("click", onNavigate);
  $("#add-line").addEventListener("click", () => addLineRow());
  $("#audit-example").addEventListener("click", loadExample);
  $("#audit-btn").addEventListener("click", onAudit);
  $("#letter-btn").addEventListener("click", onLetter);
  $("#checklist-btn").addEventListener("click", onChecklist);
  $$("[data-goto]").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.goto)));

  addLineRow(); // start with one audit line
}

// ---------- tabs ----------
function wireTabs() {
  $$(".tab").forEach((tab) => tab.addEventListener("click", () => showTab(tab.dataset.tab)));
}
function showTab(name) {
  $$(".tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === name)));
  $$(".panel").forEach((p) => (p.hidden = p.id !== `panel-${name}`));
  if (name === "deadlines" || name === "documents") refreshPlanLabels();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- start / plan ----------
function onPlanChange(e) {
  state.planTypeId = e.target.value;
  const box = $("#plan-info");
  if (!state.planTypeId) {
    box.hidden = true;
    $("#start-next").hidden = true;
    return;
  }
  const p = getPlanType(state.planTypeId);
  box.hidden = false;
  box.classList.toggle("weaker", !!p.weakerRights);
  box.innerHTML = `
    <h3>${esc(p.name)}</h3>
    <p>${esc(p.notes || "")}</p>
    <p><strong>Who oversees appeals:</strong> ${esc(p.regulator)}</p>
    ${p.weakerRights ? `<p>⚠ <strong>Heads up:</strong> these plans often have weaker appeal protections — confirm your exact rights in your policy.</p>` : ""}
    <p class="muted"><em>How to tell:</em> ${esc(p.howToIdentify || "")}</p>`;
  $("#start-next").hidden = false;
  refreshPlanLabels();
}
function onGuess() {
  const text = $("#plan-guess-input").value;
  const box = $("#plan-guess-results");
  const guesses = guessPlanType(text).slice(0, 4);
  if (!guesses.length) {
    box.innerHTML = `<span class="empty-hint">No confident guess — pick from the list above.</span>`;
    return;
  }
  box.innerHTML = "";
  for (const g of guesses) {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = g.name;
    b.addEventListener("click", () => {
      $("#plan-select").value = g.id;
      $("#plan-select").dispatchEvent(new Event("change"));
    });
    box.appendChild(b);
  }
}
function refreshPlanLabels() {
  const label = state.planTypeId
    ? `Plan: ${getPlanType(state.planTypeId).name}`
    : "Pick your plan type on the Start tab first.";
  $("#deadlines-plan-label").textContent = label;
}

// ---------- deadlines ----------
function onNavigate() {
  const box = $("#navigate-results");
  if (!state.planTypeId) {
    box.innerHTML = `<p class="empty-hint">Choose your plan type on the <button class="linkbtn" data-goto="start">Start tab</button> first.</p>`;
    $("[data-goto]", box)?.addEventListener("click", () => showTab("start"));
    return;
  }
  const r = buildPathway({
    planTypeId: state.planTypeId,
    denialType: $("#denial-type").value,
    denialDate: $("#denial-date").value || undefined,
  });
  const odds = r.outcomeOdds
    ? `<div class="odds"><strong>💪 ${esc(r.outcomeOdds.headline)}</strong><p>${esc(r.outcomeOdds.detail)}</p>${srcLinks(r.outcomeOdds.sources)}</div>`
    : "";
  const next = r.nextAction
    ? `<div class="nextaction">➡ Next: ${esc(r.nextAction.step)} — file by ${esc(r.nextAction.fileBy)} <span class="muted">(decided by ${esc(r.nextAction.decidedBy)})</span></div>`
    : "";
  const steps = r.steps
    .map((s) => {
      const bits = [];
      if (s.fileWithin) bits.push(`<li><strong>File within:</strong> ${esc(s.fileWithin)} of ${esc(s.fileFrom)}${s.fileByDate ? ` — by <strong>${esc(s.fileByDate)}</strong>${s.daysRemaining != null ? ` (${s.daysRemaining} days left)` : ""}` : ""}</li>`);
      if (s.decisionWithin) bits.push(`<li><strong>They must decide within:</strong> ${esc(s.decisionWithin)}</li>`);
      if (s.expedited) bits.push(`<li>${esc(s.expedited)}</li>`);
      if (s.amountInControversy) bits.push(`<li><strong>Minimum amount in dispute:</strong> ${esc(s.amountInControversy)}</li>`);
      if (s.authority) bits.push(`<li class="muted">Authority: ${esc(s.authority)}</li>`);
      const badge = s.status ? `<span class="pill ${esc(s.status)}">${esc(s.status)}</span>` : "";
      return `<div class="step"><h3><span>${s.order}. ${esc(s.name)} ${badge}</span></h3>
        <div class="who">Decided by ${esc(s.decidedBy)}</div>
        <ul>${bits.join("")}</ul>${srcLinks(s.sources)}</div>`;
    })
    .join("");
  const warns = r.warnings.length
    ? `<div class="warnings">${r.warnings.map((w) => `<div class="warn-item">⚠ ${esc(w)}</div>`).join("")}</div>`
    : "";
  const grievance = r.grievanceNote ? `<p class="muted"><em>${esc(r.grievanceNote)}</em></p>` : "";
  box.innerHTML = `${odds}${next}${steps}${warns}${grievance}`;
}

// ---------- audit ----------
function addLineRow(values = {}) {
  const wrap = document.createElement("div");
  wrap.className = "line-row";
  wrap.innerHTML = `
    <label>Code<input data-k="code" type="text" value="${esc(values.code || "")}" /></label>
    <label>Billed<input data-k="billed" type="text" inputmode="decimal" value="${esc(values.billed ?? "")}" /></label>
    <label>Allowed<input data-k="allowed" type="text" inputmode="decimal" value="${esc(values.allowed ?? "")}" /></label>
    <label>Plan paid<input data-k="planPaid" type="text" inputmode="decimal" value="${esc(values.planPaid ?? "")}" /></label>
    <label>You owe<input data-k="patientResponsibility" type="text" inputmode="decimal" value="${esc(values.patientResponsibility ?? "")}" /></label>
    <label>Adjustment codes<input data-k="adjustments" type="text" placeholder="CO-45:250, PR-1:30" value="${esc(values.adjustments || "")}" /></label>
    <button class="rm" title="Remove line" aria-label="Remove line">×</button>`;
  const prev = document.createElement("label");
  prev.className = "inline checkbox";
  prev.style.gridColumn = "1 / -1";
  prev.innerHTML = `<input data-k="preventive" type="checkbox" ${values.preventive ? "checked" : ""}/> <span>This was a preventive / screening service</span>`;
  wrap.appendChild(prev);
  wrap.querySelector(".rm").addEventListener("click", () => wrap.remove());
  $("#audit-lines").appendChild(wrap);
}
function parseAdjustments(str) {
  return String(str || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((token) => {
      const m = token.match(/^([A-Za-z]{2})-?(\w+)(?::\s*([\d.]+))?$/);
      if (!m) return null;
      return { group: m[1].toUpperCase(), code: m[2], amount: m[3] ? Number(m[3]) : 0 };
    })
    .filter(Boolean);
}
function readLineRows() {
  return $$("#audit-lines .line-row")
    .map((row) => {
      const get = (k) => $(`[data-k="${k}"]`, row);
      const line = { code: get("code").value.trim() };
      for (const k of ["billed", "allowed", "planPaid", "patientResponsibility"]) {
        const v = get(k).value.trim();
        if (v !== "") line[k] = Number(v);
      }
      line.preventive = get("preventive").checked;
      const adj = parseAdjustments(get("adjustments").value);
      if (adj.length) line.adjustments = adj;
      return line;
    })
    .filter((l) => l.code || l.adjustments || l.patientResponsibility != null);
}
function buildClaimFromForm() {
  const jsonText = $("#audit-json").value.trim();
  if (jsonText) return JSON.parse(jsonText);
  const net = $("#provider-network").value;
  const lines = readLineRows();
  const totalPR = lines.reduce((s, l) => s + (Number(l.patientResponsibility) || 0), 0);
  return {
    provider: { inNetwork: net === "" ? null : net === "true" },
    context: { isEmergency: $("#is-emergency").checked },
    totals: { patientResponsibility: totalPR },
    lines,
  };
}
function onAudit() {
  const box = $("#audit-results");
  let claim;
  try {
    claim = buildClaimFromForm();
  } catch (e) {
    box.innerHTML = `<p class="warn-item">Couldn't read that JSON: ${esc(e.message)}</p>`;
    return;
  }
  const r = auditClaim(claim);
  const savings = r.summary.potentialPatientSavings
    ? `<p class="savings">💰 You may be able to question about $${r.summary.potentialPatientSavings.toFixed(2)}.</p>`
    : "";
  const findings = r.findings.length
    ? r.findings
        .map(
          (f) => `<div class="finding ${esc(f.severity)}">
            <span class="sev">${esc(f.severity)}</span>
            <h3>${esc(f.title)}${f.line ? ` <span class="muted">(line ${esc(f.line)})</span>` : ""}</h3>
            <p>${esc(f.detail)}</p>
            <p class="action">→ ${esc(f.suggestedAction)}</p>${srcLinks(f.sources)}</div>`,
        )
        .join("")
    : `<p class="empty-hint">No issues detected by the current checks. Still compare your EOB's "patient responsibility" against the bill.</p>`;
  box.innerHTML = `<p class="muted">${r.summary.total} finding(s) from ${r.summary.rulesRun} checks.</p>${savings}${findings}`;
}
function loadExample() {
  $("#audit-lines").innerHTML = "";
  $("#provider-network").value = "true";
  $("#is-emergency").checked = false;
  $("#audit-json").value = "";
  addLineRow({ code: "99385", patientResponsibility: 40, preventive: true });
  addLineRow({ code: "73610", billed: 400, allowed: 150, planPaid: 120, patientResponsibility: 280, adjustments: "CO-45:250, PR-1:30" });
}

// ---------- letters ----------
function onLetter() {
  const box = $("#letter-results");
  const context = {};
  for (const inp of $$("[data-ctx]")) {
    if (inp.value.trim()) context[inp.dataset.ctx] = inp.value.trim();
  }
  const r = generateLetter({ type: $("#letter-type").value, context });
  const placeholders = r.placeholders.length
    ? `<div class="placeholders"><strong>Still to fill in</strong> (the [BRACKETS] in the letter): ${esc(r.placeholders.join(", "))}</div>`
    : "";
  box.innerHTML = `
    <div class="letter-output">
      <p><strong>Subject:</strong> ${esc(r.subject)}</p>
      <pre id="letter-body"></pre>
    </div>
    <button class="btn" id="copy-letter">Copy letter</button>
    ${placeholders}
    <h3>What to attach</h3>
    <ul class="attach">${r.attachments.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
    <h3>How to send</h3>
    <p>${esc(r.howToSend)}</p>`;
  $("#letter-body", box).textContent = r.body; // textContent = safe
  $("#copy-letter", box).addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(r.body);
      $("#copy-letter", box).textContent = "Copied ✓";
    } catch {
      $("#copy-letter", box).textContent = "Select the text above to copy";
    }
  });
}

// ---------- documents ----------
function onChecklist() {
  const box = $("#checklist-results");
  const r = buildChecklist({ scenario: $("#scenario-select").value, planTypeId: state.planTypeId || undefined });
  const item = (it) => `<div class="checklist-item">
      <input type="checkbox" aria-label="Have ${esc(it.name)}" />
      <div><div><strong>${esc(it.name)}</strong> ${it.required ? '<span class="req-badge">REQUIRED</span>' : ""}</div>
      <div class="why">${esc(it.why)}</div>
      <div class="why"><em>How to get it:</em> ${esc(it.howToGet)}</div></div>
    </div>`;
  const req = r.items.filter((i) => i.required);
  const help = r.items.filter((i) => !i.required);
  const notes = r.notes.length ? `<div class="warnings">${r.notes.map((n) => `<div class="warn-item">ℹ ${esc(n)}</div>`).join("")}</div>` : "";
  box.innerHTML = `
    <p class="muted">${esc(r.scenario.label)}${r.planType ? ` · ${esc(r.planType.name)}` : ""}</p>
    <h3>You need these</h3>${req.map(item).join("")}
    <h3>These help too</h3>${help.map(item).join("")}
    ${notes}`;
}

init();
