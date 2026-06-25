import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const manifestPath = "docs/product/ux/real-uat-preflight-checklist.json";

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

function requireFile(relativePath) {
  if (!exists(relativePath)) {
    fail(`required file does not exist: ${relativePath}`);
  }
}

function assertNoUnsafeExternalEvidence(label, value) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (text.includes("TO_BE_FILLED")) {
    fail(`${label} contains TO_BE_FILLED placeholder`);
  }
  const unsafeActorPattern = /fixture|template|sample|placeholder|interactive-|TO_BE_FILLED/i;
  let parsed = null;
  try {
    parsed = typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    parsed = null;
  }
  const actorIds = [
    parsed?.actor?.actor_id,
    ...(parsed?.transition_history || []).map((event) => event.actor_id),
    ...(parsed?.audit_events || []).map((event) => event.actor_id),
  ].filter(Boolean);
  for (const actorId of actorIds) {
    if (unsafeActorPattern.test(actorId)) {
      fail(`${label} contains unsafe actor_id marker: ${actorId}`);
    }
  }
}

function extractInitialRuntimeState(html) {
  const match = html.match(/<script type="application\/json" id="initial-runtime-state">\s*([\s\S]*?)\s*<\/script>/);
  if (!match) {
    fail("interactive runtime is missing initial-runtime-state JSON block");
  }
  return JSON.parse(match[1]);
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const manifest = readJson(manifestPath);
const schema = readJson("schemas/real-uat-preflight-checklist.schema.json");
const validate = ajv.compile(schema);

if (!validate(manifest)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("real UAT preflight checklist does not match schema");
}

requireFile("docs/product/ux/real-uat-preflight-checklist.md");

for (const artifact of manifest.required_artifacts) {
  if (artifact.required_before_session) {
    requireFile(artifact.path);
  }
}

const requiredCommands = [
  "npm run validate:real-uat-preflight",
  "npm run validate:real-uat-operator-handoff",
  "npm run validate:real-uat-import",
  "npm run validate:real-uat-session-importer",
  "npm run validate:plan-completion-audit",
  "npm test",
];
for (const command of requiredCommands) {
  if (!manifest.validation_commands.includes(command)) {
    fail(`preflight checklist is missing validation command: ${command}`);
  }
}

const html = readText("artifacts/examples/review-runtime-interactive.html");
if (!html.includes('download="review-runtime-state-export.json"')) {
  fail("interactive runtime is missing review-runtime-state-export.json download target");
}
if (!html.includes("datacanvas.review.runtime.state.v0.1")) {
  fail("interactive runtime is missing stable localStorage key");
}
if (!html.includes('id="actor-id"') || !html.includes('id="real-uat-mode"') || !html.includes('id="reset-runtime"')) {
  fail("interactive runtime is missing real UAT actor identity controls");
}
if (html.includes("interactive-approver") || html.includes("interactive-${transition.role}")) {
  fail("interactive runtime must not generate interactive-* actor ids for exported events");
}

const initialState = extractInitialRuntimeState(html);
if (initialState.status !== "fixture" || initialState.session_kind !== "fixture") {
  fail("initial runtime state must remain fixture before real UAT");
}
if (initialState.export_allowed !== false || initialState.current_state !== "draft") {
  fail("initial runtime state must start as draft with export disabled");
}

const runtimeImport = readJson("docs/product/ux/real-uat-runtime-import.json");
if (runtimeImport.runtime_export_contract.expected_status !== "recorded_real_user") {
  fail("runtime import must require recorded_real_user status");
}
if (runtimeImport.runtime_export_contract.expected_session_kind !== "real_user") {
  fail("runtime import must require real_user session_kind");
}
for (const action of ["submit_for_review", "comment", "record_decision", "export"]) {
  if (!runtimeImport.required_runtime_actions.includes(action)) {
    fail(`runtime import is missing required action: ${action}`);
  }
}

const handoff = readJson("docs/product/ux/real-uat-operator-handoff.json");
if (!handoff.validation_commands.includes("npm run validate:real-uat-import -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run")) {
  fail("operator handoff must require explicit --input import dry-run validation");
}
if (!handoff.validation_commands.includes("npm run prepare:real-uat-session -- --input artifacts/manual/real-uat/review-runtime-state-export.json --dry-run")) {
  fail("operator handoff must require explicit session importer dry-run validation");
}

const completionAudit = readJson("docs/process/audits/plan-completion-audit.json");
if (!["blocked_pending_external", "complete"].includes(completionAudit.status)) {
  fail("completion audit must be blocked_pending_external before external evidence or complete after evidence is collected");
}

for (const externalPath of manifest.external_evidence_policy.must_not_create) {
  if (exists(externalPath)) {
    assertNoUnsafeExternalEvidence(externalPath, readText(externalPath));
  }
}

const guide = readText("docs/product/ux/real-uat-preflight-checklist.md");
for (const requiredText of ["Preflight", "Stop Conditions", "validate:real-uat-import -- --input", "--dry-run", "human-review-session-real.json"]) {
  if (!guide.includes(requiredText)) {
    fail(`preflight guide is missing required text: ${requiredText}`);
  }
}

console.log("real UAT preflight validation passed");
