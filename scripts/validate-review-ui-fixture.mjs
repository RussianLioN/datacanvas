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

function validateWithSchema(schemaPath, dataPath) {
  const schema = readJson(schemaPath);
  const data = readJson(dataPath);
  const validate = ajv.compile(schema);
  if (!validate(data)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${dataPath} does not match ${schemaPath}`);
  }
  return data;
}

const fixturePath = "docs/product/ux/review-ui-fixture.json";
const sessionPath = "docs/product/ux/human-review-session-minimal.json";
const fixture = validateWithSchema("schemas/review-ui-fixture.schema.json", fixturePath);
const session = validateWithSchema("schemas/human-review-session.schema.json", sessionPath);
const flow = readJson(session.review_flow_path);
const uatResult = readJson(session.uat_result_path);

for (const artifactPath of [...fixture.source_artifacts, ...session.evidence_paths]) {
  requireFile(artifactPath);
}
requireFile(fixture.html_path);

if (fixture.session_artifact_path !== sessionPath) {
  fail("review UI fixture must point to the minimal human review session artifact");
}

if (session.review_state !== "approved" || session.decision !== "accepted") {
  fail("human review session fixture must be approved and accepted");
}

if (uatResult.review_state !== "approved" || uatResult.decision !== "accepted") {
  fail("UAT result must remain approved and accepted");
}

const flowActions = new Set(flow.actions);
for (const control of fixture.required_controls) {
  if (!flowActions.has(control)) {
    fail(`review UI control is not allowed by human review flow: ${control}`);
  }
}

const auditFields = new Set(flow.audit_fields);
for (const event of session.audit_events) {
  for (const field of auditFields) {
    if (!(field in event)) {
      fail(`audit event is missing required field: ${field}`);
    }
  }
}

const html = readText(fixture.html_path);
if (!html.startsWith("<!doctype html>")) {
  fail("review UI HTML must start with <!doctype html>");
}
if (!html.includes('<meta name="viewport" content="width=device-width, initial-scale=1">')) {
  fail("review UI HTML must include responsive viewport meta");
}
for (const control of fixture.required_controls) {
  if (!html.includes(`data-action="${control}"`)) {
    fail(`review UI HTML is missing control: ${control}`);
  }
}
for (const section of fixture.required_sections) {
  if (!html.includes(`id="${section}"`)) {
    fail(`review UI HTML is missing section: ${section}`);
  }
}

const forbiddenPatterns = [/<script\b/i, /display\s*:\s*none/i, /visibility\s*:\s*hidden/i, /<!--/];
for (const pattern of forbiddenPatterns) {
  if (pattern.test(html)) {
    fail(`review UI HTML contains forbidden pattern: ${pattern}`);
  }
}

console.log("review UI fixture validation passed");
