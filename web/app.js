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
  buildActionPlan,
  INTENTS,
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
// Progressive disclosure: a collapsed "More details" block. Simple by default, deep on demand.
const more = (label, innerHTML) =>
  innerHTML && innerHTML.trim()
    ? `<details class="more"><summary>${esc(label)}</summary><div class="more-body">${innerHTML}</div></details>`
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

// Populate a <select> with plan types grouped by category.
function populatePlanSelect(sel) {
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
}

// ---------- init ----------
function init() {
  populatePlanSelect($("#plan-select"));
  populatePlanSelect($("#home-plan"));

  // intent cards (the consumer entry point)
  const ic = $("#intent-cards");
  for (const intent of INTENTS) {
    const b = document.createElement("button");
    b.className = "intent-card";
    b.dataset.intent = intent.id;
    b.innerHTML = `<span class="intent-emoji">${intent.id === "overturn-denial" ? "🛡️" : "⚖️"}</span><span class="intent-text">${esc(intent.label)}</span>`;
    b.addEventListener("click", () => chooseIntent(intent));
    ic.appendChild(b);
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
  // home (intent-first) wiring
  $("#home-plan").addEventListener("change", (e) => { state.planTypeId = e.target.value; });
  $("#home-guess-btn").addEventListener("click", onHomeGuess);
  $("#build-plan-btn").addEventListener("click", onBuildPlan);
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

// ---------- home (intent-first) ----------
let chosenIntent = null;
function chooseIntent(intent) {
  chosenIntent = intent;
  $$(".intent-card").forEach((c) => c.classList.toggle("selected", c.dataset.intent === intent.id));
  $("#intent-chosen").textContent = intent.label;
  $("#intent-form").hidden = false;
  if (state.planTypeId) $("#home-plan").value = state.planTypeId;
  $("#intent-form").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function onHomeGuess() {
  const box = $("#home-guess-results");
  const guesses = guessPlanType($("#home-plan-guess").value).slice(0, 4);
  box.innerHTML = "";
  if (!guesses.length) {
    box.innerHTML = `<span class="empty-hint">No confident guess — pick from the list above.</span>`;
    return;
  }
  for (const g of guesses) {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = g.name;
    b.addEventListener("click", () => {
      $("#home-plan").value = g.id;
      state.planTypeId = g.id;
    });
    box.appendChild(b);
  }
}
function urgencyPill(a) {
  if (a.urgency === "now") return `<span class="pill urgent">Do now</span>`;
  if (a.urgency === "deadline")
    return `<span class="pill overdue">${a.deadlineDate ? `By ${esc(a.deadlineDate)}` : "Deadline"}</span>`;
  if (a.urgency === "soon") return `<span class="pill ok">Soon</span>`;
  return `<span class="pill">Ongoing</span>`;
}
function renderLetterBlock(letter) {
  // returns HTML; the <pre> body is filled via textContent after insertion (see fillLetterBodies)
  const ph = letter.placeholders.length
    ? `<div class="placeholders"><strong>Fill in:</strong> ${esc(letter.placeholders.join(", "))}</div>`
    : "";
  return `<div class="letter-output">
      <p><strong>Subject:</strong> ${esc(letter.subject)}</p>
      <pre class="letter-body" data-body="${esc(letter.body)}"></pre>
    </div>
    <button class="btn copy-letter" data-body="${esc(letter.body)}">Copy letter</button>
    ${ph}
    <h4>Attach</h4><ul class="attach">${letter.attachments.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
    <h4>How to send</h4><p>${esc(letter.howToSend)}</p>`;
}
function fillLetterBodies(root) {
  $$(".letter-body", root).forEach((pre) => (pre.textContent = pre.dataset.body));
  $$(".copy-letter", root).forEach((btn) =>
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.body);
        btn.textContent = "Copied ✓";
      } catch {
        btn.textContent = "Select the letter text to copy";
      }
    }),
  );
}
function onBuildPlan() {
  const box = $("#plan-results");
  if (!chosenIntent) return;
  const planTypeId = $("#home-plan").value;
  if (!planTypeId) {
    box.innerHTML = `<p class="warn-item">⚠ Please choose your plan type above (or use "Not sure?").</p>`;
    return;
  }
  state.planTypeId = planTypeId;
  let plan;
  try {
    plan = buildActionPlan({
      intent: chosenIntent.id,
      planTypeId,
      denialDate: $("#home-date").value || undefined,
      hasBill: $("#home-bill").checked,
    });
  } catch (e) {
    box.innerHTML = `<p class="warn-item">⚠ ${esc(e.message)}</p>`;
    return;
  }
  const hero = plan.nextStep
    ? `<div class="hero">
         <div class="hero-label">✅ Your next step</div>
         <div class="hero-step">${esc(plan.nextStep.title)}</div>
         <div class="hero-deadline">${esc(plan.nextStep.deadlineText || plan.nextStep.why)}</div>
       </div>`
    : "";
  const odds = plan.outcomeOdds
    ? `<div class="odds"><strong>💪 ${esc(plan.outcomeOdds.headline)}</strong>${more("Why it's worth it", `<p>${esc(plan.outcomeOdds.detail)}</p>${srcLinks(plan.outcomeOdds.sources)}`)}</div>`
    : "";
  const actions = plan.actions
    .map((a, i) => {
      let detail = "";
      if (a.do) detail += `<p style="white-space:pre-line">${esc(a.do)}</p>`;
      if (a.documents)
        detail += `<ul>${a.documents.map((d) => `<li><strong>${esc(d.name)}</strong> — <span class="muted">${esc(d.howToGet)}</span></li>`).join("")}</ul>`;
      if (a.letter) detail += renderLetterBlock(a.letter);
      detail += srcLinks(a.sources);
      const label = a.letter ? "Open the drafted letter & details" : a.documents ? "See the documents" : "More details";
      return `<div class="action-card">
          <div class="action-head"><span class="action-num">${i + 1}</span><span class="action-title">${esc(a.title)}</span>${urgencyPill(a)}</div>
          <p class="action-why">${esc(a.why)}</p>
          ${more(label, detail)}
        </div>`;
    })
    .join("");
  box.innerHTML = `<div class="plan-summary"><h3>${esc(plan.title)}</h3><p>${esc(plan.summary)}</p></div>${hero}${odds}<div class="steps-title">Your full plan</div>${actions}`;
  fillLetterBodies(box);
  box.scrollIntoView({ behavior: "smooth", block: "start" });
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
    <p><strong>Who oversees appeals:</strong> ${esc(p.regulator)}</p>
    ${p.weakerRights ? `<p>⚠ <strong>Heads up:</strong> these plans often have weaker appeal protections — confirm your exact rights in your policy.</p>` : ""}
    ${more("More about this plan", `<p>${esc(p.notes || "")}</p><p class="muted"><em>How to tell if this is you:</em> ${esc(p.howToIdentify || "")}</p>`)}`;
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
  // Hero: the single most important thing — what to do next, and by when.
  const hero = r.nextAction
    ? `<div class="hero">
         <div class="hero-label">✅ Your next step</div>
         <div class="hero-step">${esc(r.nextAction.step)}</div>
         <div class="hero-deadline">File by <strong>${esc(r.nextAction.fileBy)}</strong></div>
       </div>`
    : "";
  // Odds: one motivating line; the detail + sources only if they want them.
  const odds = r.outcomeOdds
    ? `<div class="odds"><strong>💪 ${esc(r.outcomeOdds.headline)}</strong>${more("Why it's worth appealing", `<p>${esc(r.outcomeOdds.detail)}</p>${srcLinks(r.outcomeOdds.sources)}`)}</div>`
    : "";
  // Warnings stay visible — they're safety-critical.
  const warns = r.warnings.length
    ? `<div class="warnings">${r.warnings.map((w) => `<div class="warn-item">⚠ ${esc(w)}</div>`).join("")}</div>`
    : "";
  // Each step is ONE line (name + its key deadline); everything else behind "More details".
  const steps = r.steps
    .map((s) => {
      const lead = s.fileByDate
        ? `by <strong>${esc(s.fileByDate)}</strong>${s.daysRemaining != null ? ` · ${s.daysRemaining} days left` : ""}`
        : s.fileWithin
          ? `within ${esc(s.fileWithin)}`
          : s.decisionWithin
            ? `decision in ${esc(s.decisionWithin)}`
            : "";
      const badge = s.status ? `<span class="pill ${esc(s.status)}">${esc(s.status)}</span>` : "";
      const bits = [`<li>Decided by ${esc(s.decidedBy)}</li>`];
      if (s.fileWithin) bits.push(`<li>File within ${esc(s.fileWithin)} of ${esc(s.fileFrom)}</li>`);
      if (s.decisionWithin) bits.push(`<li>They must decide within ${esc(s.decisionWithin)}</li>`);
      if (s.expedited) bits.push(`<li>${esc(s.expedited)}</li>`);
      if (s.amountInControversy) bits.push(`<li>Minimum amount in dispute: ${esc(s.amountInControversy)}</li>`);
      if (s.authority) bits.push(`<li class="muted">Authority: ${esc(s.authority)}</li>`);
      return `<div class="step-row">
          <div class="step-line"><span class="step-title">${s.order}. ${esc(s.name)} ${badge}</span><span class="step-when">${lead}</span></div>
          ${more("More details", `<ul>${bits.join("")}</ul>${srcLinks(s.sources)}`)}
        </div>`;
    })
    .join("");
  const allSteps = `<div class="steps-block"><div class="steps-title">All ${r.steps.length} steps, in order</div>${steps}</div>`;
  const grievance = r.grievanceNote ? more("When to use a grievance instead", `<p>${esc(r.grievanceNote)}</p>`) : "";
  box.innerHTML = `${hero}${warns}${odds}${allSteps}${grievance}`;
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
            <p class="action">→ ${esc(f.suggestedAction)}</p>
            ${more("Why we flagged this", `<p>${esc(f.detail)}</p>${srcLinks(f.sources)}`)}</div>`,
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
      <div class="ci-main"><strong>${esc(it.name)}</strong> ${it.required ? '<span class="req-badge">REQUIRED</span>' : ""}
        ${more("Why & how to get it", `<div class="why">${esc(it.why)}</div><div class="why"><em>How to get it:</em> ${esc(it.howToGet)}</div>`)}
      </div>
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
