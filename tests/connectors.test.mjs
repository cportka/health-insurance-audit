import { test } from "node:test";
import assert from "node:assert/strict";
import { listConnectors, getConnector } from "../src/connectors/index.mjs";

test("manual connector is available, others are planned", () => {
  const all = listConnectors();
  assert.ok(all.find((c) => c.id === "manual" && c.status === "available"));
  assert.ok(all.some((c) => c.status === "planned"));
});

test("getConnector returns the runnable manual connector", async () => {
  const c = getConnector("manual");
  const session = await c.connect();
  const res = await c.fetchDocuments(session, { documents: [{ type: "eob" }] });
  assert.equal(res.documents.length, 1);
});

test("planned connectors throw until implemented", () => {
  assert.throws(() => getConnector("carin-patient-access"), /planned, not yet available/);
});

test("unknown connector throws", () => {
  assert.throws(() => getConnector("nope"), /Unknown connector/);
});

test("planned connectors document an auth model and a roadmap gate", () => {
  const planned = listConnectors("planned");
  assert.ok(planned.length >= 3);
  assert.ok(planned.every((c) => c.gate));
});
