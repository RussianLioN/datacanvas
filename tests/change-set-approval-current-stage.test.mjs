import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const repositoryRoot = process.cwd();
const changeSetPath = "docs/product/revisions/co-2026-001-source-revision/proposed-change-set.json";
const schemaPath = "schemas/proposed-change-set.schema.json";

function readRootJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8"));
}

function copyIntoSandbox(sandboxRoot, relativePath) {
  const sourcePath = path.join(repositoryRoot, relativePath);
  const targetPath = path.join(sandboxRoot, relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

function buildChangeSetSandbox() {
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-change-set-approval-"));
  const changeSet = readRootJson(changeSetPath);
  const requiredPaths = new Set([
    schemaPath,
    changeSetPath,
    changeSet.source_registry_path,
    changeSet.revision_state_path,
    changeSet.ledger_path,
  ]);

  for (const record of changeSet.acceptance_records) {
    requiredPaths.add(record.evidence_path);
  }

  for (const edit of changeSet.proposed_edits) {
    requiredPaths.add(edit.artifact_path);
    for (const downstreamPath of edit.downstream_paths) {
      requiredPaths.add(downstreamPath);
    }
  }

  for (const requiredPath of requiredPaths) {
    copyIntoSandbox(sandboxRoot, requiredPath);
  }

  return { changeSet, sandboxRoot };
}

function runValidator(cwd) {
  return spawnSync("node", [path.join(repositoryRoot, "scripts/validate-change-set-approval.mjs")], {
    cwd,
    encoding: "utf8",
  });
}

test("применённые исторические правки не блокируют принятый этап БТ CO-2026-003", () => {
  const output = execFileSync("node", ["scripts/validate-change-set-approval.mjs"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });

  assert.match(output, /change set approval validation passed/u);
});

test("неприменённая историческая правка требует current_excerpt в живом артефакте", () => {
  const { changeSet, sandboxRoot } = buildChangeSetSandbox();
  try {
    const edit = changeSet.proposed_edits.find((candidate) => candidate.edit_id === "EDIT-009");
    assert.ok(edit);

    const artifactPath = path.join(sandboxRoot, edit.artifact_path);
    const artifactText = fs.readFileSync(artifactPath, "utf8");
    assert.match(artifactText, new RegExp(edit.current_excerpt.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));

    fs.writeFileSync(artifactPath, artifactText.replace(edit.current_excerpt, "\"status\": \"active\""));
    const result = runValidator(sandboxRoot);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /current_excerpt not found .*EDIT-009/u);
  } finally {
    fs.rmSync(sandboxRoot, { recursive: true, force: true });
  }
});

test("применённая правка не может ссылаться на чужую запись согласования", () => {
  const { changeSet, sandboxRoot } = buildChangeSetSandbox();
  try {
    const edit = changeSet.proposed_edits.find((candidate) => candidate.edit_id === "EDIT-002");
    assert.ok(edit);
    const unrelatedRecord = changeSet.acceptance_records.find(
      (record) => !record.related_edit_ids.includes(edit.edit_id),
    );
    assert.ok(unrelatedRecord);

    edit.acceptance_record_id = unrelatedRecord.acceptance_id;
    fs.writeFileSync(
      path.join(sandboxRoot, changeSetPath),
      `${JSON.stringify(changeSet, null, 2)}\n`,
    );
    const result = runValidator(sandboxRoot);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /acceptance record does not confirm edit: EDIT-002/u);
  } finally {
    fs.rmSync(sandboxRoot, { recursive: true, force: true });
  }
});

test("запись согласования не может перечислять несвязанную или отсутствующую правку", () => {
  const { changeSet, sandboxRoot } = buildChangeSetSandbox();
  try {
    const record = changeSet.acceptance_records.find(
      (candidate) => candidate.acceptance_id === "AR-CO-2026-001-PO-001",
    );
    assert.ok(record);

    record.related_edit_ids = ["EDIT-009"];
    fs.writeFileSync(
      path.join(sandboxRoot, changeSetPath),
      `${JSON.stringify(changeSet, null, 2)}\n`,
    );
    let result = runValidator(sandboxRoot);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /acceptance record does not match edit: AR-CO-2026-001-PO-001\/EDIT-009/u);

    record.related_edit_ids = ["EDIT-999"];
    fs.writeFileSync(
      path.join(sandboxRoot, changeSetPath),
      `${JSON.stringify(changeSet, null, 2)}\n`,
    );
    result = runValidator(sandboxRoot);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /acceptance record references missing edit: AR-CO-2026-001-PO-001\/EDIT-999/u);
  } finally {
    fs.rmSync(sandboxRoot, { recursive: true, force: true });
  }
});
