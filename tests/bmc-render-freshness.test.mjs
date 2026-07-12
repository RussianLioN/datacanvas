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

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    }
  }
  return (value ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const result = Buffer.alloc(12 + data.length);
  result.writeUInt32BE(data.length, 0);
  typeBytes.copy(result, 4);
  data.copy(result, 8);
  result.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length);
  return result;
}

function repackagePngIdat(filePath) {
  const bytes = fs.readFileSync(filePath);
  const parts = [bytes.subarray(0, 8)];
  const idat = [];
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const chunkEnd = offset + 12 + length;
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    if (type === "IDAT") {
      idat.push(bytes.subarray(offset + 8, offset + 8 + length));
    } else {
      if (type === "IEND") {
        parts.push(pngChunk("IDAT", Buffer.concat(idat)));
      }
      parts.push(bytes.subarray(offset, chunkEnd));
    }
    offset = chunkEnd;
    if (type === "IEND") break;
  }
  fs.writeFileSync(filePath, Buffer.concat(parts));
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
    const staleMarker = Buffer.from("stale-render\n");
    fs.appendFileSync(targetPath, staleMarker);
    const corruptedHash = sha256File(targetPath);

    const result = spawnSync("node", [path.join(root, "scripts/generate-bmc-artifacts.mjs")], {
      cwd: tempRoot,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    assert.equal(result.status, 0, `normal BMC generation failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
    const refreshedBytes = fs.readFileSync(targetPath);
    assert.notEqual(sha256File(targetPath), corruptedHash, `normal BMC generation did not replace ${stalePath}`);
    assert.equal(
      refreshedBytes.subarray(-staleMarker.length).equals(staleMarker),
      false,
      `normal BMC generation retained the stale marker in ${stalePath}`,
    );
    const manifest = JSON.parse(
      fs.readFileSync(path.join(tempRoot, "docs/product/bmc/bmc-derived-manifest.json"), "utf8"),
    );
    const output = manifest.outputs.find((item) => item.path === stalePath);
    assert.equal(output?.sha256, sha256File(targetPath), `derived manifest hash is stale for ${stalePath}`);
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

function assertBmcParityAcceptsRepackagedPng() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-bmc-repackaged-"));
  try {
    fs.cpSync(path.join(root, "docs/product/bmc"), path.join(tempRoot, "docs/product/bmc"), {
      recursive: true,
    });
    const pngPath = path.join(tempRoot, "docs/product/bmc/source/derived/datacanvas-bmc.png");
    const originalHash = sha256File(pngPath);
    repackagePngIdat(pngPath);
    assert.notEqual(sha256File(pngPath), originalHash, "test fixture must change PNG bytes");

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
    assert.equal(
      result.status,
      0,
      `visually identical PNG repackaging must pass parity\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function assertBmcParityRejectsPixelsOutsideFrame() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-bmc-clearance-"));
  try {
    fs.cpSync(path.join(root, "docs/product/bmc"), path.join(tempRoot, "docs/product/bmc"), {
      recursive: true,
    });
    const canonicalSvg = fs.readFileSync(
      path.join(root, "docs/product/bmc/source/derived/datacanvas-bmc.svg"),
      "utf8",
    );
    const b2Match = /data-block="B2"[^>]*transform="translate\((\d+) (\d+)\)"[\s\S]*?<rect width="(\d+)" height="(\d+)"/u.exec(canonicalSvg);
    assert.ok(b2Match, "test fixture must expose B2 frame geometry");
    const [, x, y, width, height] = b2Match.map(Number);
    const overflowSvg = canonicalSvg.replace(
      "</svg>",
      `<rect x="${x + 80}" y="${y + height + 6}" width="${width - 160}" height="8" fill="#111827"/>\n</svg>`,
    );
    const overflowSvgPath = path.join(tempRoot, "overflow.svg");
    const pngPath = path.join(tempRoot, "docs/product/bmc/source/derived/datacanvas-bmc.png");
    fs.writeFileSync(overflowSvgPath, overflowSvg);
    const render = spawnSync(
      "rsvg-convert",
      ["-w", "3840", "-h", "2160", "-f", "png", overflowSvgPath, "-o", pngPath],
      { encoding: "utf8" },
    );
    assert.equal(render.status, 0, `overflow fixture render failed: ${render.stderr}`);

    const manifestPath = path.join(tempRoot, "docs/product/bmc/bmc-derived-manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.outputs.find((output) => output.format === "png").sha256 = sha256File(pngPath);
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const result = spawnSync("node", [path.join(root, "scripts/validate-bmc-render-parity.mjs")], {
      cwd: tempRoot,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    assert.notEqual(
      result.status,
      0,
      `visible pixels outside B2 frame must fail raster clearance validation\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
    assert.match(result.stderr, /clearance/u);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function assertBmcParityRejectsSinglePixelOverflow() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-bmc-single-pixel-"));
  try {
    fs.cpSync(path.join(root, "docs/product/bmc"), path.join(tempRoot, "docs/product/bmc"), {
      recursive: true,
    });
    const canonicalSvg = fs.readFileSync(
      path.join(root, "docs/product/bmc/source/derived/datacanvas-bmc.svg"),
      "utf8",
    );
    const b8Match = /data-block="B8"[^>]*transform="translate\((\d+) (\d+)\)"[\s\S]*?<rect width="(\d+)" height="(\d+)"/u.exec(canonicalSvg);
    assert.ok(b8Match, "test fixture must expose B8 frame geometry");
    const [, x, y, width] = b8Match.map(Number);
    const overflowSvg = canonicalSvg.replace(
      "</svg>",
      `<rect x="${x + width + 1}" y="${y + 220}" width="1" height="220" fill="#000000"/>\n</svg>`,
    );
    const overflowSvgPath = path.join(tempRoot, "single-pixel-overflow.svg");
    const pngPath = path.join(tempRoot, "docs/product/bmc/source/derived/datacanvas-bmc.png");
    fs.writeFileSync(overflowSvgPath, overflowSvg);
    const render = spawnSync(
      "rsvg-convert",
      ["-w", "3840", "-h", "2160", "-f", "png", overflowSvgPath, "-o", pngPath],
      { encoding: "utf8" },
    );
    assert.equal(render.status, 0, `single-pixel overflow fixture render failed: ${render.stderr}`);

    const manifestPath = path.join(tempRoot, "docs/product/bmc/bmc-derived-manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.outputs.find((output) => output.format === "png").sha256 = sha256File(pngPath);
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const result = spawnSync("node", [path.join(root, "scripts/validate-bmc-render-parity.mjs")], {
      cwd: tempRoot,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    assert.notEqual(
      result.status,
      0,
      `one-pixel overflow outside B8 must fail raster clearance validation\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
    assert.match(result.stderr, /clearance/u);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function assertBmcParityRejectsMissingBlockContent() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-bmc-missing-block-"));
  try {
    fs.cpSync(path.join(root, "docs/product/bmc"), path.join(tempRoot, "docs/product/bmc"), {
      recursive: true,
    });
    const canonicalSvg = fs.readFileSync(
      path.join(root, "docs/product/bmc/source/derived/datacanvas-bmc.svg"),
      "utf8",
    );
    const missingB4 = canonicalSvg.replace(
      /(<g[^>]*data-block="B4"[^>]*>)([\s\S]*?)(<\/g>)/u,
      (group, start, content, end) => `${start}${content.replace(/<text data-role="bmc-block-body"[\s\S]*?<\/text>/u, "")}${end}`,
    );
    assert.notEqual(missingB4, canonicalSvg, "test fixture must remove B4 body content");
    const alteredSvgPath = path.join(tempRoot, "missing-b4.svg");
    const pngPath = path.join(tempRoot, "docs/product/bmc/source/derived/datacanvas-bmc.png");
    fs.writeFileSync(alteredSvgPath, missingB4);
    const render = spawnSync(
      "rsvg-convert",
      ["-w", "3840", "-h", "2160", "-f", "png", alteredSvgPath, "-o", pngPath],
      { encoding: "utf8" },
    );
    assert.equal(render.status, 0, `missing-block fixture render failed: ${render.stderr}`);

    const manifestPath = path.join(tempRoot, "docs/product/bmc/bmc-derived-manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.outputs.find((output) => output.format === "png").sha256 = sha256File(pngPath);
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const result = spawnSync("node", [path.join(root, "scripts/validate-bmc-render-parity.mjs")], {
      cwd: tempRoot,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    assert.notEqual(
      result.status,
      0,
      `PNG with missing B4 content must fail per-block visual validation\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
    assert.match(result.stderr, /B4/u);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function assertBmcParityRejectsUnrelatedPdf() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-bmc-unrelated-pdf-"));
  try {
    fs.cpSync(path.join(root, "docs/product/bmc"), path.join(tempRoot, "docs/product/bmc"), {
      recursive: true,
    });
    const unrelatedSvgPath = path.join(tempRoot, "unrelated.svg");
    const pdfPath = path.join(tempRoot, "docs/product/bmc/source/derived/datacanvas-bmc.pdf");
    fs.writeFileSync(
      unrelatedSvgPath,
      '<svg xmlns="http://www.w3.org/2000/svg" width="3840" height="2160"><rect width="3840" height="2160" fill="white"/><rect x="200" y="200" width="600" height="600" fill="#111827"/></svg>\n',
    );
    const render = spawnSync("rsvg-convert", ["-f", "pdf", unrelatedSvgPath, "-o", pdfPath], {
      encoding: "utf8",
    });
    assert.equal(render.status, 0, `unrelated PDF fixture render failed: ${render.stderr}`);

    const manifestPath = path.join(tempRoot, "docs/product/bmc/bmc-derived-manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.outputs.find((output) => output.format === "pdf").sha256 = sha256File(pdfPath);
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const result = spawnSync("node", [path.join(root, "scripts/validate-bmc-render-parity.mjs")], {
      cwd: tempRoot,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    assert.notEqual(
      result.status,
      0,
      `unrelated PDF must fail visual correspondence validation\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
    assert.match(result.stderr, /PDF/u);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function assertBmcCheckModeReusesVerifiedPortableRenders() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-bmc-cross-platform-"));
  try {
    fs.cpSync(path.join(root, "docs/product/bmc"), path.join(tempRoot, "docs/product/bmc"), {
      recursive: true,
    });
    const binDir = path.join(tempRoot, "bin");
    fs.mkdirSync(binDir, { recursive: true });
    const rendererStub = path.join(binDir, "rsvg-convert");
    fs.writeFileSync(rendererStub, "#!/bin/sh\nexit 97\n", { mode: 0o755 });

    const result = spawnSync("node", [path.join(root, "scripts/generate-bmc-artifacts.mjs"), "--check"], {
      cwd: tempRoot,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, PATH: `${binDir}:${process.env.PATH}` },
    });
    assert.equal(
      result.status,
      0,
      `check mode must reuse hash-linked portable renders when SVG is unchanged\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
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

test("BMC render parity accepts valid PNG repackaging with identical pixels", () => {
  assertBmcParityAcceptsRepackagedPng();
});

test("BMC render parity rejects visible pixels outside a block frame", () => {
  assertBmcParityRejectsPixelsOutsideFrame();
});

test("BMC render parity rejects a one-pixel overflow immediately outside a frame", () => {
  assertBmcParityRejectsSinglePixelOverflow();
});

test("BMC render parity rejects a PNG with missing block content", () => {
  assertBmcParityRejectsMissingBlockContent();
});

test("BMC render parity rejects an unrelated PDF with an updated manifest hash", () => {
  assertBmcParityRejectsUnrelatedPdf();
});

test("BMC check mode is stable across renderer versions when SVG is unchanged", () => {
  assertBmcCheckModeReusesVerifiedPortableRenders();
});
