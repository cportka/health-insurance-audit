# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com) and the project uses
[Semantic Versioning](https://semver.org).

## [0.3.1] — 2026-06-29

UX: lead with one thing, hide the rest (progressive disclosure — "Apple-like" simplicity).

### Changed
- The deadlines view now opens with a single **"Your next step"** hero (the one action + its date),
  one motivating odds line, and each appeal level collapsed to **one line + "More details"**
  (decided-by, decision clock, expedited option, authority, and sources are now on-demand).
- Bill-audit findings lead with the title + the one-line action; the explanation and sources move
  behind "Why we flagged this".
- Document-checklist items show just the name + REQUIRED badge; "why & how to get it" expands.
- Plan info on Start shows the regulator + any weaker-rights warning; the rest expands.
- No engine or API changes — purely how much is shown at once.

## [0.3.0] — 2026-06-29

First **web front end** — a static, single-page site so non-technical users can start giving
feedback (an early preview of the Gate 3 web app, shipped ahead of schedule).

### Added
- **Static web app** (`index.html`, `web/app.js`, `web/styles.css`) that imports the dependency-free
  library directly in the browser (the same engine the CLI uses — no bundler, no build step). It is
  **100% client-side**: nothing is uploaded, matching the no-PHI-leaves-the-device promise. Five
  sections: pick/guess your plan type, deadline & pathway navigator (with overturn odds), bill/EOB
  audit (guided line-item form + "load an example" + JSON paste), letter generator (with copy), and
  the document checklist. Mobile-first, accessible, with the disclaimer always visible.
- **GitHub Pages**: `.nojekyll` so the `src/` and `web/` files are served as-is; the site deploys
  from `main`.
- `DENIAL_TYPES` is now part of the public API (`src/index.mjs`) for the UI.
- `tests/web.test.mjs` — guards the published files' wiring and the public-API contract the browser
  depends on (dependency-free; full click-through verified separately with a headless browser).

### Notes
- Verified end to end in a real headless browser: all five sections work with no console errors, and
  `.mjs` modules are served with the correct `text/javascript` MIME type on static hosts.

## [0.2.0] — 2026-06-29

Gate 0 hardening from a multi-source research pass with adversarial deadline verification (CMS,
HHS-OIG, DOL, eCFR, KFF, Commonwealth Fund). Still offline and dependency-free.

### Added
- **Outcome odds at the moment of denial** (`src/data/outcomeStats.mjs`) — the navigator now tells
  the patient, per plan type, how often this kind of denial is overturned and how rarely people
  appeal (e.g. Medicare Advantage plans overturn ~75% of prior-auth denials on appeal; <1% of ACA
  in-network denials are appealed). Each figure carries a primary-source citation.
- **`termination` and `payment` denial types** — a termination/reduction of approved care now
  triggers a prominent continuation-of-benefits ("keep your benefits during the appeal") warning;
  the Medicare service-vs-payment clock distinction is modeled (e.g. Part D payment = 14 days, not
  the 7-day service clock).
- **Three high-value letters** — continuation-of-benefits request, HIPAA medical-records request
  (45 CFR 164.524), and ERISA SPD/plan-document demand (29 U.S.C. 1024, up to $110/day penalty).
- `docs/IMPROVEMENTS.md` — a prioritized punch-list (from the research completeness critic) of the
  pathways, letters, audit checks, and state-variation tables still to build.

### Changed / Fixed
- **Verified deadlines against primary sources.** Medicare amount-in-controversy thresholds corrected
  to CY2026 ($200 ALJ / $1,960 federal court). FEHB OPM-review window made concrete (90 days, or 120
  if the carrier never responds; 5 CFR 890.105). Confirmed FEHB (6-month reconsideration), TRICARE
  (90-day reconsideration / 60-day formal review), and Medicaid managed care (60-day appeal /
  90–120-day fair hearing / 10-day continuation) against eCFR.
- External-review step now flags that the 4-month federal window is a floor and some states set a
  shorter one — confirm on your notice.
- Part C Independent Review Entity labeled generically (the CMS contractor changed mid-2026).
- README now surfaces the concrete, cited denial/overturn statistics instead of vague prose.

## [0.1.0] — 2026-06-29

First foundational gate (**Gate 0 — Core engine & knowledge base**). Offline, dependency-free
Node library + CLI. Not legal or medical advice; see the disclaimer shipped with every output.

### Added
- **Plan-type knowledge base** (`src/data/planTypes.mjs`) covering the major US plan types —
  ACA individual/marketplace, fully-insured group, ERISA self-funded, Medicare Advantage (Part C),
  Medicare Part D, Original Medicare (Parts A/B), Medicaid & CHIP managed care/FFS, FEHB, TRICARE,
  COBRA, short-term limited-duration, and student health — each with its regulator, appeal
  pathway, and a flag for weaker appeal rights.
- **Deadline & pathway navigator** (`src/navigator.mjs`) — given a plan type, denial type, and key
  dates, computes the ordered appeal/grievance pathway with each step's deadline, who decides it,
  and the source authority. Every deadline carries a citation.
- **Appeal & grievance letter generator** (`src/letters.mjs`) — templated, mail-merged letters for
  internal appeals, external review requests, grievances, and document/claim-file requests, with
  the required statutory language per plan type.
- **Bill & EOB audit** (`src/eobAudit.mjs`) — runs a rules engine of common billing/EOB error
  checks (duplicate charges, preventive-care cost-share, balance billing, timely-filing,
  out-of-network surprise bills, CARC/RARC red flags) and returns prioritized findings.
- **Document intake checklist** (`src/intake.mjs`) — generates the exact list of documents a
  patient must gather for their scenario and plan type, with how to request each.
- **CLI** (`bin/hia.mjs`) — `navigate`, `letter`, `audit`, `intake`, and `plans` subcommands.
- Portka standard: SemVer source of truth, `tests/run-tests.sh`, native `node --test` suite, and
  CI (`.github/workflows/validate.yml`).
- Planning docs (`docs/`): full-audit scope, architecture, connector strategy, and the gated
  roadmap to 1.0.0.

[0.1.0]: https://github.com/cportka/health-insurance-audit/releases/tag/v0.1.0
