// letterTemplates.mjs — appeal & grievance letter templates.
//
// Each template is a function(ctx) -> { subject, body, attachments, howToSend }.
// Templates use field() so a letter is still usable when the user hasn't filled everything in —
// missing values become clear [BRACKETED] placeholders the user replaces.

/** Return ctx[key] if present and non-empty, else a bracketed placeholder. */
function field(ctx, key, placeholder) {
  const v = ctx?.[key];
  return v === undefined || v === null || v === "" ? `[${placeholder}]` : String(v);
}

function header(ctx) {
  return [
    `${field(ctx, "memberName", "YOUR FULL NAME")}`,
    `${field(ctx, "memberAddress", "YOUR ADDRESS")}`,
    `${field(ctx, "memberPhone", "YOUR PHONE")}`,
    "",
    `${field(ctx, "date", "TODAY'S DATE")}`,
    "",
    `${field(ctx, "planName", "HEALTH PLAN NAME")}`,
    `Attn: Appeals Department`,
    `${field(ctx, "planAddress", "PLAN APPEALS ADDRESS (from your denial notice or member ID card)")}`,
    "",
    `Re: Appeal of denied claim`,
    `Member/ID #: ${field(ctx, "memberId", "MEMBER ID")}`,
    `Group #: ${field(ctx, "groupNumber", "GROUP NUMBER")}`,
    `Claim #: ${field(ctx, "claimNumber", "CLAIM NUMBER")}`,
    `Patient: ${field(ctx, "patientName", "PATIENT NAME")}`,
    `Date(s) of service: ${field(ctx, "serviceDate", "DATE OF SERVICE")}`,
    "",
  ].join("\n");
}

const ATTACH_COMMON = [
  "Copy of the denial letter / Explanation of Benefits",
  "Copy of your insurance card (front and back)",
];

