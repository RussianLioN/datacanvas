import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createStoredZip } from "../scripts/lib/documentation-archive.mjs";

const root = process.cwd();

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function prepareLeakageFixture(tempRoot, targetPath) {
  fs.mkdirSync(path.join(tempRoot, "schemas"), { recursive: true });
  fs.copyFileSync(
    path.join(root, "schemas/data-leakage-manifest.schema.json"),
    path.join(tempRoot, "schemas/data-leakage-manifest.schema.json"),
  );

  const policyPaths = [
    "docs/architecture/security/data-classification-policy.md",
    "docs/architecture/security/trust-boundaries.md",
    "docs/architecture/security/export-sanitization-checklist.md",
  ];
  for (const relativePath of policyPaths) {
    fs.mkdirSync(path.dirname(path.join(tempRoot, relativePath)), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, relativePath), "policy\n");
  }

  const targetPaths = [
    "artifacts/clean-1.txt",
    "artifacts/clean-2.txt",
    "artifacts/clean-3.txt",
    "artifacts/clean-4.txt",
    targetPath,
  ];
  for (const relativePath of targetPaths.slice(0, 4)) {
    fs.mkdirSync(path.dirname(path.join(tempRoot, relativePath)), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, relativePath), "clean\n");
  }

  writeJson(path.join(tempRoot, "docs/architecture/security/data-leakage-manifest.json"), {
    version: "0.1.0",
    status: "active",
    policy_paths: policyPaths,
    scan_targets: targetPaths.map((scanPath, index) => ({
      id: `DLT-T-${index + 1}`,
      path: scanPath,
      sink: "evidence",
      data_class: "internal",
    })),
    forbidden_classes: ["secret", "pii", "local_path", "raw_trace", "internal_prompt", "tool_output"],
    required_gates: [
      "npm run scan:secrets",
      "npm run validate:export",
      "npm run validate:data-leakage",
      "npm run validate:security-foundation",
    ],
    known_limitations: [],
    next_safe_step: "Fix leakage findings.",
  });
  writeJson(path.join(tempRoot, "docs/navigation/navigation-source.json"), {
    sensitive_path_rules: [],
  });
  writeJson(path.join(tempRoot, "docs/navigation/documentation-index.json"), {
    entries: [],
  });
}

