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

const schema = readJson("schemas/real-uat-operator-handoff.schema.json");
const handoff = readJson("docs/product/ux/real-uat-operator-handoff.json");
const validate = ajv.compile(schema);

if (!validate(handoff)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("real UAT operator handoff does not match schema");
}

requireFile("docs/product/ux/real-uat-operator-handoff.md");

for (const check of handoff.preflight_checks) {
  requireFile(check.evidence_path);
  if (!check.blocking) {
    fail(`preflight check must be blocking before real UAT: ${check.id}`);
  }
}

const requiredCommands = [
  "npm run validate:real-uat-operator-handoff",
  "npm run validate:review-runtime-interactive",
  "npm run validate:real-uat-readiness",
  "npm run validate:real-uat-import -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run",
  "npm run prepare:real-uat-session -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run",
  "npm test",
];

for (const command of requiredCommands) {
  if (!handoff.validation_commands.includes(command)) {
    fail(`handoff is missing validation command: ${command}`);
  }
}

const stepText = handoff.session_steps.map((step) => `${step.action} ${step.expected_evidence}`).join("\n");
for (const requiredAction of ["submit_for_review", "comment", "record_decision", "export"]) {
  if (!stepText.includes(requiredAction)) {
    fail(`handoff session steps must mention required action: ${requiredAction}`);
  }
}

const outputPaths = new Set(handoff.required_outputs.map((output) => output.path));
for (const requiredOutput of [
  "artifacts/manual/real-uat/review-runtime-state-export.json",
  "docs/product/ux/human-review-session-real.json",
  "docs/release/mvp-release-evidence-pack.json",
]) {
  if (!outputPaths.has(requiredOutput)) {
    fail(`handoff is missing required output: ${requiredOutput}`);
  }
}

const guide = readText("docs/product/ux/real-uat-operator-handoff.md");
for (const requiredText of ["Preflight", "Stop Conditions", "validate:real-uat-import -- --input", "--dry-run", "human-review-session-real.json"]) {
  if (!guide.includes(requiredText)) {
    fail(`operator guide is missing required text: ${requiredText}`);
  }
}

const realSessionPath = "docs/product/ux/human-review-session-real.json";
if (fs.existsSync(path.join(root, realSessionPath))) {
  const realSessionText = readText(realSessionPath);
  const realSession = JSON.parse(realSessionText);
  const unsafeActorPattern = /fixture|template|sample|placeholder|interactive-|TO_BE_FILLED/i;
  if (realSessionText.includes("TO_BE_FILLED")) {
    fail("existing real UAT session must not contain TO_BE_FILLED placeholders");
  }
  for (const actorId of [realSession.actor?.actor_id, ...(realSession.audit_events || []).map((event) => event.actor_id)].filter(Boolean)) {
    if (unsafeActorPattern.test(actorId)) {
      fail(`existing real UAT session contains unsafe actor_id marker: ${actorId}`);
    }
  }
}

console.log("real UAT operator handoff validation passed");
