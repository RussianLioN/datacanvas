import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const manifestPath = "docs/process/audits/external-evidence-readiness.json";

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function sorted(values) {
  return [...values].sort();
}

function sameSet(left, right) {
  return JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
}

function isPathLike(value) {
  return value.includes("/") || value.endsWith(".json") || value.endsWith(".md");
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const manifest = readJson(manifestPath);
const schema = readJson("schemas/external-evidence-readiness.schema.json");
const validate = ajv.compile(schema);
if (!validate(manifest)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("external evidence readiness manifest does not match schema");
}

if (!exists("docs/process/audits/external-evidence-readiness.md")) {
  fail("external evidence readiness dashboard is missing");
}

const audit = readJson(manifest.source_audit_path);
const closureMap = readJson(manifest.source_closure_map_path);
const readinessBlockers = manifest.blockers.map((blocker) => blocker.blocking_evidence);
const auditBlockers = audit.blocking_external_evidence;
const closureBlockers = closureMap.blockers.map((blocker) => blocker.blocking_evidence);

if (!sameSet(readinessBlockers, auditBlockers)) {
  fail("readiness blockers do not match completion audit blockers");
}
if (!sameSet(readinessBlockers, closureBlockers)) {
  fail("readiness blockers do not match closure map blockers");
}

for (const blocker of manifest.blockers) {
  const closure = closureMap.blockers.find((item) => item.blocking_evidence === blocker.blocking_evidence);
  if (!closure) {
    fail(`closure map is missing blocker: ${blocker.blocking_evidence}`);
  }
  if (closure.owner_role !== blocker.owner_role) {
    fail(`owner role mismatch for blocker: ${blocker.blocking_evidence}`);
  }
  if (closure.status !== "pending_external") {
    fail(`closure map must keep pending_external for blocker: ${blocker.blocking_evidence}`);
  }
  if (blocker.required_before_completion !== true) {
    fail(`blocker must be required before completion: ${blocker.blocking_evidence}`);
  }
  if (isPathLike(blocker.blocking_evidence) && exists(blocker.blocking_evidence)) {
    fail(`path-like blocker exists while readiness says missing_pending_external: ${blocker.blocking_evidence}`);
  }
  for (const supportPath of blocker.supporting_artifacts) {
    if (!exists(supportPath)) {
      fail(`supporting artifact is missing for blocker ${blocker.blocking_evidence}: ${supportPath}`);
    }
  }
  if (!blocker.supporting_artifacts.includes("scripts/record-pilot-evidence.mjs")) {
    fail(`blocker must reference pilot evidence recorder: ${blocker.blocking_evidence}`);
  }
  if (!blocker.dry_run_commands.some((command) => command.includes("npm run pilot:record -- --dry-run"))) {
    fail(`blocker must include pilot evidence recorder dry-run command: ${blocker.blocking_evidence}`);
  }
  if (!blocker.write_commands.some((command) => command.includes("npm run pilot:record --"))) {
    fail(`blocker must include pilot evidence recorder write command: ${blocker.blocking_evidence}`);
  }
}

for (const command of [
  "npm run validate:external-evidence-readiness",
  "npm run validate:external-blocker-closure-map",
  "npm run validate:plan-completion-audit",
  "npm test",
]) {
  if (!manifest.validation_commands.includes(command)) {
    fail(`external evidence readiness is missing validation command: ${command}`);
  }
}

const dashboard = readText("docs/process/audits/external-evidence-readiness.md");
for (const requiredText of ["missing pending external", "Stop Rules", "pilot report", "commit-sha-and-pr-evidence", "npm run pilot:record", "docs/release/commit-pr-evidence.md"]) {
  if (!dashboard.includes(requiredText)) {
    fail(`external evidence readiness dashboard is missing text: ${requiredText}`);
  }
}

console.log("external evidence readiness validation passed");
