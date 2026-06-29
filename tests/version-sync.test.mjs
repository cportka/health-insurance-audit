// version-sync.test.mjs — assert package.json's version is valid SemVer and documented in
// CHANGELOG.md (and the README **Version:** line, if present). Portka standard.
// Run with `node --test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const version = JSON.parse(readFileSync(new URL("package.json", root))).version;

test("version is valid SemVer", () => {
  assert.match(version, /^\d+\.\d+\.\d+([-+][0-9A-Za-z.]+)?$/);
});

test("CHANGELOG.md documents the current version", () => {
  const log = readFileSync(new URL("CHANGELOG.md", root), "utf8");
  assert.ok(log.includes(version), `CHANGELOG.md has no entry for ${version}`);
});

test("README **Version:** line matches package.json (if present)", () => {
  const readme = readFileSync(new URL("README.md", root), "utf8");
  if (readme.includes("**Version:**")) {
    assert.ok(
      readme.includes(`**Version:** ${version}`),
      `README **Version:** line disagrees with package.json (${version})`,
    );
  }
});
