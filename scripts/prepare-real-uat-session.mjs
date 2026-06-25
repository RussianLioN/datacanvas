import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const manifestPath = "docs/product/ux/real-uat-session-importer.json";

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

function compileSchema(schemaPath) {
  const schema = readJson(schemaPath);
  return ajv.compile(schema);
}

function validateData(schemaPath, data, label) {
  const validate = compileSchema(schemaPath);
  if (!validate(data)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${label} does not match ${schemaPath}`);
  }
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

function requireActions(runtimeState) {
  const required = ["submit_for_review", "comment", "record_decision", "export"];
  const actual = new Set(runtimeState.transition_history.map((event) => event.action));
  for (const action of required) {
    if (!actual.has(action)) {
      fail(`runtime export is missing required action: ${action}`);
    }
  }
}

function toSession(runtimeState, inputPath) {
  const actor = runtimeState.transition_history.find((event) => event.action === "record_decision")
    || runtimeState.transition_history[0];

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
      actor_id: actor.actor_id,
      role: actor.role
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
      inputPath,
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

const manifest = readJson(manifestPath);
validateData("schemas/real-uat-session-importer.schema.json", manifest, manifestPath);
requireFile(manifest.input_contract.schema_path);
requireFile(manifest.output_contract.schema_path);
requireFile("docs/product/ux/uat-manifest.json");
requireFile("docs/product/ux/uat-result-minimal.json");
requireFile("tests/golden/claim-map-minimal.json");
requireFile("tests/golden/trace-manifest-minimal.json");

const inputPath = argValue("--input");
const outputPath = argValue("--output") || manifest.output_contract.default_output_path;

if (!inputPath) {
  console.log("real UAT session importer readiness validation passed");
  process.exit(0);
}

const runtimeState = readJson(inputPath);
validateData(manifest.input_contract.schema_path, runtimeState, inputPath);

if (runtimeState.status !== manifest.input_contract.required_status) {
  fail(`runtime export must have status=${manifest.input_contract.required_status}`);
}
if (runtimeState.session_kind !== manifest.input_contract.required_session_kind) {
  fail(`runtime export must have session_kind=${manifest.input_contract.required_session_kind}`);
}
if (runtimeState.current_state !== "approved" || runtimeState.export_allowed !== true) {
  fail("runtime export must be approved and export_allowed=true");
}

assertNoUnsafeIdentityMarkers("runtime export", runtimeState);
requireActions(runtimeState);

const session = toSession(runtimeState, inputPath);
assertNoUnsafeIdentityMarkers("generated human review session", session);
validateData(manifest.output_contract.schema_path, session, outputPath);

if (hasArg("--dry-run")) {
  console.log(`real UAT session artifact dry-run passed: ${outputPath}`);
  process.exit(0);
}

writeJson(outputPath, session);
console.log(`real UAT session artifact written: ${outputPath}`);
