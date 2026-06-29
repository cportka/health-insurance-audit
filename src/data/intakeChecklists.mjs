// intakeChecklists.mjs — what documents a patient needs to gather, per scenario.
//
// DOCUMENTS is a catalog keyed by id. SCENARIOS map a situation to the documents that matter,
// marking each required or helpful. The intake module composes these with plan-type specifics.

export const DOCUMENTS = {
  denialLetter: {
    name: "Denial letter / Adverse Benefit Determination notice",
    why: "It states the reason for denial, the codes used, your appeal rights, and the exact deadline — the single most important document.",
    howToGet: "Mailed or posted to your member portal. If you can't find it, call the plan and request the written adverse benefit determination.",
  },
  eob: {
    name: "Explanation of Benefits (EOB)",
    why: "Shows billed vs allowed vs paid vs your responsibility, plus the reason/adjustment codes the audit relies on. An EOB is NOT a bill.",
    howToGet: "Member portal or mailed after each claim. Request copies for the dates in question.",
  },
  itemizedBill: {
    name: "Itemized bill (line-item, not a summary)",
    why: "Reveals duplicate charges, upcoding, unbundling, and services never received.",
    howToGet: "Call the provider's billing office and request a fully itemized bill with CPT/HCPCS codes, dates, and per-line charges.",
  },
  memberId: {
    name: "Insurance member ID card (front and back)",
    why: "Has your member/group numbers and the correct claims/appeals address and phone.",
    howToGet: "Physical card or member portal.",
  },
  planDocument: {
    name: "Plan document — SPD, Evidence of Coverage (EOC), or Certificate of Coverage",
    why: "The contract that defines what's covered, exclusions, and your appeal procedure. For job-based plans this is the Summary Plan Description (SPD).",
    howToGet: "Request the SPD/EOC from your HR/benefits office or the plan. For ERISA plans you have a legal right to it free of charge.",
  },
  claimFile: {
    name: "Complete claim file and internal criteria",
    why: "Includes the clinical rationale, guidelines, and any expert reviews behind the denial — needed to rebut it.",
    howToGet: "For ACA/ERISA plans you can request your full claim file and the diagnosis/treatment codes free of charge.",
  },
  medicalRecords: {
    name: "Relevant medical records and chart notes",
    why: "Documents the medical necessity of the service in dispute.",
    howToGet: "Request from each treating provider's medical records department (HIPAA right of access; usually free or low-cost).",
  },
  letterOfMedicalNecessity: {
    name: "Letter of medical necessity from your provider",
    why: "A physician's statement tying the service to clinical guidelines is the strongest single addition to a medical-necessity appeal.",
    howToGet: "Ask the ordering/treating provider to write one addressing the plan's stated denial reason.",
  },
  priorAuth: {
    name: "Prior authorization / pre-certification records",
    why: "Shows whether authorization was requested, granted, or required.",
    howToGet: "From the provider and/or the plan's authorization department.",
  },
  referral: {
    name: "Referral documentation",
    why: "Some plans (HMOs) require a referral; its absence is a common, fixable denial reason.",
    howToGet: "From your primary care provider's office.",
  },
  proofTimelyFiling: {
    name: "Proof of timely filing / submission dates",
    why: "Defeats a wrongful 'late filing' denial and documents your own deadline compliance.",
    howToGet: "Keep dated copies of everything you and your provider submit; use certified mail or portal timestamps.",
  },
  representativeForm: {
    name: "Authorized/Appointed Representative form",
    why: "Lets a family member, advocate, or provider act on your behalf in the appeal.",
    howToGet: "Plan-specific form; Medicare uses Form CMS-1696 (Appointment of Representative).",
  },
  prescriptionRecords: {
    name: "Prescription and pharmacy records",
    why: "Needed for drug/formulary, step-therapy, and Part D coverage-determination disputes.",
    howToGet: "From your pharmacy and the prescribing provider.",
  },
  goodFaithEstimate: {
    name: "Good Faith Estimate (GFE)",
    why: "If you're uninsured/self-pay and a bill exceeds your GFE by $400+, you can use Patient-Provider Dispute Resolution.",
    howToGet: "Providers must give uninsured/self-pay patients a GFE before scheduled care; keep it.",
  },
};

// Each scenario lists document ids and whether they're required (vs helpful).
export const SCENARIOS = {
  "claim-denied": {
    label: "A claim/service was denied or not paid",
    required: ["denialLetter", "eob", "memberId", "planDocument"],
    helpful: ["claimFile", "medicalRecords", "itemizedBill", "representativeForm"],
  },
  "prior-auth-denied": {
    label: "Prior authorization / pre-service request was denied",
    required: ["denialLetter", "memberId", "planDocument", "priorAuth"],
    helpful: ["letterOfMedicalNecessity", "medicalRecords", "claimFile", "representativeForm"],
  },
  "medical-necessity": {
    label: "Denied as 'not medically necessary' or experimental",
    required: ["denialLetter", "planDocument", "letterOfMedicalNecessity", "medicalRecords"],
    helpful: ["claimFile", "eob", "representativeForm"],
  },
  "balance-bill": {
    label: "Billed more than expected by an in-network provider",
    required: ["eob", "itemizedBill", "memberId"],
    helpful: ["planDocument", "proofTimelyFiling"],
  },
  "surprise-bill": {
    label: "Surprise out-of-network bill (ER or in-network facility)",
    required: ["eob", "itemizedBill", "memberId"],
    helpful: ["denialLetter", "planDocument"],
  },
  "drug-denied": {
    label: "A prescription drug was denied / not on formulary / step therapy",
    required: ["denialLetter", "memberId", "prescriptionRecords"],
    helpful: ["letterOfMedicalNecessity", "planDocument", "representativeForm"],
  },
  "out-of-network": {
    label: "Out-of-network denial or higher cost-share",
    required: ["denialLetter", "eob", "memberId", "planDocument"],
    helpful: ["referral", "medicalRecords", "claimFile"],
  },
  "uninsured-overbill": {
    label: "Uninsured/self-pay bill far above the estimate",
    required: ["itemizedBill", "goodFaithEstimate"],
    helpful: [],
  },
};
