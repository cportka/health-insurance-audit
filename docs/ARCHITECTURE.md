# Architecture

## Principles

1. **Safety first.** A wrong deadline can cost a patient their appeal rights. Every deadline and
   right is encoded as data with an `authority` and a `sources` URL; nothing is hard-coded without a
   citation. When a value is uncertain or state-dependent, the tool says so and points to the
   authoritative body rather than guessing.
2. **Offline and private by default.** The core library has **zero runtime dependencies** and never
   makes a network call. No PHI leaves the process. Any future connector or LLM feature is opt-in,
   documented, and gated.
3. **Data/engine separation.** Engines (navigator, audit, letters, intake) are small and stable;
   the knowledge that changes — plan types, deadlines, rules, templates — lives in `src/data/`. This
   is what lets a non-lawyer maintainer update a deadline by editing one cited data file.
4. **Plain language.** Output is written for someone who knows nothing about insurance.

## Module map

```
src/
  index.mjs            public API (re-exports)
  disclaimer.mjs       the not-legal-advice notice (one source of truth)
  dates.mjs            dependency-free date math (add days/months/business-days)
  planTypes.mjs        helpers over the plan-type registry
  navigator.mjs        Deadline & Pathway Navigator engine
  letters.mjs          Appeal & Grievance letter generator
  eobAudit.mjs         Bill & EOB audit rules runner
  intake.mjs           Document intake checklist builder
  connectors/
    index.mjs          connector registry + interface (manual now; carriers planned)
  data/
    planTypes.mjs      registry: plan type -> regulator, funding, appeal `framework`, weakerRights
    pathways.mjs       SAFETY-CRITICAL deadline data, keyed by framework
    eobRules.mjs       the audit rule set
    letterTemplates.mjs  letter bodies + required statutory language
    intakeChecklists.mjs documents catalog + per-scenario lists
bin/hia.mjs            CLI
tests/                 node:test suites + the Portka version-sync runner
```

## Key data shapes

### Plan type (registry)

```js
{ id, name, aka[], category, funding, regulator, framework, weakerRights, howToIdentify, notes, sources[] }
```

`framework` is a key into `pathways.mjs`. Separating the registry (stable) from the pathways
(deadline-bearing) keeps the safety-critical numbers in one place with one set of citations.

### Pathway step (deadline data)

```js
{
  key, name, what, decidedBy,
  fileWithin: { amount, unit: "days"|"months"|"hours", businessDays? },
  fileFrom: "the trigger event the deadline counts from",
  decisionWithin: <duration> | { preService, postService, urgent, standard, expedited },
  expedited, authority, amountInControversy, binding, sources[]
}
```

The navigator computes the **first** step's concrete deadline from the patient's denial date, then
shows later steps as relative windows (future denial dates aren't known yet) and recomputes them as
the patient advances.

### Claim / EOB (audit input)

```js
{
  planTypeId, serviceDate,
  provider: { name, inNetwork },
  facility: { inNetwork, type },
  context: { isEmergency, atInNetworkFacility, hadPriorAuth, metDeductible },
  totals: { billed, allowed, planPaid, patientResponsibility },
  lines: [{
    code, codeType, description, units,
    billed, allowed, planPaid, patientResponsibility,
    preventive, denied, denialReason,
    adjustments: [{ group: "CO"|"PR"|"OA"|"PI", code, amount, reason }]
  }]
}
```

The audit hinges on the X12 **group codes**: `CO`/`OA`/`PI` dollars are the provider's or payer's
responsibility — if they appear in what the patient is asked to pay, that's the top red flag.

### Audit finding (output)

```js
{ ruleId, category, severity: "high"|"medium"|"low"|"info", title, detail, line?, estimatedImpact?, suggestedAction, sources[] }
```

## Adding to the knowledge base

- **A new plan type:** add an entry to `data/planTypes.mjs` pointing at an existing or new `framework`.
- **A new appeal pathway:** add a framework to `data/pathways.mjs`; every step needs `authority` + `sources` (a test enforces this).
- **A new audit check:** add a rule to `data/eobRules.mjs` with an `evaluate(claim)` function and sources.
- **A new letter:** add a template to `data/letterTemplates.mjs`.
- **A new intake scenario:** add a scenario to `data/intakeChecklists.mjs`.

Tests in `tests/` assert structural invariants (every plan maps to a framework, every step is cited,
every output carries the disclaimer) so the knowledge base can grow without drifting.

## Testing & CI

`node --test` runs the suites; `tests/run-tests.sh` adds the Portka SemVer/CHANGELOG/README
version-sync check and is what CI (`.github/workflows/validate.yml`) runs on every push and PR.
