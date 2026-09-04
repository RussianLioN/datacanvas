import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function sha256(relativePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relativePath))).digest("hex");
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function copyBmcFixture(tempRoot) {
  fs.cpSync(path.join(root, "docs/product/bmc"), path.join(tempRoot, "docs/product/bmc"), {
    recursive: true,
  });
  fs.cpSync(path.join(root, "schemas"), path.join(tempRoot, "schemas"), {
    recursive: true,
  });
}

function refreshPackageManifestHashes(tempRoot) {
  const manifestPath = path.join(tempRoot, "docs/product/bmc/manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.artifacts = manifest.artifacts.map((artifact) => ({
    ...artifact,
    sha256: crypto.createHash("sha256").update(fs.readFileSync(path.join(tempRoot, artifact.path))).digest("hex"),
  }));
  writeJson(manifestPath, manifest);
}

function assertPackageRejectsEmbeddedHashMutation(relativePath, mutate, expectedError = /embedded BMC evidence hash is stale/u) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-bmc-evidence-hash-"));
  try {
    copyBmcFixture(tempRoot);
    const evidencePath = path.join(tempRoot, relativePath);
    const evidence = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
    mutate(evidence);
    writeJson(evidencePath, evidence);
    refreshPackageManifestHashes(tempRoot);

    const result = spawnSync("node", [path.join(root, "scripts/validate-bmc-package.mjs")], {
      cwd: tempRoot,
      encoding: "utf8",
    });
    assert.notEqual(
      result.status,
      0,
      `package validator must reject an embedded hash mismatch in ${relativePath}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
    assert.match(result.stderr, expectedError);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function assertFailedGenerationDoesNotPublishPartialPackage() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-bmc-atomic-"));
  try {
    copyBmcFixture(tempRoot);
    const tracePath = path.join(tempRoot, "docs/product/bmc/bmc-trace.v0.1.json");
    const trace = JSON.parse(fs.readFileSync(tracePath, "utf8"));
    trace.items[0].statement = `${trace.items[0].statement}.`;
    writeJson(tracePath, trace);

    const generatedPaths = [
      "docs/product/bmc/bmc-v0.2.md",
      "docs/product/bmc/source/derived/datacanvas-bmc.puml",
      "docs/product/bmc/source/derived/datacanvas-bmc.svg",
      "docs/product/bmc/source/derived/datacanvas-bmc.png",
      "docs/product/bmc/source/derived/datacanvas-bmc.pdf",
      "docs/product/bmc/bmc-validation-needs.json",
      "docs/product/bmc/bmc-derived-manifest.json",
      "docs/product/bmc/README.md",
      "docs/product/bmc/source-map.md",
      "docs/product/bmc/text-alternative.md",
      "docs/product/bmc/evidence/bmc-visual-design-philosophy.md",
      "docs/product/bmc/evidence/bmc-visual-acceptance.json",
      "docs/product/bmc/evidence/designer-consilium.json",
      "docs/product/bmc/evidence/visual-review.md",
      "docs/product/bmc/manifest.json",
    ];
    const before = new Map(generatedPaths.map((relativePath) => [
      relativePath,
      fs.readFileSync(path.join(tempRoot, relativePath)),
    ]));
    const binDir = path.join(tempRoot, "bin");
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(path.join(binDir, "rsvg-convert"), "#!/bin/sh\nexit 97\n", { mode: 0o755 });

    const result = spawnSync("node", [path.join(root, "scripts/generate-bmc-artifacts.mjs")], {
      cwd: tempRoot,
      encoding: "utf8",
      env: { ...process.env, PATH: `${binDir}:${process.env.PATH}` },
    });
    assert.notEqual(result.status, 0, "fixture must force BMC generation to fail before publication");
    for (const [relativePath, bytes] of before) {
      assert.equal(
        fs.readFileSync(path.join(tempRoot, relativePath)).equals(bytes),
        true,
        `failed BMC generation must not partially publish ${relativePath}`,
      );
    }
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function assertConcurrentSourceChangeDoesNotReplacePackage() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-bmc-source-drift-"));
  try {
    copyBmcFixture(tempRoot);
    const tracePath = path.join(tempRoot, "docs/product/bmc/bmc-trace.v0.1.json");
    const trace = JSON.parse(fs.readFileSync(tracePath, "utf8"));
    trace.items[0].statement = `${trace.items[0].statement}.`;
    writeJson(tracePath, trace);

    const generatedPaths = [
      "docs/product/bmc/bmc-v0.2.md",
      "docs/product/bmc/source/derived/datacanvas-bmc.svg",
      "docs/product/bmc/source/derived/datacanvas-bmc.png",
      "docs/product/bmc/source/derived/datacanvas-bmc.pdf",
      "docs/product/bmc/manifest.json",
    ];
    const before = new Map(generatedPaths.map((relativePath) => [
      relativePath,
      fs.readFileSync(path.join(tempRoot, relativePath)),
    ]));
    const renderer = spawnSync("sh", ["-lc", "command -v rsvg-convert"], { encoding: "utf8" }).stdout.trim();
    assert.notEqual(renderer, "", "профильный тест требует доступный rsvg-convert");

    const binDir = path.join(tempRoot, "bin");
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(
      path.join(binDir, "rsvg-convert"),
      `#!/bin/sh\n\"${renderer}\" \"$@\"\nstatus=$?\nif [ \"$status\" -eq 0 ]; then\n  printf '\\nРучная правка во время генерации.\\n' >> \"$PWD/docs/product/bmc/README.md\"\nfi\nexit \"$status\"\n`,
      { mode: 0o755 },
    );

    const result = spawnSync("node", [path.join(root, "scripts/generate-bmc-artifacts.mjs")], {
      cwd: tempRoot,
      encoding: "utf8",
      env: { ...process.env, PATH: `${binDir}:${process.env.PATH}` },
    });
    assert.notEqual(result.status, 0, "параллельная правка BMC должна отменить публикацию пакета");
    assert.match(result.stderr, /BMC package changed while the package was being staged/u);
    assert.match(fs.readFileSync(path.join(tempRoot, "docs/product/bmc/README.md"), "utf8"), /Ручная правка во время генерации/u);
    for (const [relativePath, bytes] of before) {
      assert.equal(
        fs.readFileSync(path.join(tempRoot, relativePath)).equals(bytes),
        true,
        `параллельная правка не должна заменить ${relativePath} версией из промежуточного каталога`,
      );
    }
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

test("автоматическая проверка BMC не выдает себя за независимую приемку или консилиум", () => {
  const automatedChecks = readJson("docs/product/bmc/evidence/bmc-visual-acceptance.json");
  const independentReview = readJson("docs/product/bmc/evidence/designer-consilium.json");

  assert.equal(automatedChecks.status, "automated_checks_passed");
  assert.equal(automatedChecks.independent_acceptance_status, "pending");
  assert.equal("checked_at" in automatedChecks, false);
  assert.equal(automatedChecks.source_revision_kind, "declared_trace_revision");
  assert.equal(automatedChecks.source_trace_sha256, sha256(automatedChecks.source_trace_path));
  assert.equal(automatedChecks.source_lock_sha256, sha256(automatedChecks.source_lock_path));

  assert.equal(independentReview.status, "not_run");
  assert.equal(independentReview.review_origin, "not_generated");
  assert.equal("checked_at" in independentReview, false);
  assert.equal("roles" in independentReview, false);
});

test("сводка BMC явно показывает открытые ссылки на доказательства и вопросы", () => {
  const validationNeeds = readJson("docs/product/bmc/bmc-validation-needs.json");
  const expectedUnresolvedReferences = validationNeeds.summary.evidence_request_ids.length
    + validationNeeds.summary.open_question_ids.length;

  assert.equal(validationNeeds.status, "generated_with_open_references");
  assert.equal(validationNeeds.summary.unresolved_reference_count, expectedUnresolvedReferences);
});

test("валидатор BMC сверяет вложенные отпечатки автоматической проверки и статуса независимого просмотра", () => {
  assertPackageRejectsEmbeddedHashMutation(
    "docs/product/bmc/evidence/bmc-visual-acceptance.json",
    (evidence) => {
      evidence.output_sha256.png = "0".repeat(64);
    },
  );
  assertPackageRejectsEmbeddedHashMutation(
    "docs/product/bmc/evidence/designer-consilium.json",
    (evidence) => {
      evidence.input_sha256 = "0".repeat(64);
    },
  );
  assertPackageRejectsEmbeddedHashMutation(
    "docs/product/bmc/evidence/designer-consilium.json",
    (evidence) => {
      evidence.canonical_visual_path = "docs/product/bmc/text-alternative.md";
      evidence.input_sha256 = sha256("docs/product/bmc/text-alternative.md");
    },
    /wrong canonical visual source|schema validation failed|must be equal to constant/u,
  );
  assertPackageRejectsEmbeddedHashMutation(
    "docs/product/bmc/evidence/bmc-visual-acceptance.json",
    (evidence) => {
      evidence.source_trace_path = "docs/product/bmc/source-lock.json";
      evidence.source_trace_sha256 = sha256("docs/product/bmc/source-lock.json");
    },
    /wrong canonical source trace|schema validation failed|must be equal to constant/u,
  );
});

test("сбой генерации BMC не публикует частичный пакет", () => {
  assertFailedGenerationDoesNotPublishPartialPackage();
});

test("параллельная правка исходного BMC отменяет публикацию временного пакета", () => {
  assertConcurrentSourceChangeDoesNotReplacePackage();
});
