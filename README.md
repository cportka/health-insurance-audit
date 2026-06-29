# health-insurance-audit

A free, offline-first tool that helps patients in the USA **audit their health insurance**, find the
**right appeal/grievance pathway and deadlines**, generate **appeal & grievance letters**, and know
**exactly which documents to gather** — across all major US plan types.

> **Version:** 0.3.0 · **Try it:** [cportka.github.io/health-insurance-audit](https://cportka.github.io/health-insurance-audit/) · **License:** [MIT](./LICENSE) · **Changelog:** [CHANGELOG.md](./CHANGELOG.md) · **Roadmap:** [docs/ROADMAP.md](./docs/ROADMAP.md)

> ⚠️ **This is general information, not legal or medical advice.** Deadlines and rights vary by plan,
> state, and situation. Always confirm the deadline on your own denial notice and with your plan or
> the listed regulator. When in doubt, **file early**. See [docs/LEGAL.md](./docs/LEGAL.md).

## Why this exists

The leverage here is enormous, and it's measured:

- ACA marketplace insurers denied **~19% of in-network claims in 2024** (~85M claims), yet consumers
  appealed **fewer than 1%** of them ([KFF](https://www.kff.org/patient-consumer-protections/claims-denials-and-appeals-in-aca-marketplace-plans-in-2024/)).
- **~69%** of people with a denied claim **don't know they can appeal** ([KFF](https://www.kff.org/affordable-care-act/consumer-survey-highlights-problems-with-denied-health-insurance-claims/)).
- When people do appeal, they win meaningfully often: roughly **1 in 3** ACA internal appeals are
  overturned, external review overturns **~30–78%**, and Medicare Advantage plans overturn about
  **75% of prior-auth denials** (and ~95% of skilled-nursing denials) on appeal ([HHS-OIG](https://oig.hhs.gov/reports/all/2018/medicare-advantage-appeal-outcomes-and-audit-findings-raise-concerns-about-service-and-payment-denials/)).
- Separately, an estimated **~80% of medical bills contain an error** and **~86% of denials are
  "potentially avoidable"** (administrative/coding) — money recoverable without even appealing.

People don't push back because they don't know they can, don't know the deadline, and don't know what
to say. This tool removes those three barriers — and surfaces the overturn odds for *your* plan right
when you get denied — then audits the bill/EOB for the errors that quietly cost patients money.

## What it does (v0.1 — the core engine)

| Capability | Command | What you get |
| :-- | :-- | :-- |
| **Deadline & pathway navigator** | `hia navigate` | Your ordered appeal/grievance steps, each with its filing deadline (computed from your denial date), who decides it, how long they have, the governing law — **and how often this kind of denial gets overturned**, to tell you it's worth it. |
| **Appeal & grievance letters** | `hia letter` | Ready-to-send, mail-merged letters (internal appeal, external review, grievance, claim-file request, balance-bill dispute, No Surprises Act, Part D exception) with the right statutory language. |
| **Bill & EOB audit** | `hia audit` | A rules engine that flags likely errors — balance billing, contractual write-offs billed to you, $0-preventive charged cost-share, surprise out-of-network bills, timely-filing denials, duplicates, COB, math errors. |
| **Document intake checklist** | `hia intake` | The exact documents to gather for your situation and plan type, why each matters, and how to request it. |

All **major US plan types** are modeled: ACA individual/marketplace, fully-insured group, self-funded
(ERISA), Medicare Advantage (Part C), Medicare Part D, Original Medicare (A/B), Medicaid & CHIP
managed care and fee-for-service, FEHB, TRICARE, COBRA, short-term, and student plans — with a
warning when a plan type has **weaker appeal rights**.

## Use it in your browser (no install)

A static web app lives at **[cportka.github.io/health-insurance-audit](https://cportka.github.io/health-insurance-audit/)**
— pick your plan, see your deadlines and overturn odds, audit a bill, draft a letter, and get your
document checklist. It runs **100% in your browser** (it imports this same library as ES modules), so
**nothing you type is uploaded**. To run it locally, serve the repo root with any static server
(`python3 -m http.server`) and open `index.html`.

## Quick start (CLI)

No dependencies. Requires Node.js ≥ 18.

```bash
# What plan do I even have?
node bin/hia.mjs whatami "through my job, my big employer pays the claims itself"

# Show my appeal pathway and deadlines
node bin/hia.mjs navigate --plan aca-individual --denial post-service --date 2026-06-01

# Build the document checklist for my situation
node bin/hia.mjs intake --scenario claim-denied --plan medicare-advantage

# Draft an internal appeal letter
node bin/hia.mjs letter internal-appeal --ctx "memberName=Jane Doe,claimNumber=ABC123,denialReason=not medically necessary"

# Audit an EOB/bill (JSON) for likely errors
node bin/hia.mjs audit --file claim.json
```

Add `--json` to most commands for machine-readable output. Run `node bin/hia.mjs help` for the full list.

### Use as a library

```js
import { buildPathway, generateLetter, auditClaim, buildChecklist } from "health-insurance-audit";

const plan = buildPathway({ planTypeId: "aca-individual", denialType: "urgent", denialDate: "2026-06-01" });
console.log(plan.nextAction); // { step, fileBy, decidedBy }
```

## How it's built

Offline and dependency-free by design — **no patient data leaves the process**. Safety-critical
deadlines live as cited data in [`src/data/pathways.mjs`](./src/data/pathways.mjs); every rule carries
an `authority` and source link. See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

```
src/
  planTypes.mjs        registry of US plan types -> appeal framework
  navigator.mjs        deadline & pathway engine
  letters.mjs          appeal/grievance letter generator
  eobAudit.mjs         bill/EOB rules engine
  intake.mjs           document checklist generator
  connectors/          how documents get in (manual now; carrier APIs planned)
  data/                the knowledge base (plan types, pathways, rules, templates)
bin/hia.mjs            the CLI
```

## Roadmap

This is **Gate 0**. The plan runs to a **1.0.0** that auto-connects to a patient's insurer, pulls
their documents, and walks them through the whole process with no insurance knowledge required. See
the gated roadmap in [docs/ROADMAP.md](./docs/ROADMAP.md) and the connector strategy in
[docs/CONNECTORS.md](./docs/CONNECTORS.md).

## Tests

```bash
bash tests/run-tests.sh   # version sync + node --test (what CI runs)
node --test               # just the Node suite
```

## Versioning

[SemVer](https://semver.org). The version in `package.json` is the source of truth and stays in sync
with `CHANGELOG.md` and the **Version:** line above — enforced by `tests/run-tests.sh` in CI.

## License

[MIT](./LICENSE) — free to use, with attribution to Chris Portka preserved.
