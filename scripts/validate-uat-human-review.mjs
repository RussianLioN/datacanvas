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

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const flowPath = "docs/product/ux/human-review-flow.json";
const uatManifestPath = "docs/product/ux/uat-manifest.json";
const flow = readJson(flowPath);
const uat = readJson(uatManifestPath);

for (const { schemaPath, data, label } of [
  {
    schemaPath: "schemas/human-review-flow.schema.json",
    data: flow,
    label: "human review flow",
  },
  {
    schemaPath: "schemas/uat-manifest.schema.json",
    data: uat,
    label: "UAT manifest",
  },
]) {
  const validate = ajv.compile(readJson(schemaPath));
  if (!validate(data)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${label} does not match schema`);
  }
}

for (const relativePath of [
  "docs/product/ux/human-review-flow.md",
  flowPath,
  uat.script_path,
  uatManifestPath,
  "tests/golden/claim-map-minimal.json",
  "tests/golden/trace-manifest-minimal.json",
  "artifacts/examples/presentation-minimal.html",
]) {
  requireFile(relativePath);
}

const requiredRoles = new Set(["author", "reviewer", "approver", "observer"]);
for (const role of requiredRoles) {
  if (!flow.roles.includes(role)) {
    fail(`human review flow is missing role: ${role}`);
  }
}

const requiredStates = new Set(["draft", "in_review", "changes_requested", "approved", "rejected"]);
for (const state of requiredStates) {
  if (!flow.states.includes(state)) {
    fail(`human review flow is missing state: ${state}`);
  }
}

const requiredActions = new Set(["edit", "comment", "regenerate", "submit_for_review", "record_decision", "export"]);
for (const action of requiredActions) {
  if (!flow.actions.includes(action)) {
    fail(`human review flow is missing action: ${action}`);
  }
}

if (!flow.transitions.some((transition) => transition.from === "approved" && transition.action === "export")) {
  fail("human review flow must allow export only from approved state");
}

if (flow.transitions.some((transition) => transition.action === "export" && transition.from !== "approved")) {
  fail("human review flow must not allow export before approved state");
}

const uatScript = readText(uat.script_path);
for (const scenarioId of uat.scenario_ids) {
  if (!uatScript.includes(scenarioId)) {
    fail(`UAT script is missing scenario: ${scenarioId}`);
  }
}

if (uat.gate_id !== "G9") {
  fail("UAT manifest must target G9 MVP Accepted");
}

if (uat.acceptance_thresholds.critical_failures !== 0 || uat.acceptance_thresholds.unsupported_claims !== 0) {
  fail("UAT thresholds must block critical failures and unsupported claims");
}

console.log("UAT human review validation passed");
