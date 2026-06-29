// pathways.mjs — the deadline-bearing appeal/grievance pathways, keyed by framework.
//
// SAFETY-CRITICAL DATA. Every step carries an `authority` and `sources`. Deadlines are structured
// ({ amount, unit, businessDays? }) so the navigator can compute concrete dates. Where a number
// adjusts annually (Medicare amount-in-controversy thresholds) or varies by state, the field says
// so and the tool tells the user to confirm. These values were grounded against primary sources
// (CMS, eCFR, DOL, Medicare.gov, Medicaid.gov); confirm the exact deadline on your own notice.
//
// decisionWithin may be a single duration or a map keyed by preService/postService/urgent/
// standard/expedited (the navigator picks the right one for the denial type).

const SRC = {
  acaReg: "https://www.law.cornell.edu/cfr/text/45/147.136",
  erisaReg: "https://www.law.cornell.edu/cfr/text/29/2560.503-1",
  acaConsumer: "https://www.healthcare.gov/appeal-insurance-company-decision/",
  hhsExternal: "https://www.cms.gov/cciio/programs-and-initiatives/consumer-support-and-information/csg-ext-appeals-facts",
  maAppeals: "https://www.medicare.gov/claims-appeals/file-an-appeal/appeals-in-a-medicare-health-plan",
  partDAppeals: "https://www.medicare.gov/claims-appeals/file-an-appeal/appeals-in-a-medicare-drug-plan-part-d",
  omAppeals: "https://www.medicare.gov/claims-appeals/how-do-i-file-an-appeal",
  medicaidMC: "https://www.law.cornell.edu/cfr/text/42/part-438/subpart-F",
  medicaidFFS: "https://www.law.cornell.edu/cfr/text/42/431.221",
  opm: "https://www.opm.gov/healthcare-insurance/healthcare/plan-information/disputed-claims/",
  tricare: "https://www.tricare.mil/appeals",
  stld: "https://www.cms.gov/marketplace/private-health-insurance/short-term-limited-duration-insurance",
};

const ACA_INTERNAL = {
  key: "internal-appeal",
  name: "Internal appeal (request a full and fair review)",
  what: "Ask the plan to reconsider its denial. You can request your full claim file and the codes used, free of charge.",
  decidedBy: "Your health plan",
  fileWithin: { amount: 180, unit: "days" },
  fileFrom: "the date on your denial (adverse benefit determination)",
  decisionWithin: {
    preService: { amount: 30, unit: "days" },
    postService: { amount: 60, unit: "days" },
    urgent: { amount: 72, unit: "hours" },
  },
  expedited: "If waiting could seriously jeopardize your health, request an expedited appeal (decided within 72 hours).",
  authority: "45 CFR 147.136(b); 29 CFR 2560.503-1",
  sources: [SRC.acaReg, SRC.erisaReg],
};

const ACA_EXTERNAL_STATE = {
  key: "external-review",
  name: "External review by an Independent Review Organization (IRO)",
  what: "An independent doctor/organization reviews the denial. Their decision is binding on the plan. The 4-month window is the federal floor; some states set a shorter one (e.g. 60 days) — confirm the deadline on your final denial notice.",
  decidedBy: "State-assigned Independent Review Organization",
  fileWithin: { amount: 4, unit: "months" },
  fileFrom: "the date of the final internal appeal denial",
  decisionWithin: { standard: { amount: 45, unit: "days" }, expedited: { amount: 72, unit: "hours" } },
  expedited: "Expedited external review (72 hours) is available for urgent situations.",
  authority: "45 CFR 147.136(c)–(d) (state process)",
  binding: true,
  sources: [SRC.acaReg, SRC.acaConsumer],
};

const ACA_EXTERNAL_FEDERAL = {
  ...ACA_EXTERNAL_STATE,
  decidedBy: "Federal (HHS-administered) IRO — MAXIMUS Federal Services, or a private accredited IRO",
  authority: "45 CFR 147.136(d) (federal HHS-administered process)",
  sources: [SRC.acaReg, SRC.hhsExternal],
};

