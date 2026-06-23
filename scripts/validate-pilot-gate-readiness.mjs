import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function requireFile(relativePath) {
  if (!fileExists(relativePath)) {
    fail(`required file does not exist: ${relativePath}`);
  }
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const schema = readJson("schemas/pilot-gate-readiness.schema.json");
const manifest = readJson("docs/release/pilot-gate-readiness.json");
const validate = ajv.compile(schema);
if (!validate(manifest)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("pilot gate readiness manifest does not match schema");
}

if (!["blocked_pending_external", "accepted"].includes(manifest.status)) {
  fail("pilot gate readiness status must be blocked_pending_external or accepted");
}

const evidenceById = new Map(manifest.required_evidence.map((item) => [item.id, item]));
for (const requiredId of ["PGR-001", "PGR-002", "PGR-003", "PGR-004", "PGR-005", "PGR-006", "PGR-007", "PGR-008"]) {
  if (!evidenceById.has(requiredId)) {
    fail(`pilot gate readiness is missing evidence item: ${requiredId}`);
  }
}

for (const item of manifest.required_evidence) {
  if (item.status === "available") {
    requireFile(item.path);
  }
}

const realSessionPath = evidenceById.get("PGR-002").path;
const runtimeExportPath = evidenceById.get("PGR-003").path;
if (manifest.status === "blocked_pending_external") {
  for (const pendingPath of ["docs/release/pilot-report.md", "docs/release/pilot-process-portability-notes.md"]) {
    if (fileExists(pendingPath)) {
      fail(`pilot gate readiness still marks external evidence pending, but file exists: ${pendingPath}`);
    }
  }
}

const releasePack = readJson("docs/release/mvp-release-evidence-pack.json");
if (manifest.status === "blocked_pending_external" && releasePack.commit_sha.status !== "pending_until_commit") {
  fail("blocked pilot gate expects release pack commit SHA to remain pending");
}
if (manifest.status === "accepted" && releasePack.commit_sha.status !== "captured") {
  fail("accepted pilot gate expects release pack commit SHA to be captured");
}
if (!releasePack.known_risks.some((risk) => risk.risk_id === "not-real-user-uat" && risk.status === "closed_by_real_uat")) {
  fail("release pack must mark not-real-user-uat risk closed by real UAT");
}

for (const command of ["npm test", "npm run validate:release-pack", "npm run validate:real-uat-import", "npm run validate:data-leakage", "npm run validate:pilot-execution-handoff"]) {
  if (!manifest.validation_commands.includes(command)) {
    fail(`pilot gate readiness is missing validation command: ${command}`);
  }
}

const pilotHandoff = readJson("docs/release/pilot-execution-handoff.json");
if (pilotHandoff.status !== "ready_for_pilot_run_after_real_uat") {
  fail("pilot execution handoff must keep runbook status");
}

const leakageManifest = readJson("docs/architecture/security/data-leakage-manifest.json");
const leakageTargets = new Set(leakageManifest.scan_targets.map((target) => target.path));
for (const realUatPath of [realSessionPath, runtimeExportPath]) {
  if (!leakageTargets.has(realUatPath)) {
    fail(`real UAT artifact is missing from data leakage targets: ${realUatPath}`);
  }
}

if (manifest.status === "accepted") {
  for (const acceptedPath of [
    "docs/release/pilot-report.md",
    "docs/release/pilot-process-portability-notes.md",
    "docs/release/commit-pr-evidence.md",
  ]) {
    requireFile(acceptedPath);
  }
  if (manifest.blocking_conditions.length !== 0) {
    fail("accepted pilot gate must not list blocking conditions");
  }
}

console.log("pilot gate readiness validation passed");
