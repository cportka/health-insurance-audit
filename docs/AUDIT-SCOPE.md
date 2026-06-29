# Full Audit Scope — what "auditing your health insurance" actually means

This document defines the **complete** scope of a health-insurance audit and grievance process for a
US patient, and then identifies the **highest-impact** slice to build first. The product is organized
around four pillars (the v0.1 modules), but a *full* audit spans the entire patient journey from
"something seems wrong" to "money recovered / care approved / rights exhausted."

## The patient journey (and where the tool intervenes)

```
1. Trigger        A denial, a surprise bill, a claim "pending", a scary EOB, a balance bill.
2. Orient         What plan do I have? What are my rights? What's the deadline?     ← NAVIGATOR
3. Gather         Which documents do I need, and how do I get them?                 ← INTAKE
4. Audit          Is this bill/EOB even correct? What's wrong with it?              ← EOB AUDIT
5. Act            Write the appeal/grievance/dispute with the right language.       ← LETTERS
6. Escalate       Internal → external/IRO → ALJ → regulator complaint → litigation.← NAVIGATOR
7. Track          Deadlines, what was sent, what's owed, follow-ups.               ← (Gate 1+)
8. Resolve        Overturned, corrected, paid — or next lever.
```

The four v0.1 pillars cover steps 2–6. Steps 7–8 (case tracking, outcomes) and **automation** of
steps 1–4 (auto-pull documents) are the road to 1.0.

## Pillar 1 — Deadline & Pathway Navigator

A correct, plan-specific map of *what to do next and by when*. A full implementation covers:

- **Plan-type identification** — the single biggest fork. Self-funded (ERISA) vs fully-insured
  changes the regulator (DOL vs state) and the external-review process (federal vs state). Most
  patients don't know which they have; the tool helps them figure it out (`hia whatami`).
- **Every appeal level** for every plan type, with: the deadline to file, the trigger event it counts
  from, calendar vs business days, who decides, how long they have, expedited variants, dollar
  thresholds (Medicare ALJ/court), and the governing authority.
- **Grievance vs appeal** routing — quality/service complaints (grievance) vs coverage/payment
  denials (appeal). Different forms, different timelines.
- **Special fast tracks** — Medicare hospital-discharge and service-termination appeals (QIO/BFCC-QIO,
  same-day), expedited urgent appeals (72h), continuation/aid-paid-pending of Medicaid benefits.
- **Representation** — authorized/appointed representative rules (Medicare CMS-1696), so a family
  member or advocate can act.
- **Deemed exhaustion & good cause** — when a plan blows its own deadline, or a late filing can still
  be accepted.
- **Escalation beyond the plan** — state DOI complaint, DOL/EBSA, external review request, state fair
  hearing, and the statute of limitations to sue (ERISA contractual limitations periods).

**v0.1 status:** all major plan types and their core levels are modeled with cited deadlines.
**Next:** state-by-state Medicaid/external-review variation, special Medicare fast tracks as first-class
steps, and concrete date computation for *every* step (not just the first).

## Pillar 2 — Document Intake Checklist

You can't win an appeal you can't document. A full implementation covers:

- **Per-scenario, per-plan checklists** — claim denial, prior-auth denial, medical-necessity,
  balance bill, surprise bill, drug/formulary/step-therapy, out-of-network, uninsured overbill.
- **How to obtain each document**, including the patient's *rights*: the ERISA/ACA right to the full
  claim file and the diagnosis/treatment codes free of charge; the HIPAA right of access to medical
  records; the right to a fully itemized bill.
- **What to extract from each document** — claim numbers, dates, codes, denial reasons, deadlines —
  so the rest of the tool can be pre-filled.
- **A guided "shoebox" intake** — eventually, drop in a PDF/photo and the tool reads it (OCR + parse)
  and tells you what's missing.

**v0.1 status:** scenario × plan checklists with why/how for each document.
**Next:** document parsing (OCR) and auto-extraction (Gate 1–2).

## Pillar 3 — Bill & EOB Audit

The money pillar. A full implementation is a rules engine over a normalized claim:

- **Patient-responsibility integrity** — the top check: contractual (CO/OA/PI) amounts must never be
  billed to the patient; only PR amounts are yours.
- **Balance billing** — in-network charges above the allowed amount (CO-45); surprise out-of-network
  bills protected by the No Surprises Act.
