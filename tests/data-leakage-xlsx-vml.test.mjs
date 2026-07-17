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
