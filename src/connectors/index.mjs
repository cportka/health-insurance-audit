// connectors/index.mjs — the connector registry and interface.
//
// A "connector" is a way to GET a patient's coverage documents (EOBs, claims, denial letters,
// plan documents) into the tool. v0.1 ships only the `manual` connector (the patient uploads or
// types in what they have). Everything else is declared here as a `planned` connector with its
// auth model, coverage, legal posture, and target roadmap gate — this registry IS the connector
// strategy, kept next to the code that will implement it.
//
// Connector interface (duck-typed):
//   id            string
//   name          string
//   type          "manual" | "fhir-patient-access" | "fhir-blue-button" | "aggregator" | "portal"
//   status        "available" | "planned"
//   capabilities  string[]  (e.g. ["eob", "claims", "coverage"])
//   authModel     string    how the patient authorizes data access
//   coverage      string    which plans/carriers it reaches
//   legalPosture  string    consent / ToS / regulatory basis
//   gate          string    roadmap gate that delivers it
//   connect(opts) async ->  session handle (manual: no-op)
//   fetchDocuments(session) async -> { documents: [...] }

export const CONNECTORS = [
  {
    id: "manual",
    name: "Manual upload / entry",
    type: "manual",
    status: "available",
    capabilities: ["eob", "claims", "denial-letter", "bill", "plan-document"],
    authModel: "None — the patient provides their own documents; nothing leaves the device.",
    coverage: "All plans and carriers (the patient supplies the documents).",
    legalPosture: "The patient handles their own PHI; no third-party access.",
    gate: "0 (shipped)",
    async connect() {
      return { id: "manual", connectedAt: new Date().toISOString() };
    },
    async fetchDocuments(_session, input = {}) {
      // Manual connector just echoes back the normalized documents the caller already has.
      return {
        documents: Array.isArray(input.documents) ? input.documents : [],
        note: "Manual connector: provide documents via input.documents (claims/EOBs you already have).",
      };
    },
  },
  {
    id: "blue-button-2",
    name: "Medicare Blue Button 2.0",
    type: "fhir-blue-button",
    status: "planned",
    capabilities: ["claims", "coverage"],
    authModel: "OAuth2 with the patient's Medicare.gov account; FHIR R4 ExplanationOfBenefit.",
    coverage: "~60M people with Original Medicare (Parts A/B/D claims).",
    legalPosture: "Patient-authorized via CMS's official API; explicit OAuth consent.",
    gate: "3 (carrier connectors — pilot)",
  },
  {
    id: "carin-patient-access",
    name: "Payer Patient Access API (CMS Interoperability rule / CARIN Blue Button)",
    type: "fhir-patient-access",
    status: "planned",
    capabilities: ["eob", "claims", "coverage"],
    authModel: "SMART-on-FHIR / OAuth2 against each payer's patient-authorized FHIR endpoint.",
    coverage:
      "Payers regulated by CMS-9115-F must expose a Patient Access API: Medicare Advantage, Medicaid/CHIP managed care, and ACA exchange (QHP) issuers. Commercial ERISA plans are NOT mandated, a key coverage gap.",
    legalPosture: "Federally mandated patient access (45 CFR/CMS rule); per-payer app registration + patient OAuth.",
    gate: "3 (carrier connectors — pilot)",
  },
  {
    id: "aggregator",
    name: "Health-data aggregator (e.g. Flexpa / 1upHealth / Fasten / Particle)",
    type: "aggregator",
    status: "planned",
    capabilities: ["eob", "claims", "coverage"],
    authModel: "Patient OAuth brokered by the aggregator's SDK across many payer FHIR endpoints.",
    coverage:
      "Broad but uneven; aggregators normalize CARIN Blue Button across payers that expose Patient Access APIs. Commercial/self-funded coverage remains limited.",
    legalPosture: "Patient consent via the aggregator; subject to the aggregator's BAA and terms.",
    gate: "3 (carrier connectors — pilot)",
  },
  {
    id: "carrier-portal",
    name: "Carrier member-portal connector",
    type: "portal",
    status: "planned",
    capabilities: ["eob", "claims", "denial-letter", "plan-document"],
    authModel:
      "Patient-supplied credentials or OAuth where offered. Automated scraping raises ToS/CFAA and security concerns — preferred only where a sanctioned API or patient-delegated access is unavailable.",
    coverage: "Potentially any carrier with a member portal, but fragile and legally sensitive.",
    legalPosture:
      "Highest risk: review each carrier's Terms of Service; prefer official APIs / patient-delegated access; never store credentials server-side without explicit, revocable consent.",
    gate: "4 (broaden coverage — only where APIs don't reach)",
  },
];

const BY_ID = new Map(CONNECTORS.map((c) => [c.id, c]));

/** List connectors, optionally filtered by status ("available" | "planned"). */
export function listConnectors(status) {
  return (status ? CONNECTORS.filter((c) => c.status === status) : CONNECTORS).map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    status: c.status,
    capabilities: c.capabilities,
    coverage: c.coverage,
    gate: c.gate,
  }));
}

/** Get a connector by id (throws if it has no runnable implementation yet). */
export function getConnector(id) {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`Unknown connector "${id}". Known: ${[...BY_ID.keys()].join(", ")}`);
  if (c.status !== "available" || typeof c.connect !== "function") {
    throw new Error(`Connector "${id}" is planned, not yet available. See docs/CONNECTORS.md.`);
  }
  return c;
}
