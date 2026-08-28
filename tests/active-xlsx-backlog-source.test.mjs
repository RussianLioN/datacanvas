import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..");
const validatorPath = path.join(repoRoot, "scripts/validate-active-xlsx-backlog-source.mjs");

function makeSource(overrides) {
  return {
    path: "docs/product/sources/working/source.xlsx",
    source_role: "analysis_source",
    owner_role: "Product Owner",
    lifecycle: "historical",
    trust_level: "historical",
    effective_date: "2026-07-08",
    upstream_decision: null,
    allowed_downstream_use: ["controlled_excel_source_audit"],
    affected_artifacts: [],
    notes: "Минимальный тестовый источник.",
    sha256: null,
    derived_from: null,
    verifier_command: null,
    allowed_delta: null,
    approval_status: null,
    team_validation_status: null,
    provenance_manifest: null,
    ...overrides,
  };
}

function runValidator({ commonCommand, july8 = {}, august17 = {}, august19 = {} }) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-active-xlsx-source-"));
  fs.mkdirSync(path.join(tempRoot, "docs/product/sources"), { recursive: true });
  fs.writeFileSync(
    path.join(tempRoot, "package.json"),
    JSON.stringify(
      {
        type: "module",
        scripts: {
          "validate:xlsx-backlog": commonCommand,
          "validate:xlsx-backlog-2026-08-17": "historical validator",
          "validate:xlsx-backlog-2026-08-19": "current validator",
        },
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(tempRoot, "docs/product/sources/product-source-registry.json"),
    JSON.stringify(
      {
        sources: [
          makeSource({
            source_id: "SRC-DC-BACKLOG-DRAFT-PSHE-2026-07-08",
            path: "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.xlsx",
            verifier_command: "npm run validate:xlsx-backlog-2026-07-08",
            ...july8,
          }),
          makeSource({
            source_id: "SRC-DC-BACKLOG-DRAFT-PSHE-2026-08-17",
            path: "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-08-17.xlsx",
            lifecycle: "superseded",
            trust_level: "superseded_by_co_acceptance",
            effective_date: "2026-08-17",
            upstream_decision: "CO-2026-003",
            allowed_downstream_use: ["controlled_excel_source_audit"],
            verifier_command: "npm run validate:xlsx-backlog-2026-08-17",
            ...august17,
          }),
          makeSource({
            source_id: "SRC-DC-BACKLOG-DRAFT-PSHE-2026-08-19",
            path: "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-08-19.xlsx",
            lifecycle: "active",
            trust_level: "accepted_current",
            effective_date: "2026-08-19",
            upstream_decision: "CO-2026-003",
            allowed_downstream_use: ["current_2026_scope"],
            verifier_command: "npm run validate:xlsx-backlog-2026-08-19",
            ...august19,
          }),
        ],
      },
      null,
      2,
    ),
  );
  const result = spawnSync(process.execPath, [validatorPath], {
    cwd: tempRoot,
    encoding: "utf8",
  });
  fs.rmSync(tempRoot, { recursive: true, force: true });
  return result;
}

test("active XLSX validator accepts the current 2026-08-19 common entry", () => {
  const result = runValidator({
    commonCommand: "node scripts/validate-active-xlsx-backlog-source.mjs && npm run validate:xlsx-backlog-2026-08-19",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Active XLSX backlog source validation passed/u);
});

test("active XLSX validator rejects a direct 2026-08-17 profile or path in the common entry", () => {
  const result = runValidator({
    commonCommand:
      "node scripts/validate-active-xlsx-backlog-source.mjs && npm run validate:xlsx-backlog-2026-08-19 && python3 scripts/validate-datacanvas-xlsx-backlog.py --profile 2026-08-17 --working docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-08-17.xlsx",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /validate:xlsx-backlog must not reference historical 2026-08-17/u);
});

test("active XLSX validator rejects 2026-07-08 as an accepted current source", () => {
  const result = runValidator({
    commonCommand: "node scripts/validate-active-xlsx-backlog-source.mjs && npm run validate:xlsx-backlog-2026-08-19",
    july8: {
      lifecycle: "accepted",
      trust_level: "accepted_current",
      allowed_downstream_use: ["cascade_synchronization"],
      verifier_command: "npm run validate:xlsx-backlog",
    },
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /2026-07-08 XLSX source must remain historical/u);
});
