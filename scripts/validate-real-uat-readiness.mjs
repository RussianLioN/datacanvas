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
const schemaCache = new Map();

function validateWithSchema(schemaPath, dataPath) {
  const data = readJson(dataPath);
  let validate = schemaCache.get(schemaPath);
  if (!validate) {
    validate = ajv.compile(readJson(schemaPath));
    schemaCache.set(schemaPath, validate);
  }
  if (!validate(data)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${dataPath} does not match ${schemaPath}`);
  }
  return data;
}

const readiness = validateWithSchema(
  "schemas/real-uat-gate-readiness.schema.json",
  "docs/product/ux/real-uat-gate-readiness.json",
);
const template = validateWithSchema("schemas/human-review-session.schema.json", readiness.session_template_path);

for (const inputPath of readiness.required_inputs) {
  requireFile(inputPath);
}

if (template.status !== "template" || template.session_kind !== "real_user") {
  fail("real UAT template must be status=template and session_kind=real_user");
}

const templateText = readText(readiness.session_template_path);
if (!templateText.includes("TO_BE_FILLED")) {
  fail("real UAT template must retain TO_BE_FILLED placeholders until an actual session is recorded");
}

const requiredActions = new Set(["submit_for_review", "comment", "record_decision", "export"]);
const templateActions = new Set(template.audit_events.map((event) => event.action));
for (const action of requiredActions) {
  if (!templateActions.has(action)) {
    fail(`real UAT template is missing action: ${action}`);
  }
}

const realSessionPath = "docs/product/ux/human-review-session-real.json";
if (fs.existsSync(path.join(root, realSessionPath))) {
  const realSession = validateWithSchema("schemas/human-review-session.schema.json", realSessionPath);
  const realSessionText = readText(realSessionPath);
  const unsafeActorPattern = /fixture|template|sample|placeholder|interactive-|TO_BE_FILLED/i;
  if (realSession.status !== "recorded_real_user" || realSession.session_kind !== "real_user") {
    fail("real UAT session must be status=recorded_real_user and session_kind=real_user");
  }
  if (realSessionText.includes("TO_BE_FILLED") || unsafeActorPattern.test(realSession.actor.actor_id)) {
    fail("real UAT session must not contain placeholders or unsafe actor IDs");
  }
  for (const event of realSession.audit_events) {
    if (unsafeActorPattern.test(event.actor_id)) {
      fail(`real UAT session contains unsafe actor_id marker: ${event.actor_id}`);
    }
  }
  if (realSession.review_state !== "approved" || realSession.decision !== "accepted") {
    fail("real UAT session must be approved and accepted for G9 acceptance");
  }
}

console.log("real UAT readiness validation passed");
