import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function replaceAllInFile(filePath, replacements) {
  let text = fs.readFileSync(filePath, "utf8");
  for (const [from, to] of replacements) {
    text = text.replaceAll(from, to);
  }
  fs.writeFileSync(filePath, text);
}

function rewritePackageManifestHashes(tempRoot) {
  const manifestPath = path.join(tempRoot, "docs/product/bmc/manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.artifacts = manifest.artifacts.map((artifact) => ({
    ...artifact,
    sha256: sha256File(path.join(tempRoot, artifact.path)),
  }));
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function assertBmcCheckModeRejectsStalePortableRender(stalePath) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-bmc-stale-"));
  try {
    fs.cpSync(path.join(root, "docs/product/bmc"), path.join(tempRoot, "docs/product/bmc"), {
      recursive: true,
    });

    const pngPath = path.join(tempRoot, "docs/product/bmc/source/derived/datacanvas-bmc.png");
    const pdfPath = path.join(tempRoot, "docs/product/bmc/source/derived/datacanvas-bmc.pdf");
    const oldPngHash = sha256File(pngPath);
    const oldPdfHash = sha256File(pdfPath);

    fs.appendFileSync(path.join(tempRoot, stalePath), Buffer.from("stale-render\n"));

    const newPngHash = sha256File(pngPath);
    const newPdfHash = sha256File(pdfPath);
    const replacements = [
      [oldPngHash, newPngHash],
      [oldPdfHash, newPdfHash],
    ];
    for (const relativePath of [
      "docs/product/bmc/bmc-derived-manifest.json",
      "docs/product/bmc/evidence/bmc-visual-acceptance.json",
      "docs/product/bmc/evidence/designer-consilium.json",
      "docs/product/bmc/evidence/visual-review.md",
      "docs/product/bmc/manifest.json",
    ]) {
      replaceAllInFile(path.join(tempRoot, relativePath), replacements);
    }
    rewritePackageManifestHashes(tempRoot);

    const result = spawnSync("node", [path.join(root, "scripts/generate-bmc-artifacts.mjs"), "--check"], {
      cwd: tempRoot,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });

    assert.notEqual(
      result.status,
      0,
      `stale valid portable render must be rejected by check mode: ${stalePath}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function assertBmcNormalModeRefreshesStalePortableRender(stalePath) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-bmc-refresh-"));
  try {
    fs.cpSync(path.join(root, "docs/product/bmc"), path.join(tempRoot, "docs/product/bmc"), {
      recursive: true,
    });
    const targetPath = path.join(tempRoot, stalePath);
    fs.appendFileSync(targetPath, Buffer.from("stale-render\n"));

    const result = spawnSync("node", [path.join(root, "scripts/generate-bmc-artifacts.mjs")], {
      cwd: tempRoot,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    assert.equal(result.status, 0, `normal BMC generation failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
    assert.ok(
      fs.readFileSync(targetPath).equals(fs.readFileSync(path.join(root, stalePath))),
      `normal BMC generation did not refresh ${stalePath}`,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function assertBmcParityRejectsByteModifiedPng() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-bmc-parity-"));
  try {
    fs.cpSync(path.join(root, "docs/product/bmc"), path.join(tempRoot, "docs/product/bmc"), {
      recursive: true,
    });
    const pngPath = path.join(tempRoot, "docs/product/bmc/source/derived/datacanvas-bmc.png");
    fs.appendFileSync(pngPath, Buffer.from("stale-render\n"));

    const manifestPath = path.join(tempRoot, "docs/product/bmc/bmc-derived-manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const pngOutput = manifest.outputs.find((output) => output.format === "png");
    pngOutput.sha256 = sha256File(pngPath);
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const result = spawnSync("node", [path.join(root, "scripts/validate-bmc-render-parity.mjs")], {
      cwd: tempRoot,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    assert.notEqual(
      result.status,
      0,
      `byte-modified PNG must fail strict parity\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

test("BMC check mode rejects a stale PNG when PDF remains fresh", () => {
  assertBmcCheckModeRejectsStalePortableRender("docs/product/bmc/source/derived/datacanvas-bmc.png");
});

test("BMC check mode rejects a stale PDF when PNG remains fresh", () => {
  assertBmcCheckModeRejectsStalePortableRender("docs/product/bmc/source/derived/datacanvas-bmc.pdf");
});

test("normal BMC generation refreshes stale PNG and PDF", () => {
  assertBmcNormalModeRefreshesStalePortableRender("docs/product/bmc/source/derived/datacanvas-bmc.png");
  assertBmcNormalModeRefreshesStalePortableRender("docs/product/bmc/source/derived/datacanvas-bmc.pdf");
});

test("BMC render parity rejects a byte-modified PNG with unchanged pixels", () => {
  assertBmcParityRejectsByteModifiedPng();
});
