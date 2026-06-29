#!/usr/bin/env node
// hia — Health Insurance Audit & Grievance Filer CLI.
//
// Offline, dependency-free. Subcommands: plans, navigate, letters, letter, audit, scenarios,
// intake, connectors, version, help. Use --json on most commands for machine-readable output.
import { readFileSync } from "node:fs";
import {
  allPlanTypes,
  guessPlanType,
  buildPathway,
  listLetterTypes,
  generateLetter,
  auditClaim,
  listScenarios,
  buildChecklist,
  listConnectors,
  SHORT_DISCLAIMER,
} from "../src/index.mjs";

const argv = process.argv.slice(2);
const cmd = argv[0];

// --- tiny flag parser: --key value, --key=value, --flag ---
function parseFlags(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq !== -1) {
        flags[a.slice(2, eq)] = a.slice(eq + 1);
      } else {
        const next = args[i + 1];
        if (next !== undefined && !next.startsWith("--")) {
          flags[a.slice(2)] = next;
          i++;
        } else {
          flags[a.slice(2)] = true;
        }
      }
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

const { flags, positional } = parseFlags(argv.slice(1));
const asJson = !!flags.json;

function out(obj, text) {
  if (asJson) {
    console.log(JSON.stringify(obj, null, 2));
  } else {
    console.log(text);
    console.log(`\n— ${SHORT_DISCLAIMER}`);
  }
}

