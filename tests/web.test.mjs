// web.test.mjs — guard the static front end without a browser:
//   1. the published files exist and are wired together;
//   2. the exact public API the browser imports from ../src/index.mjs still exists and works.
// (Full click-through is verified separately with a headless browser; this keeps CI dependency-free.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import * as lib from "../src/index.mjs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");

test("GitHub Pages files exist", () => {
  for (const f of ["index.html", "web/app.js", "web/styles.css", ".nojekyll"]) {
    assert.ok(existsSync(new URL(f, root)), `missing ${f}`);
  }
});

test("index.html wires the app, styles, disclaimer, and the intent-first home", () => {
  const html = read("index.html");
  assert.match(html, /<script type="module" src="\.\/web\/app\.js">/);
  assert.match(html, /href="\.\/web\/styles\.css"/);
  assert.match(html, /not legal or medical advice/i);
  assert.equal((html.match(/role="tab"/g) || []).length, 6, "expected 6 tabs (home + 5 console)");
  assert.match(html, /id="intent-cards"/, "intent-first home present");
  assert.match(html, /★ Start here/);
  // privacy promise must be visible
  assert.match(html, /nothing is uploaded|runs entirely in your browser/i);
});

test("app.js imports the library by relative path (browser-resolvable)", () => {
  const js = read("web/app.js");
  assert.match(js, /from "\.\.\/src\/index\.mjs"/);
});

test("every symbol app.js imports is actually exported and callable", () => {
  // Keep this list in sync with the import in web/app.js.
  const imported = [
    "allPlanTypes",
    "guessPlanType",
    "getPlanType",
    "buildPathway",
    "DENIAL_TYPES",
    "listLetterTypes",
    "generateLetter",
    "auditClaim",
    "listScenarios",
    "buildChecklist",
    "buildActionPlan",
    "INTENTS",
    "DISCLAIMER",
  ];
  for (const name of imported) {
    assert.ok(name in lib, `web/app.js imports ${name} but src/index.mjs does not export it`);
  }
  // exercise the data flow the UI relies on
  assert.ok(lib.allPlanTypes().length > 0);
  assert.ok(Array.isArray(lib.DENIAL_TYPES) && lib.DENIAL_TYPES.includes("termination"));
  assert.ok(lib.buildPathway({ planTypeId: "medicare-advantage" }).outcomeOdds.headline);
  assert.ok(lib.generateLetter({ type: "internal-appeal", context: {} }).body);
  assert.ok(lib.buildChecklist({ scenario: "surprise-bill" }).items.length > 0);
  assert.ok(lib.INTENTS.length >= 2);
  assert.ok(lib.buildActionPlan({ intent: "overturn-denial", planTypeId: "aca-individual" }).actions.length > 0);
  assert.equal(typeof lib.DISCLAIMER, "string");
});
