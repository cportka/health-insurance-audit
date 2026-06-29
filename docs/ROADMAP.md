# Roadmap — Gates from 0.1.0 to 1.0.0

The product ships in **gates**. Each gate is a usable release you (Chris) **test and throw back** —
the gate isn't "done" until it passes its checkpoint with a real person who is not an insurance
expert. Versions follow [SemVer](https://semver.org): each gate is a **MINOR** bump pre-1.0; bug
fixes within a gate are **PATCH** bumps. **1.0.0** is the north star: *fully automated, and easy for
someone who knows nothing about health insurance or their rights.*

Legend: ✅ shipped · 🔜 next · ⏳ planned. Each gate lists **Deliverables**, the **Test & throw**
checkpoint (how you'll evaluate it), **Exit criteria**, and **Decisions** you'll want to weigh in on.

---

## Gate 0 — Core engine & knowledge base ✅ `0.1.0`

The offline brain: correct, cited rules for all major plan types, exposed via a CLI and a library.

- **Deliverables:** plan-type registry; Deadline & Pathway Navigator; Appeal & Grievance letter
  generator; Bill & EOB audit rules engine; Document intake checklists; `hia` CLI; tests + CI;
  planning docs. Zero dependencies, fully offline.
- **Test & throw:** run `hia navigate / intake / audit / letter` for a few real scenarios; check that
  deadlines, letters, and audit findings are correct and understandable. Throw back anything that's
  wrong, jargony, or missing.
- **Exit criteria:** all four pillars usable from the CLI; every deadline carries a citation; tests green.
- **Decisions:** Is the plan-type list complete enough? Are the letter templates saying the right things?

---

## Gate 1 — Guided interview (no jargon) 🔜 `0.2.0`

Turn the four tools into one **plain-language conversation**. The user answers simple questions
("Did you get a letter saying something was denied?") and the tool routes them to the right pathway,
checklist, audit, and pre-filled letter — without them knowing the word "appeal."

- **Deliverables:** `hia start` interactive wizard; plan-type identification flow (`whatami` expanded);
  scenario detection; a single guided output that strings the four pillars together.
- **Test & throw:** hand it to someone who has never appealed anything. Can they reach the right next
  step and a ready letter without help?
- **Exit criteria:** a novice completes "I got denied" → correct deadline + checklist + draft letter
  with no jargon and no wrong turns.
- **Decisions:** How much hand-holding vs. speed? Reading level target (aim ≤ 6th grade).

---

## Gate 2 — Document understanding (OCR + parse) ⏳ `0.3.0`

Stop making people type. Drop in a photo/PDF of a denial letter, EOB, or bill; the tool reads it,
extracts the claim number, dates, codes, denial reason, and amounts, **pre-fills everything**, and
auto-runs the audit.

- **Deliverables:** document upload + OCR; parsers for common EOB/denial/bill layouts; auto-extraction
  into the claim/intake shape; auto-audit; "what's still missing" prompts.
- **Test & throw:** drop in 5–10 real (redacted) documents from different carriers. Does it read them?
- **Exit criteria:** ≥ 80% correct field extraction on a test set; audit runs with no manual entry.
- **Decisions:** On-device OCR vs. cloud (privacy trade-off); which carrier layouts to target first.

---

## Gate 3 — Web app (no install) ⏳ `0.4.0`

Most people won't use a CLI. Ship a simple, accessible web UI over the same engine — mobile-first,
works on a phone. (Deployable to Vercel; the engine stays the source of truth.)

- **Deliverables:** web front-end for all four pillars + the guided interview; accessibility (WCAG)
  pass; mobile layout; print/download letters and checklists.
- **Test & throw:** can a non-technical relative use it on their phone, start to finish?
- **Exit criteria:** task completion by novices on mobile; accessibility audit passes.
- **Decisions:** Hosting + privacy posture (local-only mode vs. hosted); branding; domain.

---

## Gate 4 — Case tracking & deadline reminders ⏳ `0.5.0`

An appeal plays out over weeks. Keep the user on track: a persistent case file, a timeline of what
was sent and what's owed, and **reminders before each deadline**.

- **Deliverables:** case model (claims, documents, letters, deadlines, statuses); timeline view;
  reminders (calendar export / email / push); follow-up nudges; "what to do today."
- **Test & throw:** run a multi-week mock case; do reminders fire correctly and keep you moving?
- **Exit criteria:** no missed deadline in a simulated multi-step case; clear status at any moment.
- **Decisions:** Where state lives (local vs. account); reminder channels; data retention.

---

## Gate 5 — Carrier connectors, pilot (auto-pull documents) ⏳ `0.6.0`

The 1.0 force-multiplier, started small and legal-first. **Patient-authorized** read-only pull of
claims/EOBs via official APIs: **Medicare Blue Button 2.0**, the **CMS Patient Access API** (CARIN
Blue Button) for Medicare Advantage / Medicaid managed care / ACA issuers, and **one aggregator**.

- **Deliverables:** OAuth/SMART-on-FHIR connector framework (already stubbed in `src/connectors/`);
  Blue Button 2.0 + one CARIN payer + one aggregator; map FHIR `ExplanationOfBenefit` → claim shape;
  auto-audit pulled claims. See [CONNECTORS.md](./CONNECTORS.md).
- **Test & throw:** connect one real Medicare or MA account; pull EOBs; audit them automatically.
- **Exit criteria:** end-to-end "connect → pull → audit" works for ≥ 1 real plan type, with explicit,
  revocable consent and nothing stored without permission.
- **Decisions:** Aggregator vs. direct (cost, coverage, BAAs); consent + data-handling model; security review trigger.

---

## Gate 6 — Broaden coverage (incl. commercial) ⏳ `0.7.0`

Expand connectors toward "most users connect successfully," including the hard cases (self-funded /
commercial plans that aren't covered by the CMS mandate) via aggregators and, only where APIs don't
reach, **patient-delegated** portal access — never silent scraping.

- **Deliverables:** more CARIN payers + broader aggregator coverage; a documented fallback for
  non-API carriers; a per-carrier coverage dashboard.
- **Test & throw:** what fraction of a real tester pool can connect and pull documents?
- **Exit criteria:** a coverage threshold (set with you) across the top carriers by membership.
- **Decisions:** Build vs. buy aggregator; legal posture for portal fallback; which carriers to prioritize.

---

## Gate 7 — Smart drafting & evidence (opt-in AI) ⏳ `0.8.0`

Raise win rates: optional, opt-in AI that drafts a tailored appeal grounded in the *parsed* denial,
the plan document, and relevant clinical-guideline citations — plus a medical-necessity letter
assistant the provider can use. Templates remain the always-available, no-AI default.

- **Deliverables:** grounded draft generation (denial reason → targeted rebuttal + citations);
  guideline lookup; provider letter assistant; clear "AI-assisted, review before sending" labeling.
- **Test & throw:** compare AI-assisted drafts vs. templates on real denials — better, and accurate?
- **Exit criteria:** drafts are accurate, cited, and rated more persuasive than templates by reviewers;
  no fabricated citations.
- **Decisions:** Model + privacy (no PHI to third parties without consent); guardrails against hallucinated law.

---

## Gate 8 — Submission & hardening ⏳ `0.9.0`

Close the loop and make it safe to rely on. Submit appeals (e-submission where supported, fax, or
print-and-mail with tracking), and pass formal reviews.

- **Deliverables:** submission integrations; full **legal review** of all content; **security &
  privacy review** (PHI handling, connectors); accessibility audit; load/reliability.
- **Test & throw:** run a complete real case start → submit → tracked, end to end.
- **Exit criteria:** legal sign-off on content; security review passed; a full case completes in-tool.
- **Decisions:** Submission channels per carrier; compliance scope (HIPAA posture, BAAs); audit vendors.

---

## Gate 9 — 1.0.0: Fully automated & effortless ⏳ `1.0.0`

The north star. A person who knows **nothing** about insurance: connects their plan → the tool pulls
their documents → audits them → finds denials and billing errors → walks them through the appeal in
plain language → submits it → tracks every deadline — across **all major US plan types**.

- **Deliverables:** the integrated, automated experience; broad connector coverage; the guided
  end-to-end flow; polished web (and/or app) UX.
- **Test & throw:** novice users complete real appeals with minimal help and recover money / overturn
  denials.
- **Exit criteria:** usability bar with novices; connector coverage threshold; legal + security sign-off;
  measured real-world outcomes (denials overturned, dollars recovered).

---

## Cross-cutting (every gate)

- **Safety:** every deadline cited; "confirm on your notice / file early" always present; no guessed dates.
- **Privacy:** offline-by-default; any data egress is opt-in, disclosed, revocable.
- **SemVer + CHANGELOG:** every change bumps the version and adds a changelog entry (enforced by CI).
- **Tests + CI green before merge.**
