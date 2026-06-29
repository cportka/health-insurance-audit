# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com) and the project uses
[Semantic Versioning](https://semver.org).

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