function fail(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function readContext() {
  // --context file.json, or - for stdin, or --ctx key=value (repeatable via comma)
  let ctx = {};
  if (flags.context) {
    const raw = flags.context === "-" ? readFileSync(0, "utf8") : readFileSync(flags.context, "utf8");
    ctx = JSON.parse(raw);
  }
  if (flags.ctx) {
    const pairs = String(flags.ctx).split(",");
    for (const p of pairs) {
      const i = p.indexOf("=");
      if (i !== -1) ctx[p.slice(0, i).trim()] = p.slice(i + 1).trim();
    }
  }
  return ctx;
}

const HELP = `hia — Health Insurance Audit & Grievance Filer

Usage:
  hia plans                                  List supported plan types
  hia whatami "<description>"                Guess your plan type from a description
  hia navigate --plan <id> --denial <type> --date <YYYY-MM-DD>
                                             Show your appeal pathway and deadlines
  hia letters                                List letter templates
  hia letter <type> [--context file.json | --ctx k=v,k=v]
                                             Generate an appeal/grievance letter
  hia scenarios                              List document-intake scenarios
  hia intake --scenario <id> [--plan <id>]   Build a document checklist
  hia audit --file <claim.json>              Audit an EOB/bill for likely errors
  hia connectors                             List document connectors (manual + planned)
  hia version                                Print version
  hia help                                   This help

Denial types: pre-service, post-service, payment, urgent, termination, drug, grievance
Add --json to most commands for machine-readable output.

General information, not legal/medical advice.`;

switch (cmd) {
  case "plans": {
    const plans = allPlanTypes();
    out(
      plans,
      "Supported plan types:\n" +
        plans
          .map(
            (p) =>
              `  ${p.id.padEnd(22)} ${p.name}${p.weakerRights ? "  ⚠ weaker appeal rights" : ""}`,
          )
          .join("\n"),
    );
    break;
  }

  case "whatami": {
    const desc = positional.join(" ") || flags.text || "";
    if (!desc) fail('describe your plan, e.g. hia whatami "I got it through my job, big employer pays claims"');
    const guesses = guessPlanType(desc);
    out(
      guesses,
      guesses.length
        ? "Best guesses:\n" + guesses.slice(0, 5).map((g) => `  ${g.id.padEnd(22)} ${g.name}`).join("\n")
        : "No confident guess — run 'hia plans' to pick from the list.",
    );
    break;
  }

  case "navigate": {
    if (!flags.plan) fail("--plan <id> is required (see 'hia plans')");
    const result = buildPathway({
      planTypeId: flags.plan,
      denialType: flags.denial || "post-service",
      denialDate: flags.date,
    });
    const lines = [];
    lines.push(`Appeal pathway for: ${result.planType.name}`);
    lines.push(`Regulator: ${result.planType.regulator}`);
    if (result.outcomeOdds) lines.push(`\n💪 ${result.outcomeOdds.headline}\n   ${result.outcomeOdds.detail}`);
    if (result.nextAction) lines.push(`\n➡ Next: ${result.nextAction.step} — file by ${result.nextAction.fileBy} (decided by ${result.nextAction.decidedBy})`);
    lines.push("");
    for (const s of result.steps) {
      lines.push(`${s.order}. ${s.name}  [decided by ${s.decidedBy}]`);
      if (s.fileWithin) lines.push(`   File within: ${s.fileWithin} of ${s.fileFrom}${s.fileByDate ? ` (by ${s.fileByDate}${s.daysRemaining != null ? `, ${s.daysRemaining} days left` : ""})` : ""}`);
      if (s.decisionWithin) lines.push(`   Decision within: ${s.decisionWithin}`);
      if (s.expedited) lines.push(`   Expedited: ${s.expedited}`);
      if (s.amountInControversy) lines.push(`   Minimum amount in dispute: ${s.amountInControversy}`);
      if (s.authority) lines.push(`   Authority: ${s.authority}`);
    }
    if (result.warnings.length) lines.push("\n⚠ " + result.warnings.join("\n⚠ "));
    out(result, lines.join("\n"));
    break;
  }

  case "letters": {
    const types = listLetterTypes();
    out(types, "Letter templates:\n" + types.map((t) => `  ${t.id.padEnd(30)} ${t.label}`).join("\n"));
    break;
  }

  case "letter": {
    const type = positional[0] || flags.type;
    if (!type) fail("letter <type> is required (see 'hia letters')");
    const context = readContext();
    const result = generateLetter({ type, context });
    const text =
      `Subject: ${result.subject}\n\n${result.body}\n\n` +
      `--- Attach ---\n${result.attachments.map((a) => `  • ${a}`).join("\n")}\n\n` +
      `--- How to send ---\n${result.howToSend}` +
      (result.placeholders.length
        ? `\n\n--- Still to fill in ---\n  ${result.placeholders.join("\n  ")}`
        : "");
    out(result, text);
    break;
  }

  case "scenarios": {
    const s = listScenarios();
    out(s, "Intake scenarios:\n" + s.map((x) => `  ${x.id.padEnd(20)} ${x.label}`).join("\n"));
    break;
  }

  case "intake": {
    if (!flags.scenario) fail("--scenario <id> is required (see 'hia scenarios')");
    const result = buildChecklist({ scenario: flags.scenario, planTypeId: flags.plan });
    const lines = [`Document checklist — ${result.scenario.label}`];
    if (result.planType) lines.push(`Plan: ${result.planType.name}`);
    lines.push("\nRequired:");
    for (const it of result.items.filter((i) => i.required)) lines.push(`  ☐ ${it.name}\n      why: ${it.why}\n      get: ${it.howToGet}`);
    lines.push("\nHelpful:");
    for (const it of result.items.filter((i) => !i.required)) lines.push(`  ☐ ${it.name}`);
    if (result.notes.length) lines.push("\nNotes:\n  " + result.notes.join("\n  "));
    out(result, lines.join("\n"));
    break;
  }

  case "audit": {
    if (!flags.file && !flags.stdin) fail("--file <claim.json> is required (or --stdin)");
    const raw = flags.stdin ? readFileSync(0, "utf8") : readFileSync(flags.file, "utf8");
    let claim;
    try {
      claim = JSON.parse(raw);
    } catch (e) {
      fail(`could not parse claim JSON: ${e.message}`);
    }
    const result = auditClaim(claim);
    const lines = [
      `EOB/Bill audit — ${result.summary.total} finding(s), ${result.summary.rulesRun} checks run.`,
      result.summary.potentialPatientSavings
        ? `Potential amount to question: $${result.summary.potentialPatientSavings.toFixed(2)}`
        : "",
      "",
    ];
    for (const f of result.findings) {
      lines.push(`[${f.severity.toUpperCase()}] ${f.title}${f.line ? ` (line ${f.line})` : ""}`);
      lines.push(`   ${f.detail}`);
      lines.push(`   → ${f.suggestedAction}`);
    }
    if (!result.findings.length) lines.push("No issues detected by the current checks. Still review your EOB against the bill.");
    out(result, lines.filter(Boolean).join("\n"));
    break;
  }

  case "connectors": {
    const c = listConnectors();
    out(
      c,
      "Document connectors:\n" +
        c.map((x) => `  ${x.id.padEnd(22)} [${x.status}] ${x.name}\n      ${x.coverage}`).join("\n"),
    );
    break;
  }

  case "version": {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    console.log(pkg.version);
    break;
  }

  case "help":
  case undefined:
    console.log(HELP);
    break;

  default:
    console.error(`unknown command: ${cmd}\n`);
    console.log(HELP);
    process.exit(1);
}
