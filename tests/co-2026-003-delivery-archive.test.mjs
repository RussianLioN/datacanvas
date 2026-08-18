import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const generatorPath = path.join(repositoryRoot, "scripts/generate-documentation-archive.mjs");
const validatorPath = path.join(repositoryRoot, "scripts/validate-documentation-archive.mjs");

function runGenerator(root, ...arguments_) {
  return spawnSync(process.execPath, [generatorPath, ...arguments_], {
    cwd: root,
    encoding: "utf8",
  });
}

function runValidator(root, ...arguments_) {
  return spawnSync(process.execPath, [validatorPath, ...arguments_], {
    cwd: root,
    encoding: "utf8",
  });
}

function writeJson(root, relativePath, value) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function writeFixture(root, { contentReviewStatus, visualReleaseStatus, prototypeCheckSource }) {
  fs.mkdirSync(path.join(root, "docs/product"), { recursive: true });
  fs.writeFileSync(path.join(root, "docs/product/source.md"), "# Исходный материал\n");
  fs.mkdirSync(path.join(root, "docs/release"), { recursive: true });
  fs.writeFileSync(path.join(root, "docs/release/evidence.md"), "# Доказательства\n");
  writeJson(root, "docs/release/chain.json", {
    stages: [{ order: 1, stage_id: "source", name: "Источник", primary_artifacts: ["docs/product/source.md"] }],
  });
  writeJson(root, "docs/release/journey-contract.json", {
    lifecycle: {
      content_review_status: contentReviewStatus,
      visual_release_status: visualReleaseStatus,
    },
  });
  writeJson(root, "docs/release/delivery-archive-contract.json", {
    "$schema": "../../schemas/documentation-archive-contract.schema.json",
    version: "0.1.0",
    status: "active",
    archive_id: "co-2026-003-delivery",
    title: "Поставка прототипа",
    source_chain_path: "docs/release/chain.json",
    output_path: "artifacts/delivery/co-2026-003-delivery.zip",
    data_class: "internal",
    visibility: "restricted",
    primary_selection: "all_stage_primary_artifacts",
    additional_artifacts: [{ path: "docs/release/evidence.md", label: "Доказательства" }],
    embedded_navigation: ["index.html", "README.md", "manifest.json"],
    archive_root: "repository",
    integrity_algorithm: "sha256",
    zip_method: "store",
    fixed_zip_timestamp: "1980-01-01T00:00:00Z",
    refresh_policy: {
      trigger: "any_byte_change_in_resolved_member_or_contract",
      generate_command: "npm run generate:co-2026-003-delivery-archive",
      check_command: "npm run check:co-2026-003-delivery-archive",
      validation_command: "npm run validate:co-2026-003-delivery-archive",
    },
    release_gate: {
      journey_contract_path: "docs/release/journey-contract.json",
      required_content_review_status: "approved_product_owner",
      required_visual_release_status: "approved_product_owner",
      prototype_check: "presentation_link_lisa_user_journey",
    },
  });
  const checkPath = path.join(root, "scripts/generate-presentation-link-lisa-user-journey.mjs");
  fs.mkdirSync(path.dirname(checkPath), { recursive: true });
  fs.writeFileSync(checkPath, prototypeCheckSource);
  const schemaPath = path.join(root, "schemas/documentation-archive-contract.schema.json");
  fs.mkdirSync(path.dirname(schemaPath), { recursive: true });
  fs.copyFileSync(path.join(repositoryRoot, "schemas/documentation-archive-contract.schema.json"), schemaPath);
}

test("главный архив по умолчанию остаётся обратно совместимым", () => {
  const result = runGenerator(repositoryRoot, "--check");
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /архив документации актуален/u);
});

test("контракт поставки с неутверждёнными статусами не создаёт архив и сообщает оба статуса", () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-co-2026-003-pending-"));
  try {
    writeFixture(fixtureRoot, {
      contentReviewStatus: "pending",
      visualReleaseStatus: "pending",
      prototypeCheckSource: "process.exit(0);\n",
    });

    const result = runGenerator(fixtureRoot, "--contract", "docs/release/delivery-archive-contract.json");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /content_review_status/u);
    assert.match(result.stderr, /visual_release_status/u);
    assert.equal(fs.existsSync(path.join(fixtureRoot, "artifacts/delivery/co-2026-003-delivery.zip")), false);
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test("неактуальный прототип не проходит встроенную проверку даже после утверждения статусов", () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-co-2026-003-stale-"));
  try {
    writeFixture(fixtureRoot, {
      contentReviewStatus: "approved_product_owner",
      visualReleaseStatus: "approved_product_owner",
      prototypeCheckSource: "console.error('ERROR: прототип устарел'); process.exit(1);\n",
    });

    const result = runGenerator(fixtureRoot, "--check", "--contract", "docs/release/delivery-archive-contract.json");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /прототип.*устарел/u);
    assert.equal(fs.existsSync(path.join(fixtureRoot, "artifacts/delivery/co-2026-003-delivery.zip")), false);
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test("путь контракта не может выходить за корень рабочей копии", () => {
  const result = runGenerator(repositoryRoot, "--check", "--contract", "../documentation-archive-contract.json");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /небезопасный путь контракта|выходит за корень/u);
});

test("валидатор принимает договор поставки через --contract после успешной встроенной проверки", () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-co-2026-003-validator-"));
  try {
    writeFixture(fixtureRoot, {
      contentReviewStatus: "approved_product_owner",
      visualReleaseStatus: "approved_product_owner",
      prototypeCheckSource: "process.exit(0);\n",
    });
    const generated = runGenerator(fixtureRoot, "--contract", "docs/release/delivery-archive-contract.json");
    assert.equal(generated.status, 0, `${generated.stdout}\n${generated.stderr}`);

    const validated = runValidator(fixtureRoot, "--contract", "docs/release/delivery-archive-contract.json");
    assert.equal(validated.status, 0, `${validated.stdout}\n${validated.stderr}`);
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});