- **Preventive services** — ACA-listed in-network preventive care must be $0; any cost-share is a flag.
- **Coding integrity** — duplicates, unbundling/NCCI edits, upcoding, modifier misuse, units.
- **Process errors** — timely-filing denials passed to the patient (CO-29), coordination-of-benefits
  routing (CO-22), wrong-network processing, deductible charged after it was met.
- **Appealable denials** — medical-necessity (code 50) and experimental/investigational denials, which
  are frequently overturned.
- **EOB ↔ bill reconciliation** — does the provider's bill match the EOB's patient-responsibility?
- **Plain-English decoding** of CARC/RARC reason codes and the deductible/coinsurance/copay math.

**v0.1 status:** 10 code-driven checks across these categories, with severity and estimated $ impact.
**Next:** an NCCI/unbundling pair table, upcoding heuristics by specialty, and OCR ingestion so a
patient can audit a bill without hand-entering JSON (Gate 1–2).

## Pillar 4 — Appeal & Grievance Letters

Turning rights into a sent document. A full implementation covers:

- **Every letter the journey needs** — internal appeal, medical-necessity appeal, external-review
  request, grievance, claim-file request, balance-bill dispute, No Surprises Act dispute, Part D
  exception, and regulator complaints (state DOI, DOL/EBSA).
- **The required statutory language** per plan type and the *specific* asks that strengthen an appeal
  (request the claim file, the clinical criteria, a same-specialty peer reviewer).
- **Mail-merge from intake/audit** — pull the claim number, dates, denial reason, and amounts straight
  from the parsed documents.
- **"What to attach" and "how/where to send"** with proof-of-delivery guidance and the deadline.

**v0.1 status:** 8 templates with statutory hooks, mail-merge, placeholder surfacing, attach/send
guidance.
**Next:** auto-fill from audit/intake results; provider letter-of-medical-necessity request templates;
fillable PDF / e-submission where plans support it.

## Highest-impact prioritization (where the leverage is)

The product should spend effort where it changes outcomes most. The leverage logic:

1. **Knowing the deadline + that you can appeal at all.** Most people never appeal — not because they'd
   lose, but because they don't know they can or miss the window. The **Navigator** is the highest-
   leverage feature: it converts non-appealers into appealers. *(Cheap to build, huge reach.)*
2. **A correct letter with the right asks.** Removing the blank-page problem and embedding the
   claim-file request and medical-necessity framing materially raises overturn odds. **Letters** is #2.
3. **Catching billing errors that quietly cost money.** The **EOB Audit** recovers dollars even when
   there's no "denial" to appeal — and the CO-billed-to-patient and preventive-cost-share checks are
   common and clear-cut.
4. **Lowering the activation energy to gather documents.** **Intake** is the enabler for 1–3.

Then, the force-multiplier that defines 1.0: **automatically pulling the patient's documents** so
they don't have to gather anything (see [CONNECTORS.md](./CONNECTORS.md)). The biggest real-world
constraints are (a) plan-type identification and (b) document access — automation attacks both.

## Coverage matrix — plan type × appeal framework (v0.1)

| Plan type | Regulator | External/last resort | Weaker rights? |
| :-- | :-- | :-- | :-- |
| ACA individual / marketplace | State DOI + HHS/CMS | State external review (IRO) | no |
| Job-based, fully insured | State DOI + DOL | State external review (IRO) | no |
| Job-based, self-funded (ERISA) | US DOL/EBSA | **Federal** external review (HHS/MAXIMUS) | no |
| Medicare Advantage (Part C) | CMS | IRE → ALJ → Council → court | no |
| Medicare Part D | CMS | IRE → ALJ → Council → court | no |
| Original Medicare (A/B) | CMS | QIC → ALJ → Council → court | no |
| Medicaid / CHIP managed care | State + CMS (42 CFR 438) | State fair hearing | no |
| Medicaid fee-for-service | State + CMS (42 CFR 431) | State fair hearing | no |
| FEHB | OPM | OPM review | no |
| TRICARE | DHA | Reconsideration → formal review/hearing | no |
| COBRA | follows underlying plan | follows underlying plan | no |
| Short-term limited-duration | mostly state | policy/state law only | **yes** |
| Student health | state + ACA market rules | usually state external review | no |

## Out of scope (deliberately, for now)

- **Filing on the patient's behalf** without their review — every output is patient-reviewed.
- **Giving individualized legal advice** — the tool informs; it doesn't represent.
- **Storing PHI server-side** — offline by default; any cloud feature is opt-in and gated.