export const PATHWAYS = {
  aca: {
    id: "aca",
    name: "ACA / fully-insured: internal appeal + state external review",
    appliesTo: "ACA individual & fully-insured group plans (and student/COBRA on those plans)",
    grievanceNote:
      "A 'grievance' is a complaint about service or quality of care; a coverage/payment denial is an 'appeal'. This pathway is for appeals.",
    steps: [ACA_INTERNAL, ACA_EXTERNAL_STATE],
  },

  erisa: {
    id: "erisa",
    name: "Self-funded employer (ERISA): internal appeal + federal external review",
    appliesTo: "Self-funded job-based plans (regulated by US DOL/EBSA, not your state)",
    grievanceNote:
      "Self-funded plans use the FEDERAL external review process, not your state insurance department. Escalate complaints to US DOL/EBSA.",
    steps: [
      { ...ACA_INTERNAL, authority: "29 CFR 2560.503-1; 45 CFR 147.136(b)" },
      ACA_EXTERNAL_FEDERAL,
    ],
  },

  "medicare-advantage": {
    id: "medicare-advantage",
    name: "Medicare Advantage (Part C): 5-level appeal",
    appliesTo: "Medicare Advantage (Part C) medical denials",
    grievanceNote:
      "Use a 'grievance' (within 60 days) for complaints about service/quality; use an 'appeal' for coverage denials. A pre-service coverage request is an 'organization determination'.",
    steps: [
      {
        key: "reconsideration",
        name: "Level 1 — Reconsideration by your plan",
        what: "Ask your Medicare Advantage plan to reconsider its denial (organization determination).",
        decidedBy: "Your Medicare Advantage plan",
        fileWithin: { amount: 60, unit: "days" },
        fileFrom: "the date of the plan's denial (organization determination)",
        decisionWithin: {
          preService: { amount: 30, unit: "days" },
          postService: { amount: 60, unit: "days" },
          urgent: { amount: 72, unit: "hours" },
        },
        expedited: "Expedited (fast) reconsideration within 72 hours if your health is at risk. If the plan upholds the denial, it auto-forwards to Level 2.",
        authority: "42 CFR Part 422, Subpart M",
        sources: [SRC.maAppeals],
      },
      {
        key: "ire",
        name: "Level 2 — Independent Review Entity (IRE)",
        what: "An independent contractor for CMS reviews the denial automatically after a Level 1 upholding.",
        decidedBy: "Independent Review Entity (CMS-contracted)",
        decisionWithin: { standard: { amount: 30, unit: "days" }, expedited: { amount: 72, unit: "hours" } },
        authority: "42 CFR 422.592",
        sources: [SRC.maAppeals],
      },
      {
        key: "alj",
        name: "Level 3 — Administrative Law Judge (OMHA) hearing",
        what: "Request a hearing before a judge if the IRE upholds the denial and the amount meets the threshold.",
        decidedBy: "OMHA Administrative Law Judge",
        fileWithin: { amount: 60, unit: "days" },
        fileFrom: "the date of the IRE decision",
        amountInControversy: "$200 (CY2026) — adjusts annually; confirm the current-year amount",
        authority: "42 CFR 422.600",
        sources: [SRC.maAppeals],
      },
      {
        key: "council",
        name: "Level 4 — Medicare Appeals Council review",
        decidedBy: "Medicare Appeals Council",
        fileWithin: { amount: 60, unit: "days" },
        fileFrom: "the date of the ALJ decision",
        authority: "42 CFR 422.608",
        sources: [SRC.maAppeals],
      },
      {
        key: "court",
        name: "Level 5 — Federal district court",
        decidedBy: "Federal district court",
        fileWithin: { amount: 60, unit: "days" },
        fileFrom: "the date of the Council decision",
        amountInControversy: "$1,960 (CY2026) — adjusts annually; confirm the current-year amount",
        authority: "42 CFR 422.612",
        sources: [SRC.maAppeals],
      },
    ],
  },

  "medicare-part-d": {
    id: "medicare-part-d",
    name: "Medicare Part D (drugs): coverage determination + 5-level appeal",
    appliesTo: "Medicare prescription-drug coverage (standalone PDP or MA-PD)",
    grievanceNote:
      "Start with a coverage determination or formulary exception request; if denied, the appeal levels below apply.",
    steps: [
      {
        key: "coverage-determination",
        name: "Coverage determination / exception request",
        what: "Ask the plan to cover a drug, lower a tier, or waive a restriction. A prescriber's supporting statement is needed for an exception.",
        decidedBy: "Your Part D plan",
        decisionWithin: {
          standard: { amount: 72, unit: "hours" },
          expedited: { amount: 24, unit: "hours" },
          payment: { amount: 14, unit: "days" },
        },
        expedited: "Expedited decision within 24 hours when your health is at risk.",
        authority: "42 CFR Part 423, Subpart M",
        sources: [SRC.partDAppeals],
      },
      {
        key: "redetermination",
        name: "Level 1 — Redetermination by your plan",
        decidedBy: "Your Part D plan",
        fileWithin: { amount: 60, unit: "days" },
        fileFrom: "the date of the coverage determination denial",
        decisionWithin: {
          standard: { amount: 7, unit: "days" },
          expedited: { amount: 72, unit: "hours" },
          payment: { amount: 14, unit: "days" },
        },
        authority: "42 CFR 423.580–423.590",
        sources: [SRC.partDAppeals],
      },
      {
        key: "ire",
        name: "Level 2 — Independent Review Entity (IRE)",
        decidedBy: "Independent Review Entity (C2C Innovative Solutions)",
        fileWithin: { amount: 60, unit: "days" },
        fileFrom: "the date of the redetermination denial",
        decisionWithin: { standard: { amount: 7, unit: "days" }, expedited: { amount: 72, unit: "hours" } },
        authority: "42 CFR 423.600",
        sources: [SRC.partDAppeals],
      },
      {
        key: "alj",
        name: "Level 3 — Administrative Law Judge (OMHA) hearing",
        decidedBy: "OMHA Administrative Law Judge",
        fileWithin: { amount: 60, unit: "days" },
        fileFrom: "the date of the IRE decision",
        amountInControversy: "$200 (CY2026) — adjusts annually; confirm the current-year amount",
        authority: "42 CFR 423.610",
        sources: [SRC.partDAppeals],
      },
      {
        key: "council",
        name: "Level 4 — Medicare Appeals Council review",
        decidedBy: "Medicare Appeals Council",
        fileWithin: { amount: 60, unit: "days" },
        fileFrom: "the date of the ALJ decision",
        authority: "42 CFR 423.620",
        sources: [SRC.partDAppeals],
      },
      {
        key: "court",
        name: "Level 5 — Federal district court",
        decidedBy: "Federal district court",
        amountInControversy: "$1,960 (CY2026) — adjusts annually; confirm the current-year amount",
        authority: "42 CFR 423.630",
        sources: [SRC.partDAppeals],
      },
    ],
  },

  "original-medicare": {
    id: "original-medicare",
    name: "Original Medicare (Parts A & B): 5-level appeal",
    appliesTo: "Original/Traditional Medicare claims (from your Medicare Summary Notice)",
    grievanceNote:
      "Appeals start from your Medicare Summary Notice (MSN). Medicare presumes you received the notice 5 days after its date, so you effectively get those extra days. Separate fast-track appeals (QIO/BFCC-QIO) apply when a hospital plans to discharge you or services are ending — call the number on your notice the same day.",
    steps: [
      {
        key: "redetermination",
        name: "Level 1 — Redetermination",
        what: "Ask the Medicare Administrative Contractor to re-review the claim shown on your MSN.",
        decidedBy: "Medicare Administrative Contractor (MAC)",
        fileWithin: { amount: 120, unit: "days" },
        fileFrom: "the date you got the Medicare Summary Notice (MSN)",
        decisionWithin: { amount: 60, unit: "days" },
        authority: "42 CFR 405.940–405.958",
        sources: [SRC.omAppeals],
      },
      {
        key: "reconsideration",
        name: "Level 2 — Reconsideration by a QIC",
        decidedBy: "Qualified Independent Contractor (QIC)",
        fileWithin: { amount: 180, unit: "days" },
        fileFrom: "the date of the redetermination decision",
        decisionWithin: { amount: 60, unit: "days" },
        authority: "42 CFR 405.960–405.978",
        sources: [SRC.omAppeals],
      },
      {
        key: "alj",
        name: "Level 3 — Administrative Law Judge (OMHA) hearing",
        decidedBy: "OMHA Administrative Law Judge",
        fileWithin: { amount: 60, unit: "days" },
        fileFrom: "the date of the reconsideration decision",
        amountInControversy: "$200 (CY2026) — adjusts annually; confirm the current-year amount",
        authority: "42 CFR 405.1000+",
        sources: [SRC.omAppeals],
      },
      {
        key: "council",
        name: "Level 4 — Medicare Appeals Council review",
        decidedBy: "Medicare Appeals Council",
        fileWithin: { amount: 60, unit: "days" },
        fileFrom: "the date of the ALJ decision",
        authority: "42 CFR 405.1100+",
        sources: [SRC.omAppeals],
      },
      {
        key: "court",
        name: "Level 5 — Federal district court",
        decidedBy: "Federal district court",
        fileWithin: { amount: 60, unit: "days" },
        fileFrom: "the date of the Council decision",
        amountInControversy: "$1,960 (CY2026) — adjusts annually; confirm the current-year amount",
        authority: "42 CFR 405.1130+",
        sources: [SRC.omAppeals],
      },
    ],
  },

  "medicaid-managed-care": {
    id: "medicaid-managed-care",
    name: "Medicaid/CHIP managed care: plan appeal + state fair hearing",
    appliesTo: "Medicaid or CHIP coverage delivered through a managed care plan (MCO)",
    grievanceNote:
      "You can ask to KEEP your current benefits during the appeal if you request it by the deadline on your notice (often within 10 days). Steps and exact windows vary by state — confirm with your state Medicaid agency.",
    steps: [
      {
        key: "plan-appeal",
        name: "Level 1 — Internal appeal with your Medicaid plan (MCO)",
        what: "You must usually complete the plan's internal appeal before a State Fair Hearing.",
        decidedBy: "Your Medicaid managed care plan (MCO)",
        fileWithin: { amount: 60, unit: "days" },
        fileFrom: "the date of the notice of adverse benefit determination",
        decisionWithin: { standard: { amount: 30, unit: "days" }, expedited: { amount: 72, unit: "hours" } },
        expedited: "Expedited resolution within 72 hours when waiting could seriously jeopardize your health.",
        authority: "42 CFR 438.402, 438.408",
        sources: [SRC.medicaidMC],
      },
      {
        key: "state-fair-hearing",
        name: "Level 2 — State Fair Hearing",
        what: "A hearing before the state after the plan's internal appeal.",
        decidedBy: "State Medicaid agency (fair hearing)",
        fileWithin: { amount: 120, unit: "days" },
        fileFrom: "the date of the plan's appeal resolution notice",
        decisionNote: "The state must reach a decision within 90 days (standard) of your request (3 working days if expedited).",
        authority: "42 CFR 438.408, 431.220–431.244",
        sources: [SRC.medicaidMC],
      },
    ],
  },

  "medicaid-ffs": {
    id: "medicaid-ffs",
    name: "Medicaid (fee-for-service): state fair hearing",
    appliesTo: "Medicaid coverage paid directly by the state (no managed care plan)",
    grievanceNote:
      "Request a fair hearing within the time on your notice. Ask to keep benefits during the appeal if you request it in time. Exact windows vary by state.",
    steps: [
      {
        key: "state-fair-hearing",
        name: "State Fair Hearing",
        decidedBy: "State Medicaid agency (fair hearing)",
        fileWithin: { amount: 90, unit: "days" },
        fileFrom: "the date of the notice of action (states set the window, no fewer than 20 and up to 90 days)",
        decisionNote: "The state must ordinarily decide within 90 days of your request.",
        authority: "42 CFR 431.221, 431.244",
        sources: [SRC.medicaidFFS],
      },
    ],
  },

  fehb: {
    id: "fehb",
    name: "Federal Employees Health Benefits (FEHB): plan review + OPM",
    appliesTo: "Federal employee/retiree FEHB plans (governed by OPM)",
    grievanceNote:
      "FEHB is governed by OPM, not state law or the ACA external-review process. Appeal the plan first, then ask OPM to review the disputed claim.",
    steps: [
      {
        key: "plan-reconsideration",
        name: "Step 1 — Ask the plan to reconsider",
        decidedBy: "Your FEHB plan carrier",
        fileWithin: { amount: 6, unit: "months" },
        fileFrom: "the date of the plan's denial",
        decisionWithin: { amount: 30, unit: "days" },
        authority: "5 CFR 890.105",
        sources: [SRC.opm],
      },
      {
        key: "opm-review",
        name: "Step 2 — Ask OPM to review the disputed claim",
        decidedBy: "U.S. Office of Personnel Management (OPM)",
        fileWithin: { amount: 90, unit: "days" },
        fileFrom: "the date the carrier affirmed its denial (or within 120 days of your reconsideration request if the carrier never responded)",
        decisionNote: "OPM reviews the disputed claim and issues a final decision.",
        authority: "5 CFR 890.105(a)(2)–(e)",
        sources: [SRC.opm, "https://www.ecfr.gov/current/title-5/chapter-I/subchapter-B/part-890/subpart-A/section-890.105"],
      },
    ],
  },

  tricare: {
    id: "tricare",
    name: "TRICARE (military): reconsideration + appeal",
    appliesTo: "TRICARE plans (Defense Health Agency)",
    grievanceNote:
      "TRICARE has its own appeal process, separate from ACA/ERISA. Deadlines and steps depend on whether the issue is a factual claim or a medical-necessity/authorization denial.",
    steps: [
      {
        key: "reconsideration",
        name: "Step 1 — Reconsideration by the TRICARE contractor",
        decidedBy: "Your TRICARE regional contractor",
        fileWithin: { amount: 90, unit: "days" },
        fileFrom: "the date of the initial denial",
        authority: "32 CFR 199.10",
        sources: [SRC.tricare],
      },
      {
        key: "formal-review",
        name: "Step 2 — Formal review / independent hearing",
        decidedBy: "Defense Health Agency (and, for larger amounts, an independent hearing)",
        fileWithin: { amount: 60, unit: "days" },
        fileFrom: "the date of the reconsideration decision",
        authority: "32 CFR 199.10",
        sources: [SRC.tricare],
      },
    ],
  },

  "short-term": {
    id: "short-term",
    name: "Short-term limited-duration: policy + state law (weaker rights)",
    appliesTo: "Short-term limited-duration plans (NOT ACA-regulated)",
    grievanceNote:
      "These plans are not required to follow the ACA's internal-appeal and external-review guarantees. Your rights come from the policy and your state's law — read the policy's appeal section and contact your state insurance department.",
    steps: [
      {
        key: "policy-appeal",
        name: "Appeal under the policy / state law",
        what: "Follow the appeal procedure printed in your policy; deadlines are set by the policy and state law, not the ACA.",
        decidedBy: "Your insurer (and your state insurance department)",
        fileFrom: "the date of the denial — check the policy for the exact window",
        decisionNote: "There is no standardized federal timeline; confirm the deadline in your policy and with your state DOI.",
        authority: "State law + policy terms (no ACA external-review guarantee)",
        sources: [SRC.stld],
      },
    ],
  },
};
