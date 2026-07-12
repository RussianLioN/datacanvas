import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import zlib from "node:zlib";
import { extractBmcSvgBlockFrames } from "./lib/bmc-visual-layout.mjs";

const root = process.cwd();
const svgPath = "docs/product/bmc/source/derived/datacanvas-bmc.svg";
const pngPath = "docs/product/bmc/source/derived/datacanvas-bmc.png";
const pdfPath = "docs/product/bmc/source/derived/datacanvas-bmc.pdf";
const manifestPath = "docs/product/bmc/bmc-derived-manifest.json";

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(absolute(relativePath), "utf8"));
}

function sha256File(relativePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(absolute(relativePath))).digest("hex");
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function parsePng(filePath, { retainRows = false } = {}) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    fail(`not a PNG file: ${filePath}`);
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];
  let canonicalEnd = false;
  const gridWidth = 96;
  const gridHeight = 54;
  const coverageGrid = Array(gridWidth * gridHeight).fill(0);

  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) {
      fail("BMC PNG contains a truncated chunk header");
    }
    const length = bytes.readUInt32BE(offset);
    const chunkEnd = offset + 12 + length;
    if (chunkEnd > bytes.length) {
      fail("BMC PNG contains a truncated chunk payload");
    }
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8) {
        fail("BMC PNG must use 8-bit channels");
      }
      colorType = data[9];
      if (![2, 6].includes(colorType)) {
        fail(`BMC PNG has unsupported color type: ${colorType}`);
      }
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      if (length !== 0 || chunkEnd !== bytes.length) {
        fail("BMC PNG contains trailing or malformed data after IEND");
      }
      canonicalEnd = true;
      break;
    }
    offset += 12 + length;
  }

  if (!canonicalEnd) fail("BMC PNG is missing a canonical IEND chunk");
  if (width <= 0 || height <= 0 || idat.length === 0) fail("BMC PNG is missing image data");

  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const inflated = zlib.inflateSync(Buffer.concat(idat));
  if (inflated.length !== (stride + 1) * height) {
    fail("BMC PNG decompressed data has an unexpected length");
  }
  const rows = [];
  let inputOffset = 0;
  let nonWhitePixels = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inputOffset];
    inputOffset += 1;
    const row = Buffer.from(inflated.subarray(inputOffset, inputOffset + stride));
    inputOffset += stride;
    const previous = rows[y - 1] ?? Buffer.alloc(stride);

    for (let x = 0; x < stride; x += 1) {
      const left = x >= channels ? row[x - channels] : 0;
      const up = previous[x] ?? 0;
      const upLeft = x >= channels ? previous[x - channels] ?? 0 : 0;
      if (filter === 1) {
        row[x] = (row[x] + left) & 0xff;
      } else if (filter === 2) {
        row[x] = (row[x] + up) & 0xff;
      } else if (filter === 3) {
        row[x] = (row[x] + Math.floor((left + up) / 2)) & 0xff;
      } else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        const predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
        row[x] = (row[x] + predictor) & 0xff;
      } else if (filter !== 0) {
        fail(`BMC PNG has unsupported filter: ${filter}`);
      }
    }

    for (let x = 0; x < row.length; x += channels) {
      const r = row[x];
      const g = row[x + 1];
      const b = row[x + 2];
      const alpha = channels === 4 ? row[x + 3] / 255 : 1;
      const visibleR = r * alpha + 255 * (1 - alpha);
      const visibleG = g * alpha + 255 * (1 - alpha);
      const visibleB = b * alpha + 255 * (1 - alpha);
      if (visibleR < 245 || visibleG < 245 || visibleB < 245) {
        nonWhitePixels += 1;
        const pixelX = x / channels;
        const cellX = Math.min(gridWidth - 1, Math.floor((pixelX * gridWidth) / width));
        const cellY = Math.min(gridHeight - 1, Math.floor((y * gridHeight) / height));
        coverageGrid[cellY * gridWidth + cellX] += 1;
      }
    }
    rows.push(row);
  }

  return {
    width,
    height,
    nonWhitePixels,
    coverageGrid,
    channels,
    rows: retainRows ? rows : undefined,
  };
}

function visualCoverageDelta(left, right) {
  let difference = 0;
  let reference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference += Math.abs(left[index] - right[index]);
    reference += Math.max(left[index], right[index]);
  }
  return difference / Math.max(1, reference);
}

function visibleRgb(png, row, x) {
  const offset = x * png.channels;
  const alpha = png.channels === 4 ? row[offset + 3] / 255 : 1;
  return [
    row[offset] * alpha + 255 * (1 - alpha),
    row[offset + 1] * alpha + 255 * (1 - alpha),
    row[offset + 2] * alpha + 255 * (1 - alpha),
  ];
}