function runLeakageValidator(tempRoot) {
  return spawnSync("node", [path.join(root, "scripts/validate-data-leakage.mjs")], {
    cwd: tempRoot,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
}

for (const memberPath of ["demo/app.js", "demo/styles.css", "source/fonts/OFL.txt"]) {
  test(`data leakage validator scans ${path.extname(memberPath)} members inside ZIP`, () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-leakage-zip-"));
    try {
      const targetPath = "artifacts/leaky.zip";
      prepareLeakageFixture(tempRoot, targetPath);
      const archivePath = path.join(tempRoot, targetPath);
      fs.mkdirSync(path.dirname(archivePath), { recursive: true });
      fs.writeFileSync(archivePath, createStoredZip([
        {
          name: memberPath,
          content: Buffer.from("source=/Users/private/project\n", "utf8"),
        },
      ]));

      const result = runLeakageValidator(tempRoot);

      assert.notEqual(
        result.status,
        0,
        `${memberPath} with a local path inside ZIP must fail validation\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
      );
      assert.match(result.stderr, /local_path\/mac_user_path/u);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
}

test("выпускной ZIP проверяется только после разрешения выпуска, но не теряет защиту от утечек", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-leakage-release-gate-"));
  try {
    prepareLeakageFixture(tempRoot, "artifacts/clean-target.txt");
    fs.writeFileSync(path.join(tempRoot, "artifacts/clean-target.txt"), "safe\n");
    const archivePath = "artifacts/release.zip";
    const contractPath = "docs/release/archive-contract.json";
    const journeyPath = "docs/product/journey.json";
    const manifestPath = path.join(tempRoot, "docs/architecture/security/data-leakage-manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.scan_targets.push({
      id: "DLT-RELEASE",
      path: archivePath,
      sink: "evidence",
      data_class: "internal",
      release_gate_contract_path: contractPath,
    });
    writeJson(manifestPath, manifest);
    writeJson(path.join(tempRoot, journeyPath), {
      lifecycle: {
        content_review_status: "pending_product_owner",
        visual_release_status: "pending_product_owner",
      },
    });
    writeJson(path.join(tempRoot, contractPath), {
      release_gate: {
        journey_contract_path: journeyPath,
        required_content_review_status: "approved_product_owner",
        required_visual_release_status: "approved_product_owner",
      },
    });

    let result = runLeakageValidator(tempRoot);
    assert.equal(result.status, 0, result.stderr);

    const archiveAbsolutePath = path.join(tempRoot, archivePath);
    fs.mkdirSync(path.dirname(archiveAbsolutePath), { recursive: true });
    fs.writeFileSync(archiveAbsolutePath, createStoredZip([{ name: "safe.txt", content: Buffer.from("safe\n", "utf8") }]));
    result = runLeakageValidator(tempRoot);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /выпускной барьер/u);

    fs.rmSync(archiveAbsolutePath);
    writeJson(path.join(tempRoot, journeyPath), {
      lifecycle: {
        content_review_status: "approved_product_owner",
        visual_release_status: "approved_product_owner",
      },
    });
    result = runLeakageValidator(tempRoot);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /разрешен.*отсутствует/u);

    fs.writeFileSync(archiveAbsolutePath, createStoredZip([{ name: "safe.txt", content: Buffer.from("safe\n", "utf8") }]));
    result = runLeakageValidator(tempRoot);
    assert.equal(result.status, 0, result.stderr);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("data leakage validator scans XLSX VML parts", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-leakage-vml-"));
  try {
    fs.mkdirSync(path.join(tempRoot, "schemas"), { recursive: true });
    fs.copyFileSync(
      path.join(root, "schemas/data-leakage-manifest.schema.json"),
      path.join(tempRoot, "schemas/data-leakage-manifest.schema.json"),
    );

    for (const relativePath of [
      "docs/architecture/security/data-classification-policy.md",
      "docs/architecture/security/trust-boundaries.md",
      "docs/architecture/security/export-sanitization-checklist.md",
    ]) {
      fs.mkdirSync(path.dirname(path.join(tempRoot, relativePath)), { recursive: true });
      fs.writeFileSync(path.join(tempRoot, relativePath), "policy\n");
    }

    const targetPaths = [
      "artifacts/clean-1.txt",
      "artifacts/clean-2.txt",
      "artifacts/clean-3.txt",
      "artifacts/clean-4.txt",
      "artifacts/leaky.xlsx",
    ];
    for (const relativePath of targetPaths.slice(0, 4)) {
      fs.mkdirSync(path.dirname(path.join(tempRoot, relativePath)), { recursive: true });
      fs.writeFileSync(path.join(tempRoot, relativePath), "clean\n");
    }

    const xlsxPath = path.join(tempRoot, "artifacts/leaky.xlsx");
    fs.mkdirSync(path.dirname(xlsxPath), { recursive: true });
    const createXlsx = spawnSync(
      "python3",
      [
        "-c",
        "import sys, zipfile\nwith zipfile.ZipFile(sys.argv[1], 'w') as z:\n    z.writestr('xl/workbook.xml', '<workbook/>')\n    z.writestr('xl/drawings/vmlDrawing1.vml', 'file:///Users/private/source.xlsx')\n",
        xlsxPath,
      ],
      { encoding: "utf8" },
    );
    assert.equal(createXlsx.status, 0, createXlsx.stderr);

    writeJson(path.join(tempRoot, "docs/architecture/security/data-leakage-manifest.json"), {
      version: "0.1.0",
      status: "active",
      policy_paths: [
        "docs/architecture/security/data-classification-policy.md",
        "docs/architecture/security/trust-boundaries.md",
        "docs/architecture/security/export-sanitization-checklist.md",
      ],
      scan_targets: targetPaths.map((targetPath, index) => ({
        id: `DLT-T-${index + 1}`,
        path: targetPath,
        sink: "evidence",
        data_class: "internal",
      })),
      forbidden_classes: ["secret", "pii", "local_path", "raw_trace", "internal_prompt", "tool_output"],
      required_gates: [
        "npm run scan:secrets",
        "npm run validate:export",
        "npm run validate:data-leakage",
        "npm run validate:security-foundation",
      ],
      known_limitations: [],
      next_safe_step: "Fix leakage findings.",
    });
    writeJson(path.join(tempRoot, "docs/navigation/navigation-source.json"), {
      sensitive_path_rules: [],
    });
    writeJson(path.join(tempRoot, "docs/navigation/documentation-index.json"), {
      entries: [],
    });

    const result = spawnSync("node", [path.join(root, "scripts/validate-data-leakage.mjs")], {
      cwd: tempRoot,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });

    assert.notEqual(
      result.status,
      0,
      `VML local path inside XLSX must fail validation\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
    assert.match(result.stderr, /local_path|file_url|mac_user_path/u);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
