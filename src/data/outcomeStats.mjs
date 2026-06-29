// outcomeStats.mjs — plan-type-specific appeal outcome odds, surfaced at the moment of denial.
//
// The single highest-leverage thing this tool can tell someone is: "people who appeal this kind of
// denial win a meaningful share of the time, and almost nobody appeals." This module holds those
// numbers, keyed by appeal framework, each with a primary-source citation. The navigator attaches
// the right entry to its result. Figures are rates from cited studies/years; they are encouragement
// and context, NOT a prediction about any individual case.

const KFF_2024 = "https://www.kff.org/patient-consumer-protections/claims-denials-and-appeals-in-aca-marketplace-plans-in-2024/";
const KFF_AWARE = "https://www.kff.org/affordable-care-act/consumer-survey-highlights-problems-with-denied-health-insurance-claims/";
const CMS_EXT = "https://www.cms.gov/cciio/programs-and-initiatives/consumer-support-and-information/csg-ext-appeals-facts";
const OIG_MA_2018 = "https://oig.hhs.gov/reports/all/2018/medicare-advantage-appeal-outcomes-and-audit-findings-raise-concerns-about-service-and-payment-denials/";
const OIG_MA_SNF_2026 = "https://oig.hhs.gov/reports/all/2026/medicare-advantage-organizations-overturned-nearly-all-appealed-prior-authorization-denials-for-skilled-nursing-facility-admission-raising-concerns-about-initial-denials/";
const OIG_MEDICAID_2023 = "https://oig.hhs.gov/reports/all/2023/high-rates-of-prior-authorization-denials-by-some-plans-and-limited-state-oversight-raise-concerns-about-access-to-care-in-medicaid-managed-care/";
const MEDICARE_APPEALS = "https://www.medicare.gov/claims-appeals";

export const GENERAL_STATS = {
  headline: "Most people never appeal — and a meaningful share of those who do, win.",
  detail:
    "Across health coverage, the great majority of denials are never appealed, often just because people don't know they can. Appealing is free and your right.",
  appealRate: "Most denials are never appealed.",
  overturn: "A meaningful share of appeals succeed.",
  sources: [KFF_AWARE],
};

export const OUTCOME_STATS = {
  aca: {
    headline: "Few people appeal ACA/marketplace denials — but about 1 in 3 internal appeals are overturned.",
    detail:
      "On HealthCare.gov plans, insurers denied ~19% of in-network claims in 2024, yet consumers appealed fewer than 1% of them. Of the internal appeals people did file, insurers overturned roughly a third — and independent external reviews overturn anywhere from about 30% to 78% of cases. About 69% of people with a denied claim don't know they can appeal.",
    appealRate: "Fewer than 1% of in-network denials are appealed.",
    overturn: "~1 in 3 internal appeals overturned; external review overturns ~30–78%.",
    sources: [KFF_2024, KFF_AWARE, CMS_EXT],
  },
  erisa: {
    headline: "Few people appeal job-based-plan denials — and many appeals succeed.",
    detail:
      "Most denials on private/job-based plans are never appealed. When patients do appeal, a meaningful share are overturned at internal appeal, and independent external review overturns roughly 30–78% of the cases that reach it. Appealing is free and your right.",
    appealRate: "Most denials are never appealed.",
    overturn: "Internal appeals succeed often; external review overturns ~30–78%.",
    sources: [KFF_2024, CMS_EXT],
  },
  "medicare-advantage": {
    headline: "Medicare Advantage plans overturn most prior-authorization denials they're forced to re-review — so appeal.",
    detail:
      "A federal watchdog (HHS-OIG) found Medicare Advantage plans overturned about 75% of their own prior-authorization denials on appeal, and roughly 95% of appealed skilled-nursing-facility denials — strong evidence many initial denials shouldn't have happened. Yet only a small fraction are ever appealed.",
    appealRate: "Only a small fraction of MA denials are appealed.",
    overturn: "~75% of prior-auth denials (and ~95% of SNF denials) overturned on appeal.",
    sources: [OIG_MA_2018, OIG_MA_SNF_2026],
  },
  "medicare-part-d": {
    headline: "Drug denials are frequently reversed with a doctor's supporting statement — so request an exception and appeal.",
    detail:
      "Part D coverage and exception decisions are often reversed once a prescriber explains the medical need. Appeals move fast (as quick as 24–72 hours when urgent), and few people pursue them.",
    appealRate: "Few drug denials are appealed.",
    overturn: "Exceptions and appeals are frequently granted with prescriber support.",
    sources: [MEDICARE_APPEALS],
  },
  "original-medicare": {
    headline: "Medicare appeals are often successful at the first levels — and they're free.",
    detail:
      "Many Original Medicare denials are overturned at redetermination or reconsideration. There's no minimum dollar amount for the first two levels, so it costs nothing to try.",
    appealRate: "Most beneficiaries don't appeal.",
    overturn: "Frequently overturned at the first appeal levels.",
    sources: [MEDICARE_APPEALS],
  },
  "medicaid-managed-care": {
    headline: "Some Medicaid plans deny at high rates with little oversight — your appeal and fair hearing are the safeguard.",
    detail:
      "A federal watchdog (HHS-OIG) found some Medicaid managed care plans denied about 1 in 8 prior-authorization requests, with limited state oversight. You can appeal to the plan and then request a State Fair Hearing — and keep your benefits during the appeal if you ask in time.",
    appealRate: "Few enrollees appeal.",
    overturn: "Appeals + fair hearings are an effective safeguard; ask to keep benefits during the appeal.",
    sources: [OIG_MEDICAID_2023],
  },
  "medicaid-ffs": {
    headline: "You can request a State Fair Hearing — and keep your benefits during it if you ask in time.",
    detail:
      "Medicaid denials can be challenged at a State Fair Hearing. If you request it within the deadline on your notice, your benefits can continue while the hearing is pending.",
    appealRate: "Few enrollees appeal.",
    overturn: "Fair hearings are an effective safeguard.",
    sources: [OIG_MEDICAID_2023],
  },
};

/** Get the outcome stats for an appeal framework, falling back to a general nudge. */
export function statsForFramework(framework) {
  return OUTCOME_STATS[framework] || GENERAL_STATS;
}
