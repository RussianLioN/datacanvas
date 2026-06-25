import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";

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

const manifestPath = "docs/architecture/security/threat-model-delta-manifest.json";
const manifest = readJson(manifestPath);
const schema = readJson("schemas/threat-model-delta-manifest.schema.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile(schema);

if (!validate(manifest)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("threat model delta manifest does not match schema");
}

requireFile(manifest.source_plan);
requireFile(manifest.baseline_threat_model_path);

const sprintRoot = path.join(root, "docs/sprints");
const sprintDirs = fs
  .readdirSync(sprintRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `docs/sprints/${entry.name}`)
  .sort();

const coverageByPath = new Map();
for (const item of manifest.coverage) {
  if (coverageByPath.has(item.sprint_path)) {
    fail(`duplicate threat-model delta coverage entry: ${item.sprint_path}`);
  }
  coverageByPath.set(item.sprint_path, item);
  requireFile(item.sprint_path);
  for (const evidencePath of item.evidence_paths) {
    requireFile(evidencePath);
  }
  if (item.delta_status === "delta_recorded" && item.security_impact === "none") {
    fail(`delta_recorded cannot have none security impact: ${item.sprint_path}`);
  }
  if (item.delta_status === "requires_review" && item.security_impact !== "high") {
    fail(`requires_review must have high security impact: ${item.sprint_path}`);
  }
}

for (const sprintPath of sprintDirs) {
  if (!coverageByPath.has(sprintPath)) {
    fail(`sprint is missing threat-model delta coverage entry: ${sprintPath}`);
  }
}

for (const sprintPath of coverageByPath.keys()) {
  if (!sprintDirs.includes(sprintPath)) {
    fail(`threat-model delta coverage references missing sprint folder: ${sprintPath}`);
  }
}

const explicitDelta = manifest.coverage.find((item) =>
  item.evidence_paths.includes("docs/sprints/2026-W26-security-foundation-pack/threat-model-delta.md")
);
if (!explicitDelta) {
  fail("manifest must include the explicit S21 threat-model-delta.md evidence");
}

if (!manifest.coverage.some((item) => item.sprint_id === "SPRINT-2026-W26-S35" && item.delta_status === "delta_recorded")) {
  fail("manifest must include S35 as a recorded governance delta");
}

console.log("threat model delta validation passed");
