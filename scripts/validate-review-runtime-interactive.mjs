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

const manifestPath = "docs/product/ux/review-runtime-interactive.json";
const manifest = validateWithSchema("schemas/review-runtime-interactive.schema.json", manifestPath);
const runtimeState = validateWithSchema("schemas/review-runtime-state.schema.json", manifest.runtime_state_fixture_path);
const flow = readJson(manifest.review_flow_path);

for (const artifactPath of [manifest.html_path, manifest.runtime_state_fixture_path, manifest.review_flow_path, ...manifest.evidence_paths]) {
  requireFile(artifactPath);
}

if (runtimeState.current_state !== "approved" || runtimeState.export_allowed !== true) {
  fail("runtime state fixture must keep approved export-ready reference state");
}

const flowActions = new Set(flow.actions);
for (const action of manifest.required_actions) {
  if (!flowActions.has(action)) {
    fail(`interactive required action is not allowed by human review flow: ${action}`);
  }
}

for (const field of runtimeState.persisted_fields) {
  if (!manifest.persisted_fields.includes(field)) {
    fail(`interactive manifest is missing persisted field from runtime state: ${field}`);
  }
}

const html = readText(manifest.html_path);
if (!html.startsWith("<!doctype html>")) {
  fail("interactive runtime HTML must start with <!doctype html>");
}
if (!html.includes('<meta name="viewport" content="width=device-width, initial-scale=1">')) {
  fail("interactive runtime HTML must include responsive viewport meta");
}
if (!html.includes("<script")) {
  fail("interactive runtime HTML must include script-based state handling");
}
if (!html.includes(`const storageKey = "${manifest.state_storage.key}"`)) {
  fail("interactive runtime HTML must use the manifest localStorage key");
}
if (!html.includes("localStorage.setItem(storageKey")) {
  fail("interactive runtime HTML must persist state to localStorage");
}
if (!html.includes(`id="${manifest.state_storage.export_control_id}"`)) {
  fail("interactive runtime HTML is missing runtime state export control");
}
if (!html.includes(`id="${manifest.actor_controls.actor_input_id}"`)) {
  fail("interactive runtime HTML is missing actor id input");
}
if (!html.includes(`id="${manifest.actor_controls.real_uat_toggle_id}"`)) {
  fail("interactive runtime HTML is missing real UAT mode toggle");
}
if (!html.includes(`id="${manifest.actor_controls.reset_control_id}"`)) {
  fail("interactive runtime HTML is missing runtime reset control");
}
if (!html.includes('download="review-runtime-state-export.json"')) {
  fail("interactive runtime HTML must expose JSON download");
}
if (!html.includes('data-review-state="draft"') || !html.includes('data-export-enabled="false"')) {
  fail("interactive runtime HTML must expose initial state data attributes");
}
for (const action of manifest.required_actions) {
  if (!html.includes(`data-action="${action}"`)) {
    fail(`interactive runtime HTML is missing action control: ${action}`);
  }
}
for (const field of manifest.persisted_fields) {
  if (!html.includes(field)) {
    fail(`interactive runtime HTML initial state is missing persisted field: ${field}`);
  }
}
for (const marker of manifest.actor_controls.forbidden_actor_markers) {
  if (!html.includes(marker)) {
    fail(`interactive runtime HTML must validate forbidden actor marker: ${marker}`);
  }
}
if (html.includes("interactive-approver") || html.includes("interactive-${transition.role}")) {
  fail("interactive runtime HTML must not generate interactive-* actor ids");
}
if (!html.includes('status: "recorded_real_user"') || !html.includes('session_kind: "real_user"')) {
  fail("interactive runtime HTML must be able to export real_user runtime state when explicitly enabled");
}

const forbiddenPatterns = [/https?:\/\//i, /<iframe\b/i, /document\.cookie/i, /eval\s*\(/i];
for (const pattern of forbiddenPatterns) {
  if (pattern.test(html)) {
    fail(`interactive runtime HTML contains forbidden pattern: ${pattern}`);
  }
}

console.log("review runtime interactive validation passed");