function countVisiblePixels(png, rectangle, { maxLuminance = null } = {}) {
  const startX = Math.max(0, Math.ceil(rectangle.x));
  const endX = Math.min(png.width, Math.floor(rectangle.x + rectangle.w));
  const startY = Math.max(0, Math.ceil(rectangle.y));
  const endY = Math.min(png.height, Math.floor(rectangle.y + rectangle.h));
  let count = 0;
  for (let y = startY; y < endY; y += 1) {
    const row = png.rows[y];
    for (let x = startX; x < endX; x += 1) {
      const [visibleR, visibleG, visibleB] = visibleRgb(png, row, x);
      const luminance = visibleR * 0.2126 + visibleG * 0.7152 + visibleB * 0.0722;
      if (maxLuminance === null
        ? visibleR < 245 || visibleG < 245 || visibleB < 245
        : luminance < maxLuminance) {
        count += 1;
      }
    }
  }
  return count;
}

function blockInkSignature(png, frame) {
  const columns = 20;
  const rows = 20;
  const cells = Array(columns * rows).fill(0);
  const scaleX = png.width / 3840;
  const scaleY = png.height / 2160;
  const insetX = Math.max(4, Math.round(6 * scaleX));
  const insetY = Math.max(4, Math.round(6 * scaleY));
  const startX = Math.round(frame.x * scaleX) + insetX;
  const endX = Math.round((frame.x + frame.w) * scaleX) - insetX;
  const startY = Math.round(frame.y * scaleY) + insetY;
  const endY = Math.round((frame.y + frame.h) * scaleY) - insetY;
  let total = 0;
  for (let y = startY; y < endY; y += 1) {
    const row = png.rows[y];
    for (let x = startX; x < endX; x += 1) {
      const [red, green, blue] = visibleRgb(png, row, x);
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
      if (luminance >= 210) continue;
      const cellX = Math.min(columns - 1, Math.floor(((x - startX) * columns) / (endX - startX)));
      const cellY = Math.min(rows - 1, Math.floor(((y - startY) * rows) / (endY - startY)));
      cells[cellY * columns + cellX] += 1;
      total += 1;
    }
  }
  return { cells, total };
}

function validatePerBlockVisualCorrespondence(reference, candidate, svg, label) {
  for (const frame of extractBmcSvgBlockFrames(svg)) {
    const expected = blockInkSignature(reference, frame);
    const actual = blockInkSignature(candidate, frame);
    const totalDelta = Math.abs(expected.total - actual.total) / Math.max(expected.total, actual.total, 1);
    const spatialDelta = visualCoverageDelta(expected.cells, actual.cells);
    if (totalDelta > 0.18 || spatialDelta > 0.28) {
      fail(`${label} BMC block ${frame.id} visual content differs from the canonical SVG render: total=${totalDelta.toFixed(3)}, spatial=${spatialDelta.toFixed(3)}`);
    }
  }
}

function validateRasterFrameClearance(png, svg, label) {
  const edgeInset = 4;
  const strokeAllowance = 2;
  const clearance = 12;
  for (const frame of extractBmcSvgBlockFrames(svg)) {
    const zones = [
      { name: "top", x: frame.x + edgeInset, y: frame.y - strokeAllowance - clearance, w: frame.w - edgeInset * 2, h: clearance },
      { name: "bottom", x: frame.x + edgeInset, y: frame.y + frame.h + strokeAllowance, w: frame.w - edgeInset * 2, h: clearance },
      { name: "left", x: frame.x - strokeAllowance - clearance, y: frame.y + edgeInset, w: clearance, h: frame.h - edgeInset * 2 },
      { name: "right", x: frame.x + frame.w + strokeAllowance, y: frame.y + edgeInset, w: clearance, h: frame.h - edgeInset * 2 },
    ];
    const strictDarkZones = [
      { name: "top", x: frame.x + edgeInset, y: frame.y - 13, w: frame.w - edgeInset * 2, h: 12 },
      { name: "bottom", x: frame.x + edgeInset, y: frame.y + frame.h + 1, w: frame.w - edgeInset * 2, h: 12 },
      { name: "left", x: frame.x - 13, y: frame.y + edgeInset, w: 12, h: frame.h - edgeInset * 2 },
      { name: "right", x: frame.x + frame.w + 1, y: frame.y + edgeInset, w: 12, h: frame.h - edgeInset * 2 },
    ];
    for (const zone of zones) {
      const visiblePixels = countVisiblePixels(png, zone);
      if (visiblePixels > 8) {
        fail(`${label} BMC PNG frame clearance contains visible pixels outside ${frame.id} (${zone.name}): ${visiblePixels}`);
      }
    }
    for (const zone of strictDarkZones) {
      const darkPixels = countVisiblePixels(png, zone, { maxLuminance: 70 });
      if (darkPixels > 0) {
        fail(`${label} BMC PNG frame clearance contains dark pixels outside ${frame.id} (${zone.name}): ${darkPixels}`);
      }
    }
  }
}

function executableExists(name) {
  return (process.env.PATH ?? "")
    .split(path.delimiter)
    .filter(Boolean)
    .some((directory) => {
      try {
        fs.accessSync(path.join(directory, name), fs.constants.X_OK);
        return true;
      } catch {
        return false;
      }
    });
}

