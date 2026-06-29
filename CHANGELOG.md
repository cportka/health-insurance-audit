# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com) and the project uses
[Semantic Versioning](https://semver.org).

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
