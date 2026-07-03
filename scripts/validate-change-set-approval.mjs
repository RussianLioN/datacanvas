import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const schemaPath = "schemas/proposed-change-set.schema.json";
const changeSetPath = "docs/product/revisions/co-2026-001-source-revision/proposed-change-set.json";

const semanticKinds = new Set([
  "point_semantic",
  "cross_artifact_semantic",
  "conceptual_product",
  "conceptual_process",
  "security_boundary",
]);

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function requireFile(relativePath) {
  if (!fs.existsSync(absolute(relativePath))) {
    throw new Error(`required file is missing: ${relativePath}`);
  }
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

try {
  requireFile(schemaPath);
  requireFile(changeSetPath);

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);

  const validate = ajv.compile(readJson(schemaPath));
  const changeSet = readJson(changeSetPath);
  if (!validate(changeSet)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${changeSetPath} does not match ${schemaPath}`);
  }

  for (const requiredPath of [changeSet.source_registry_path, changeSet.revision_state_path, changeSet.ledger_path]) {
    requireFile(requiredPath);
  }

  const acceptanceById = new Map();
  for (const record of changeSet.acceptance_records) {
    if (acceptanceById.has(record.acceptance_id)) {
      throw new Error(`duplicate acceptance_id: ${record.acceptance_id}`);
    }
    acceptanceById.set(record.acceptance_id, record);
    requireFile(record.evidence_path);
    if (record.source_trust_level === "untrusted_data") {
      throw new Error(`untrusted data cannot create confirmed acceptance: ${record.acceptance_id}`);
    }
  }

  const editIds = new Set();
  for (const edit of changeSet.proposed_edits) {
    if (editIds.has(edit.edit_id)) {
      throw new Error(`duplicate edit_id: ${edit.edit_id}`);
    }
    editIds.add(edit.edit_id);
    requireFile(edit.artifact_path);
    for (const downstreamPath of edit.downstream_paths) {
      requireFile(downstreamPath);
    }

    const artifactText = readText(edit.artifact_path);
    if (!artifactText.includes(edit.current_excerpt)) {
      throw new Error(`current_excerpt not found in ${edit.artifact_path} for ${edit.edit_id}`);
    }

    if (semanticKinds.has(edit.change_kind) && edit.apply_status === "applied" && !edit.acceptance_record_id) {
      throw new Error(`semantic edit is applied without acceptance record: ${edit.edit_id}`);
    }
    if (edit.acceptance_record_id && !acceptanceById.has(edit.acceptance_record_id)) {
      throw new Error(`edit references missing acceptance record: ${edit.edit_id}/${edit.acceptance_record_id}`);
    }
    if (edit.approval_status === "approved" && !edit.acceptance_record_id) {
      throw new Error(`approved edit must reference acceptance record: ${edit.edit_id}`);
    }
    if (edit.change_kind === "no_change_rationale" && edit.approval_status !== "not_required") {
      throw new Error(`no_change_rationale edit must be not_required: ${edit.edit_id}`);
    }
  }

  for (const requiredEdit of ["EDIT-001", "EDIT-002", "EDIT-003", "EDIT-004", "EDIT-005", "EDIT-006", "EDIT-007", "EDIT-008", "EDIT-009"]) {
    if (!editIds.has(requiredEdit)) {
      throw new Error(`required proposed edit is missing: ${requiredEdit}`);
    }
  }

  console.log("change set approval validation passed");
} catch (error) {
  fail(error.message);
}
