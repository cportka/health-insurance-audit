# Improvements — prioritized backlog

Known gaps and next steps, distilled from the multi-source research pass and its completeness critic.
Ordered by patient impact. Each maps to a roadmap gate (see [ROADMAP.md](./ROADMAP.md)). This is the
honest "what's not done yet" list — the engine is solid, but a v1.0 patient-safety tool needs these.

## Highest impact (do first)

1. **Time-critical fast-track pathways (hours, not months).** Build the Medicare hospital-discharge
   (QIO/BFCC-QIO, IMM, ~1-day decision) and SNF/HHA/CORF/hospice service-termination (NOMNC →
   72-hour expedited determination → expedited QIC) flows as first-class, dated pathways
   (`medicare-qio-discharge`, `medicare-qio-termination`) with countdown warnings. Missing
   "call by midnight of discharge day" means paying out of pocket. *(Gate 1)*
2. **Continuation-of-benefits surfacing + the new letter, wired to `denialType=termination`.** The
   letter now exists; make the navigator prominently route terminations to it with the deadline.
   *(Gate 1)*
3. **EOB audit depth.** Add an NCCI PTP unbundling-pair check, an upcoding check, observation-vs-
   inpatient / missing-MOON / SNF 3-day (Medicare), CO-16/CO-97/ABN handlers, and a USPSTF/ACIP/HRSA
   preventive-code crosswalk so the tool catches "screening colonoscopy re-coded as diagnostic"
   instead of relying on a pre-set `preventive` flag. *(Gate 2)*
4. **Document-request enforcement letters** (partially shipped): SPD demand ✅, HIPAA records ✅,
   continuation-of-benefits ✅. Still to add: itemized-bill demand, deemed-exhaustion notice, and a
   CMS-1696 appointed-representative cover letter. *(Gate 1)*

## Correctness & safety (before relying on it widely)

5. **Per-state overlay layer.** State external-review windows (e.g. CA 180 days vs. MI 60 days vs. the
   4-month federal floor), state balance-billing / ground-ambulance laws, state itemized-bill
   statutes, and state Medicaid fair-hearing windows. The tool currently presents federal-floor
   numbers; it needs a state layer plus a **self-funded-vs-fully-insured classifier** (the funding
   fork is invisible to most patients and decides state-vs-federal routing). *(Gate 1–2)*
6. **Dated-constants module + refresh reminder.** Medicare AIC thresholds ($200 / $1,960 are CY2026),
   the Part C IRE contractor change, PPDR fee, and QPA indexing are time-bound. Centralize them with a
   December Federal Register refresh reminder. *(Gate 1)*
7. **Validate the stubbed dimensions properly.** Two research agents returned stubs; Medicaid/CHIP and
   "other plan types" deadlines were filled and spot-verified from eCFR but deserve a full pass —
   including D-SNP / Medicare-Medicaid integrated plans (integrated determinations, 42 CFR 422.629–634),
   grandfathered plans (exempt from ACA 2719 external review), Medigap, self-insured non-federal
   governmental plans that may have opted out of 2719, IHS/tribal coverage, and retiree-only plans.
   Resolve the COBRA self-funded-vs-fully-insured fork. *(Gate 1)*

## Coverage & pathways

8. **No Surprises Act PPDR pathway + letter** (uninsured/self-pay: bill ≥ $400 over the Good Faith
   Estimate, initiate within 120 days). Explicitly note that federal IDR is *provider-vs-plan* — the
   patient is **not** a party — so the tool never tells a patient to "use IDR." *(Gate 1)*
9. **Deemed-exhaustion option + letter.** When a plan blows its own procedural clocks, the patient can
   skip ahead to external review or court. Surface it as an option, not just an overdue warning. *(Gate 1)*

## Resolved conflicts to keep an eye on

- External-review filing window: **4 months is the federal regulatory baseline** (45 CFR 147.136);
  some states and the NSA context differ — surfaced as a "confirm on your notice" caveat.
- MA Level-1 filing window standardized to **60 days** (42 CFR 422.582).
- Part D service-vs-payment clocks split (7-day service / 14-day payment) — done.
- Medicaid continuation deadline is "within ~10 days **or** before the effective date" and varies by
  state — presented as a range/caveat, not a single hard number.

See [ROADMAP.md](./ROADMAP.md) for how these slot into the gated plan to 1.0.0.
