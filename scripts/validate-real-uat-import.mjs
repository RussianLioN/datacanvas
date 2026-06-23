import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const manifestPath = "docs/product/ux/real-uat-runtime-import.json";

function readText(relativePath) {
  const resolvedPath = path.isAbsolute(relativePath) ? relativePath : path.join(root, relativePath);
  return fs.readFileSync(resolvedPath, "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function writeJson(relativePath, data) {
  const resolvedPath = path.isAbsolute(relativePath) ? relativePath : path.join(root, relativePath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  fs.writeFileSync(resolvedPath, `${JSON.stringify(data, null, 2)}\n`);
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function requireFile(relativePath) {
  const resolvedPath = path.isAbsolute(relativePath) ? relativePath : path.join(root, relativePath);
  if (!fs.existsSync(resolvedPath)) {
    fail(`required file does not exist: ${relativePath}`);
  }
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? "" : process.argv[index + 1] || "";
}

function hasArg(name) {
  return process.argv.includes(name);
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

function assertNoUnsafeIdentityMarkers(label, value) {
  const text = JSON.stringify(value);
  if (text.includes("TO_BE_FILLED")) {
    fail(`${label} contains TO_BE_FILLED placeholder`);
  }
  const unsafeActorPattern = /fixture|template|sample|placeholder|interactive-|TO_BE_FILLED/i;
  const actorIds = [
    value.actor?.actor_id,
    ...(value.transition_history || []).map((event) => event.actor_id),
    ...(value.audit_events || []).map((event) => event.actor_id),
  ].filter(Boolean);
  for (const actorId of actorIds) {
    if (unsafeActorPattern.test(actorId)) {
      fail(`${label} contains unsafe actor_id marker: ${actorId}`);
    }
  }
}

function requireActions(runtimeState, requiredActions) {
  const actualActions = new Set(runtimeState.transition_history.map((event) => event.action));
  for (const action of requiredActions) {
    if (!actualActions.has(action)) {
      fail(`runtime export is missing required action: ${action}`);
    }
  }
}

function toSession(runtimeState, manifest) {
  const firstActor = runtimeState.transition_history[0]?.actor_id || "";
  return {
    version: runtimeState.version,
    session_id: runtimeState.state_id.replace(/^RRS-/, "HRS-"),
    status: "recorded_real_user",
    gate_id: runtimeState.gate_id,
    session_kind: "real_user",
    review_flow_path: runtimeState.review_flow_path,
    uat_manifest_path: "docs/product/ux/uat-manifest.json",
    uat_result_path: "docs/product/ux/uat-result-minimal.json",
    review_state: "approved",
    decision: "accepted",
    actor: {
      actor_id: firstActor,
      role: runtimeState.transition_history[0]?.role || "participant"
    },
    audit_events: runtimeState.transition_history.map((event) => ({
      actor_id: event.actor_id,
      role: event.role,
      action: event.action,
      source_artifact_id: event.source_artifact_id || runtimeState.review_ui_fixture_path,
      changed_claim_ids: [],
      reason: event.reason,
      timestamp: event.timestamp
    })),
    evidence_paths: [
      manifest.runtime_export_contract.source_runtime_path,
      runtimeState.review_flow_path,
      "docs/product/ux/uat-manifest.json",
      "docs/product/ux/uat-result-minimal.json",
      runtimeState.review_ui_fixture_path,
      "tests/golden/claim-map-minimal.json",
      "tests/golden/trace-manifest-minimal.json"
    ],
    known_limitations: [
      "Real session artifact создан из exported runtime state и требует team review перед pilot gate.",
      "После сохранения artifact нужно включить его и исходный runtime export в data leakage scan_targets."
    ],
    next_safe_step: "Запустить npm run validate:real-uat-readiness, npm run validate:data-leakage и сформировать pilot gate cut."
  };
}

const manifest = validateWithSchema("schemas/real-uat-runtime-import.schema.json", manifestPath);
requireFile(manifest.runtime_export_contract.schema_path);
requireFile("schemas/human-review-session.schema.json");
requireFile("docs/product/ux/uat-manifest.json");
requireFile("docs/product/ux/uat-result-minimal.json");
requireFile("tests/golden/claim-map-minimal.json");
requireFile("tests/golden/trace-manifest-minimal.json");

const inputPath = argValue("--input");
if (!inputPath) {
  console.log("real UAT import readiness validation passed");
  process.exit(0);
}

const runtimeState = validateWithSchema(manifest.runtime_export_contract.schema_path, inputPath);
const runtimeText = readText(inputPath);
if (runtimeText.includes("TO_BE_FILLED")) {
  fail("runtime export contains TO_BE_FILLED placeholder");
}
if (runtimeState.status !== manifest.runtime_export_contract.expected_status) {
  fail(`runtime export must have status=${manifest.runtime_export_contract.expected_status}`);
}
if (runtimeState.session_kind !== manifest.runtime_export_contract.expected_session_kind) {
  fail(`runtime export must have session_kind=${manifest.runtime_export_contract.expected_session_kind}`);
}
if (runtimeState.current_state !== "approved" || runtimeState.export_allowed !== true) {
  fail("runtime export must be approved and export_allowed=true");
}

assertNoUnsafeIdentityMarkers("runtime export", runtimeState);
requireActions(runtimeState, manifest.required_runtime_actions);

const session = toSession(runtimeState, { ...manifest, runtime_export_contract: { ...manifest.runtime_export_contract, source_runtime_path: inputPath } });
assertNoUnsafeIdentityMarkers("generated human review session", session);

const validateSession = ajv.compile(readJson("schemas/human-review-session.schema.json"));
if (!validateSession(session)) {
  console.error(JSON.stringify(validateSession.errors, null, 2));
  fail("generated human review session does not match schema");
}

if (hasArg("--dry-run")) {
  console.log(`real UAT import dry-run passed: ${manifest.output_session_path}`);
  process.exit(0);
}

writeJson(manifest.output_session_path, session);
console.log(`real UAT session artifact written: ${manifest.output_session_path}`);
