import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import zlib from "node:zlib";

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

function parsePng(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    fail(`not a PNG file: ${filePath}`);
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];

  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
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
      break;
    }
    offset += 12 + length;
  }

  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const inflated = zlib.inflateSync(Buffer.concat(idat));
  const rows = [];
  let inputOffset = 0;
  let nonWhitePixels = 0;
  const pixelHash = crypto.createHash("sha256");

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
      if (r < 245 || g < 245 || b < 245) {
        nonWhitePixels += 1;
      }
    }
    pixelHash.update(row);
    rows.push(row);
  }

  return { width, height, nonWhitePixels, pixelSha256: pixelHash.digest("hex") };
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

const png = parsePng(absolute(pngPath));
if (png.width !== 3840 || png.height !== 2160) {
  fail(`BMC PNG has wrong dimensions: ${png.width}x${png.height}`);
}
if (png.nonWhitePixels < 100000) {
  fail("BMC PNG appears blank or nearly blank");
}

const pdfBytes = fs.readFileSync(absolute(pdfPath));
if (pdfBytes.subarray(0, 5).toString("utf8") !== "%PDF-") {
  fail("BMC PDF does not have a PDF signature");
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
  if (!fs.readFileSync(absolute(pngPath)).equals(fs.readFileSync(tempPng))) {
    const freshPng = parsePng(tempPng);
    const nonWhiteDelta = Math.abs(png.nonWhitePixels - freshPng.nonWhitePixels);
    const nonWhiteTolerance = Math.max(5000, Math.floor(png.nonWhitePixels * 0.05));
    if (png.width !== freshPng.width || png.height !== freshPng.height || nonWhiteDelta > nonWhiteTolerance) {
      fail("BMC PNG visual coverage does not match fresh rsvg-convert output from SVG");
    }
  }
  const freshPdfBytes = fs.readFileSync(tempPdf);
  if (freshPdfBytes.subarray(0, 5).toString("utf8") !== "%PDF-" || freshPdfBytes.length < 1000) {
    fail("fresh BMC PDF render from SVG is invalid");
  }
  if (!pdfBytes.equals(freshPdfBytes)) {
    fail("BMC PDF bytes do not match fresh deterministic rsvg-convert output from SVG");
  }
} catch (error) {
  if (error.status) {
    process.exit(error.status);
  }
  throw error;
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log("BMC render parity validation passed");
