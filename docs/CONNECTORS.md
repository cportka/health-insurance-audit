# Connector Strategy — auto-pulling a patient's documents

**Goal of 1.0:** the patient connects their plan once, and the tool pulls their claims, EOBs, denial
letters, and plan documents automatically — no shoebox of paper, no manual entry. This document is
the strategy for getting there, legally and with the widest coverage. The runnable registry lives in
[`src/connectors/index.mjs`](../src/connectors/index.mjs); this is the "why" behind it.

## The landscape (easiest + most legal → hardest)

### 1. Medicare Blue Button 2.0 — *strong, narrow*
CMS's official FHIR R4 API exposes **Original Medicare** Part A/B/D claims for ~60M beneficiaries via
patient OAuth against their Medicare.gov account. Stable, free, sanctioned. **Best first connector**
for the Medicare population.

### 2. CMS Patient Access API (CARIN Blue Button) — *broad, mandated*
The CMS Interoperability & Patient Access rule (CMS-9115-F) **requires** many payers to expose a
patient-authorized FHIR Patient Access API returning `ExplanationOfBenefit` (CARIN Blue Button IG):
- **Covered (mandated):** Medicare Advantage, Medicaid & CHIP (managed care and FFS), and ACA
  exchange (QHP) issuers.
- **NOT covered (key gap):** most **commercial / employer self-funded (ERISA)** plans — the largest
  slice of working-age Americans. These need aggregators or patient-delegated access.

Auth is **SMART-on-FHIR / OAuth2** per payer; each payer runs its own authorization server and app
registration. Coverage is real but uneven in quality.

### 3. Health-data aggregators — *broadest, fastest to integrate*
Vendors that have already done the per-payer OAuth/FHIR integration and expose one normalized API:
**Flexpa, 1upHealth, Fasten Health, Particle Health, Health Gorilla, Zus, Metriport**, etc. They
trade money + a BAA for breadth and a single SDK. **Best way to cover many payers quickly**; coverage
of commercial/self-funded is still the limiting factor industry-wide.

### 4. Carrier member portals — *widest theoretical reach, highest risk*
Every carrier has a member website with EOBs and denial letters. Automated access is **legally and
technically fragile**: Terms of Service often forbid scraping, the CFAA and security concerns apply,
and pages break. **Policy: prefer sanctioned APIs and patient-delegated access; use portal access
only where no API reaches, only with explicit revocable patient consent, and never store credentials
server-side.** This is a last resort, not a default.

## Per-carrier posture (to validate in Gate 5–6)

| Carrier / source | Likely best path | Notes |
| :-- | :-- | :-- |
| Original Medicare | Blue Button 2.0 | Official, free, stable. Start here. |
| Medicare Advantage issuers | CARIN Patient Access API (mandated) | Per-issuer OAuth; aggregator simplifies. |
| Medicaid / CHIP (state + MCO) | CARIN Patient Access API (mandated) | State + MCO endpoints; coverage varies. |
| ACA marketplace issuers (QHP) | CARIN Patient Access API (mandated) | Per-issuer OAuth. |
| UnitedHealthcare / Optum | CARIN API + aggregator | Large; validate developer/patient-access portal. |
| Elevance / Anthem BCBS | CARIN API + aggregator | BCBS entities vary by state. |
| Aetna / CVS Health | CARIN API + aggregator | |
| Cigna | CARIN API + aggregator | |
| Humana | CARIN API + aggregator | Big MA presence → Patient Access API. |
| Kaiser Permanente | CARIN API / member portal | Integrated model; validate access. |
| Centene | CARIN API (Medicaid/MA heavy) | |
| Self-funded employer (ERISA) plans | Aggregator / patient-delegated | **Not** CMS-mandated — the hard gap. |

## Connector interface (already in code)

Every connector implements the same duck-typed interface so the engine is agnostic to source:

```
id, name, type, status, capabilities[], authModel, coverage, legalPosture, gate
connect(opts)            -> session handle
fetchDocuments(session)  -> { documents: [...] }   // normalized to the claim/intake shape
```

v0.1 ships the **`manual`** connector (patient provides documents; nothing leaves the device). Blue
Button 2.0, CARIN Patient Access, aggregator, and carrier-portal connectors are declared as `planned`
with their auth model, coverage, and target gate — so the strategy and the code stay in lock-step.

## Data model: FHIR → our claim shape

The CARIN Blue Button `ExplanationOfBenefit` resource maps cleanly onto our audit input: line items,
adjudications (allowed/paid/patient-responsibility), and adjustment reason codes (CARC/RARC) become
`lines[].adjustments`. A mapping layer in Gate 5 normalizes FHIR EOBs into the same shape the manual
path produces, so the **audit engine doesn't change** when the source does.

## Privacy & consent (non-negotiable)

- **Opt-in and revocable.** Connecting a plan is an explicit choice the patient can undo.
- **Minimum necessary.** Pull only what the audit/appeal needs.
- **No silent storage.** Don't persist PHI or credentials without explicit consent; prefer on-device.
- **BAAs where required.** Any aggregator or cloud processor handling PHI needs the right agreements.
- **Security review** gates the first real connector (Gate 5) and again before broad rollout (Gate 8).

## Phasing (ties to the roadmap)

- **Gate 5 (`0.6.0`):** Blue Button 2.0 + one CARIN payer + one aggregator (pilot, read-only).
- **Gate 6 (`0.7.0`):** broaden CARIN payers + aggregator coverage; documented patient-delegated
  fallback for non-API carriers; coverage dashboard.
- **Gate 8 (`0.9.0`):** security/privacy + legal review before relying on connectors at scale.
- **Gate 9 (`1.0.0`):** "connect once, everything flows" for all major plan types.
