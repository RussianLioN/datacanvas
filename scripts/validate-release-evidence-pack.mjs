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

function requireFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    fail(`required file does not exist: ${relativePath}`);
  }
}

const packPath = "docs/release/mvp-release-evidence-pack.json";
const pack = readJson(packPath);
const schema = readJson("schemas/release-evidence-pack.schema.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validatePack = ajv.compile(schema);
if (!validatePack(pack)) {
  console.error(JSON.stringify(validatePack.errors, null, 2));
  fail("release evidence pack does not match schema");
}

for (const evidencePath of pack.evidence_paths) {
  requireFile(evidencePath);
}

requireFile(pack.artifact_registry_snapshot.path);
requireFile(pack.artifact_registry_snapshot.hash_manifest_path);

const uatResult = readJson(pack.acceptance_decision.source);
if (uatResult.review_state !== "approved" || uatResult.decision !== "accepted") {
  fail("release pack acceptance source must be approved and accepted");
}

if (uatResult.metrics.critical_failures !== 0 || uatResult.metrics.unsupported_claims !== 0 || uatResult.metrics.export_blockers !== 0) {
  fail("release pack acceptance source must have zero blocking UAT metrics");
}

const requiredCommands = new Set([
  "npm test",
  "npm run validate:uat-result",
  "npm run validate:export-smoke",
  "npm run validate:artifact-hashes",
  "npm run validate:review-runtime-interactive",
  "npm run validate:real-uat-operator-handoff",
  "npm run validate:real-uat-session-importer",
  "npm run validate:renderer-regression",
  "npm run validate:data-leakage",
  "npm run validate:process-metrics-snapshot",
  "npm run scan:secrets",
]);

const actualCommands = new Set(pack.ci_evidence.map((item) => item.command));
for (const command of requiredCommands) {
  if (!actualCommands.has(command)) {
    fail(`release pack is missing CI evidence command: ${command}`);
  }
}

if (pack.known_risks.length < 3) {
  fail("release pack must document at least three known risks for this candidate");
}

const requiredEvidencePaths = new Set([
  "artifacts/examples/review-runtime-interactive.html",
  "docs/product/ux/review-runtime-interactive.json",
  "docs/product/ux/real-uat-runtime-import.json",
  "docs/product/ux/real-uat-operator-handoff.json",
  "docs/product/ux/real-uat-session-importer.json",
  "artifacts/examples/renderer-regression-manifest.json",
  "docs/architecture/security/data-leakage-manifest.json",
  "docs/architecture/security/real-uat-leakage-guard.json",
  "docs/process/current/process-metrics-snapshot.json",
]);

const actualEvidencePaths = new Set(pack.evidence_paths);
for (const evidencePath of requiredEvidencePaths) {
  if (!actualEvidencePaths.has(evidencePath)) {
    fail(`release pack is missing current-gate evidence path: ${evidencePath}`);
  }
}

const staleRiskIds = new Set(["no-interactive-review-ui"]);
for (const risk of pack.known_risks) {
  if (staleRiskIds.has(risk.risk_id)) {
    fail(`release pack contains stale risk id: ${risk.risk_id}`);
  }
}

console.log("release evidence pack validation passed");