function renderPdfToPng(pdfFile, outputFile, tempRoot) {
  if (executableExists("pdftoppm")) {
    const prefix = outputFile.slice(0, -path.extname(outputFile).length);
    execFileSync(
      "pdftoppm",
      ["-png", "-singlefile", "-scale-to-x", "3840", "-scale-to-y", "2160", pdfFile, prefix],
      { stdio: "pipe" },
    );
    return;
  }
  if (process.platform === "darwin" && executableExists("qlmanage")) {
    const previewDir = path.join(tempRoot, "pdf-preview");
    const previewInput = path.join(previewDir, "input.pdf");
    fs.mkdirSync(previewDir, { recursive: true });
    fs.copyFileSync(pdfFile, previewInput);
    execFileSync("qlmanage", ["-t", "-s", "3840", "-o", previewDir, previewInput], { stdio: "pipe" });
    fs.renameSync(path.join(previewDir, "input.pdf.png"), outputFile);
    return;
  }
  fail("BMC PDF visual validation requires pdftoppm (poppler-utils)");
}

for (const filePath of [svgPath, pngPath, pdfPath, manifestPath]) {
  if (!fs.existsSync(absolute(filePath))) {
    fail(`required BMC render artifact is missing: ${filePath}`);
  }
}

const manifest = readJson(manifestPath);
const outputByFormat = new Map(manifest.outputs.map((output) => [output.format, output]));
for (const [format, filePath] of [
  ["svg", svgPath],
  ["png", pngPath],
  ["pdf", pdfPath],
]) {
  const output = outputByFormat.get(format);
  if (!output || output.path !== filePath) {
    fail(`BMC derived manifest is missing ${format} output`);
  }
  if (output.sha256 !== sha256File(filePath)) {
    fail(`BMC derived manifest hash is stale for ${filePath}`);
  }
}

const svg = fs.readFileSync(absolute(svgPath), "utf8");
const png = parsePng(absolute(pngPath), { retainRows: true });
if (png.width !== 3840 || png.height !== 2160) {
  fail(`BMC PNG has wrong dimensions: ${png.width}x${png.height}`);
}
if (png.nonWhitePixels < 100000) {
  fail("BMC PNG appears blank or nearly blank");
}
validateRasterFrameClearance(png, svg, "committed");

const pdfBytes = fs.readFileSync(absolute(pdfPath));
if (
  pdfBytes.subarray(0, 5).toString("utf8") !== "%PDF-"
  || !/%%EOF\s*$/u.test(pdfBytes.toString("latin1"))
  || pdfBytes.length < 1000
) {
  fail("BMC PDF does not have a canonical structure or sufficient content");
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-bmc-render-"));
try {
  const tempPng = path.join(tmpDir, "datacanvas-bmc.png");
  const tempPdf = path.join(tmpDir, "datacanvas-bmc.pdf");
  const renderEnv = { ...process.env, SOURCE_DATE_EPOCH: "0" };
  execFileSync("rsvg-convert", ["-w", "3840", "-h", "2160", "-f", "png", absolute(svgPath), "-o", tempPng], {
    env: renderEnv,
    stdio: "pipe",
  });
  execFileSync("rsvg-convert", ["-f", "pdf", absolute(svgPath), "-o", tempPdf], {
    env: renderEnv,
    stdio: "pipe",
  });
  const freshPng = parsePng(tempPng, { retainRows: true });
  if (freshPng.width !== png.width || freshPng.height !== png.height || freshPng.nonWhitePixels < 100000) {
    fail("fresh BMC PNG render from SVG has invalid dimensions or appears blank");
  }
  const coverageDelta = Math.abs(freshPng.nonWhitePixels - png.nonWhitePixels)
    / Math.max(freshPng.nonWhitePixels, png.nonWhitePixels);
  const spatialDelta = visualCoverageDelta(freshPng.coverageGrid, png.coverageGrid);
  if (coverageDelta > 0.2 || spatialDelta > 0.35) {
    fail("committed and fresh BMC PNG renders have materially different visible content coverage");
  }
  validatePerBlockVisualCorrespondence(freshPng, png, svg, "committed PNG");
  validateRasterFrameClearance(freshPng, svg, "fresh");
  const freshPdfBytes = fs.readFileSync(tempPdf);
  if (
    freshPdfBytes.subarray(0, 5).toString("utf8") !== "%PDF-"
    || !/%%EOF\s*$/u.test(freshPdfBytes.toString("latin1"))
    || freshPdfBytes.length < 1000
  ) {
    fail("fresh BMC PDF render from SVG is invalid");
  }
  const committedPdfPng = path.join(tmpDir, "committed-pdf.png");
  renderPdfToPng(absolute(pdfPath), committedPdfPng, tmpDir);
  const pdfPng = parsePng(committedPdfPng, { retainRows: true });
  if (pdfPng.width !== freshPng.width || pdfPng.height !== freshPng.height || pdfPng.nonWhitePixels < 100000) {
    fail("committed BMC PDF raster has invalid dimensions or appears blank");
  }
  validateRasterFrameClearance(pdfPng, svg, "committed PDF");
  validatePerBlockVisualCorrespondence(freshPng, pdfPng, svg, "committed PDF");
} catch (error) {
  if (error.status) {
    process.exit(error.status);
  }
  throw error;
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log("BMC render parity validation passed");