export const TEMPLATES = {
  "internal-appeal": {
    label: "Internal appeal (standard)",
    build(ctx) {
      const body =
        header(ctx) +
        [
          "To Whom It May Concern:",
          "",
          `I am writing to formally appeal the denial of the claim above. I am requesting a full and ` +
            `fair review of this adverse benefit determination.`,
          "",
          `The plan's stated reason for denial was: "${field(ctx, "denialReason", "REASON STATED ON YOUR DENIAL")}". ` +
            `I disagree with this decision for the following reasons:`,
          "",
          `${field(ctx, "argument", "EXPLAIN WHY THE SERVICE SHOULD BE COVERED — e.g., it was medically necessary, it is a covered benefit under my plan, prior authorization was obtained, or the denial reason is factually wrong")}`,
          "",
          `Under my plan's appeal rights, I am also requesting, free of charge: (1) a complete copy of ` +
            `my claim file, (2) the specific plan provisions and any internal rules, guidelines, or ` +
            `clinical criteria relied on in this denial, and (3) the diagnosis and treatment codes ` +
            `(and their meanings) associated with this claim.`,
          "",
          `Please overturn this denial and process the claim. If you uphold the denial in whole or in ` +
            `part, please provide a written explanation and advise me of my right to an independent ` +
            `external review.`,
          "",
          `I can be reached at ${field(ctx, "memberPhone", "YOUR PHONE")} or ${field(ctx, "memberEmail", "YOUR EMAIL")}.`,
          "",
          "Sincerely,",
          "",
          `${field(ctx, "memberName", "YOUR FULL NAME")}`,
        ].join("\n");
      return {
        subject: `Internal appeal — Claim #${field(ctx, "claimNumber", "CLAIM NUMBER")}`,
        body,
        attachments: [
          ...ATTACH_COMMON,
          "Any supporting medical records or test results",
          "A letter of medical necessity from your provider (strongly recommended for clinical denials)",
        ],
        howToSend:
          "Send to the appeals address on your denial notice. Use a method that proves delivery " +
          "(certified mail with return receipt, or the plan's portal with a saved confirmation). " +
          "Keep a copy of everything.",
      };
    },
  },

  "medical-necessity-appeal": {
    label: "Internal appeal — medical necessity / experimental denial",
    build(ctx) {
      const base = TEMPLATES["internal-appeal"].build(ctx);
      const body =
        header(ctx) +
        [
          "To Whom It May Concern:",
          "",
          `I am appealing the denial of the claim above, which was denied as "not medically ` +
            `necessary" or "experimental/investigational." I am requesting a full and fair review, ` +
            `including review by an appropriate clinical peer in the same specialty.`,
          "",
          `My treating provider has determined this service is medically necessary. Attached is a ` +
            `letter of medical necessity describing my condition, the treatments already tried, and ` +
            `why this service is appropriate under accepted clinical guidelines.`,
          "",
          `Please also provide, free of charge, the specific clinical criteria, medical policy, and ` +
            `any expert review used to deny this claim, and identify the credentials of the reviewer.`,
          "",
          `${field(ctx, "argument", "ADD ANY ADDITIONAL FACTS: diagnosis, prior treatments that failed, guideline citations your doctor provided")}`,
          "",
          `Please overturn this denial. If upheld, please advise me of my right to independent external review.`,
          "",
          "Sincerely,",
          "",
          `${field(ctx, "memberName", "YOUR FULL NAME")}`,
        ].join("\n");
      return {
        ...base,
        subject: `Medical-necessity appeal — Claim #${field(ctx, "claimNumber", "CLAIM NUMBER")}`,
        body,
        attachments: [
          ...ATTACH_COMMON,
          "Letter of medical necessity from your treating provider (REQUIRED for this appeal)",
          "Relevant chart notes, imaging, and lab results",
          "Records of prior treatments that were tried and failed (for step-therapy denials)",
        ],
      };
    },
  },

  "external-review-request": {
    label: "External review request (independent review organization)",
    build(ctx) {
      const body =
        header(ctx) +
        [
          "To Whom It May Concern:",
          "",
          `I am requesting an independent EXTERNAL REVIEW of the final adverse benefit determination ` +
            `on the claim above. I have completed the plan's internal appeal process` +
            `${ctx.internalDenialDate ? `, with a final internal denial dated ${field(ctx, "internalDenialDate", "DATE")}` : ""}.`,
          "",
          `The denial reason was: "${field(ctx, "denialReason", "REASON")}". I believe the service is ` +
            `covered and/or medically necessary for the reasons stated in my internal appeal and the ` +
            `enclosed documents.`,
          "",
          `Please assign this matter to an Independent Review Organization (IRO). I understand the ` +
            `IRO's decision is binding on the plan. If my situation is urgent, I am also requesting an ` +
            `EXPEDITED external review.`,
          "",
          "Sincerely,",
          "",
          `${field(ctx, "memberName", "YOUR FULL NAME")}`,
        ].join("\n");
      return {
        subject: `External review request — Claim #${field(ctx, "claimNumber", "CLAIM NUMBER")}`,
        body,
        attachments: [
          ...ATTACH_COMMON,
          "Copy of the FINAL internal appeal denial letter",
          "All supporting medical records and your provider's letter",
        ],
        howToSend:
          "Follow the external-review instructions on your final internal denial. Depending on your " +
          "plan this goes to your state's external review program or the federal (HHS-administered) " +
          "process. Request it within the deadline on your notice (often 4 months).",
      };
    },
  },

  grievance: {
    label: "Grievance (quality of care or service complaint)",
    build(ctx) {
      const body =
        header(ctx) +
        [
          "To Whom It May Concern:",
          "",
          `I am filing a GRIEVANCE regarding ${field(ctx, "grievanceSubject", "THE PROBLEM — e.g., quality of care, a long wait for authorization, rude service, or difficulty getting care")}.`,
          "",
          `What happened: ${field(ctx, "argument", "DESCRIBE WHAT HAPPENED, WITH DATES AND NAMES")}`,
          "",
          `What I am asking for: ${field(ctx, "requestedResolution", "WHAT WOULD RESOLVE THIS")}`,
          "",
          `Please investigate and respond in writing with the outcome and any corrective action.`,
          "",
          "Sincerely,",
          "",
          `${field(ctx, "memberName", "YOUR FULL NAME")}`,
        ].join("\n");
      return {
        subject: `Grievance — Member #${field(ctx, "memberId", "MEMBER ID")}`,
        body,
        attachments: ["Any documents, dates, or names that support your complaint"],
        howToSend:
          "Send to the grievances address or phone on your member ID card or plan website. A grievance " +
          "is about service/quality; if you are disputing a coverage or payment denial, file an APPEAL instead.",
      };
    },
  },

  "claim-file-request": {
    label: "Request your complete claim file (ERISA/ACA right)",
    build(ctx) {
      const body =
        header(ctx) +
        [
          "To Whom It May Concern:",
          "",
          `I am requesting, free of charge, all documents, records, and other information relevant to ` +
            `the claim above. Specifically, I request: (1) my complete claim file; (2) the specific ` +
            `plan provisions relied on; (3) any internal rules, guidelines, protocols, or clinical ` +
            `criteria used; (4) the identity and credentials of any expert whose advice was obtained; ` +
            `and (5) the diagnosis and treatment codes and their meanings.`,
          "",
          `I am also requesting a copy of the Summary Plan Description (SPD) and the full plan document.`,
          "",
          `Please provide these so I can prepare a complete appeal.`,
          "",
          "Sincerely,",
          "",
          `${field(ctx, "memberName", "YOUR FULL NAME")}`,
        ].join("\n");
      return {
        subject: `Request for claim file and plan documents — Claim #${field(ctx, "claimNumber", "CLAIM NUMBER")}`,
        body,
        attachments: ATTACH_COMMON,
        howToSend:
          "Send to the plan administrator (for job-based plans, this right comes from ERISA). Keep proof " +
          "of the request date — the plan must respond within set timeframes.",
      };
    },
  },

  "balance-bill-dispute": {
    label: "Dispute an in-network balance bill",
    build(ctx) {
      const body =
        header(ctx) +
        [
          `To the Billing Department:`,
          "",
          `I received a bill for the service above in the amount of ${field(ctx, "amount", "AMOUNT")}. ` +
            `According to my Explanation of Benefits, the plan's allowed amount and my patient ` +
            `responsibility are different from what you are billing me.`,
          "",
          `If you are an in-network provider, you agreed to accept the plan's allowed amount as payment ` +
            `in full and cannot bill me the contractual difference (the amount written off). Please ` +
            `correct my bill to reflect only my actual patient responsibility (deductible, coinsurance, ` +
            `or copay) shown on the EOB.`,
          "",
          `Please send a corrected, itemized bill. I am disputing the balance-billed amount and ` +
            `request that you place the account on hold while this is resolved.`,
          "",
          "Sincerely,",
          "",
          `${field(ctx, "memberName", "YOUR FULL NAME")}`,
        ].join("\n");
      return {
        subject: `Billing dispute — balance billing — Account #${field(ctx, "accountNumber", "ACCOUNT NUMBER")}`,
        body,
        attachments: [
          "Copy of the Explanation of Benefits showing the allowed amount and patient responsibility",
          "Copy of the bill you received",
        ],
        howToSend: "Send to the provider's billing office and keep a copy. If unresolved, contact your plan and your state insurance department.",
      };
    },
  },

  "no-surprises-complaint": {
    label: "No Surprises Act — surprise bill dispute / complaint",
    build(ctx) {
      const body =
        header(ctx) +
        [
          "To Whom It May Concern:",
          "",
          `I am disputing a surprise out-of-network bill for the service above. This care was ` +
            `${field(ctx, "nsaBasis", "EITHER emergency care OR care at an in-network facility from an out-of-network provider")}.`,
          "",
          `Under the federal No Surprises Act, I am protected from balance billing for these services ` +
            `and should owe no more than my in-network cost-sharing. Please reprocess this claim so my ` +
            `responsibility reflects in-network cost-sharing, and instruct the provider not to balance ` +
            `bill me.`,
          "",
          `I did not give written notice-and-consent to waive these protections.`,
          "",
          "Sincerely,",
          "",
          `${field(ctx, "memberName", "YOUR FULL NAME")}`,
        ].join("\n");
      return {
        subject: `No Surprises Act dispute — Claim #${field(ctx, "claimNumber", "CLAIM NUMBER")}`,
        body,
        attachments: [...ATTACH_COMMON, "The bill showing the balance-billed amount"],
        howToSend:
          "Send to your plan and the provider. You can also file a federal complaint with the No " +
          "Surprises Help Desk at 1-800-985-3059, or at cms.gov/nosurprises.",
      };
    },
  },

  "part-d-coverage-determination": {
    label: "Medicare Part D coverage determination / formulary exception request",
    build(ctx) {
      const body =
        header(ctx) +
        [
          "To the Plan's Pharmacy/Coverage Determination Department:",
          "",
          `I am requesting a coverage determination / formulary exception for the prescription drug: ` +
            `${field(ctx, "drugName", "DRUG NAME AND DOSE")}.`,
          "",
          `My prescriber has determined this drug is medically necessary. ` +
            `${field(ctx, "argument", "EXPLAIN: other formulary drugs were tried and did not work or caused side effects, or are expected to be less effective for my condition")}.`,
          "",
          `A supporting statement from my prescriber is enclosed. If my health could be seriously ` +
            `harmed by waiting, I request an EXPEDITED (24-hour) decision.`,
          "",
          "Sincerely,",
          "",
          `${field(ctx, "memberName", "YOUR FULL NAME")}`,
        ].join("\n");
      return {
        subject: `Part D coverage determination — ${field(ctx, "drugName", "DRUG NAME")}`,
        body,
        attachments: [
          "Prescriber's supporting statement (required for an exception)",
          "Records of other drugs tried and their outcomes",
        ],
        howToSend:
          "Send to your Part D plan's coverage-determination contact (on the plan website or member " +
          "materials). If denied, you can request a redetermination (appeal).",
      };
    },
  },
};
