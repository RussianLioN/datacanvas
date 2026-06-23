import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import zlib from "node:zlib";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const manifestPath = "docs/product/ux/export-png-pixel-smoke.json";

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function sha256File(relativePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relativePath))).digest("hex");
}

function readChunks(bytes) {
  const chunks = [];
  let offset = 8;
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) {
      fail("PNG chunk is truncated");
    }
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > bytes.length) {
      fail(`PNG chunk data is truncated: ${type}`);
    }
    chunks.push({ type, data: bytes.subarray(dataStart, dataEnd) });
    offset = dataEnd + 4;
  }
  return chunks;
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const manifest = readJson(manifestPath);
const schema = readJson("schemas/export-png-pixel-smoke.schema.json");
const validate = ajv.compile(schema);
if (!validate(manifest)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("export PNG pixel smoke manifest does not match schema");
}

const exportSmoke = readJson(manifest.export_smoke_manifest_path);
const pngOutput = exportSmoke.outputs.find((output) => output.format === "png");
if (!pngOutput) {
  fail("export smoke manifest has no PNG output");
}
if (pngOutput.path !== manifest.png_path) {
  fail("pixel smoke manifest and export smoke manifest point to different PNG paths");
}
if (sha256File(manifest.png_path) !== pngOutput.sha256) {
  fail("PNG hash mismatch against export smoke manifest");
}

const bytes = fs.readFileSync(path.join(root, manifest.png_path));
if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
  fail("PNG signature is invalid");
}

const chunks = readChunks(bytes);
const chunkTypes = chunks.map((chunk) => chunk.type);
for (const requiredType of ["IHDR", "IDAT", "IEND"]) {
  if (!chunkTypes.includes(requiredType)) {
    fail(`PNG is missing required chunk: ${requiredType}`);
  }
}
if (chunkTypes[0] !== "IHDR" || chunkTypes.at(-1) !== "IEND") {
  fail("PNG chunk order must start with IHDR and end with IEND");
}

const ihdr = chunks.find((chunk) => chunk.type === "IHDR").data;
const width = ihdr.readUInt32BE(0);
const height = ihdr.readUInt32BE(4);
const bitDepth = ihdr[8];
const colorType = ihdr[9];

if (width !== manifest.expected_png.width || height !== manifest.expected_png.height) {
  fail(`PNG dimensions mismatch: got ${width}x${height}`);
}
if (bitDepth !== manifest.expected_png.bit_depth || colorType !== manifest.expected_png.color_type) {
  fail(`PNG format mismatch: bit_depth=${bitDepth}, color_type=${colorType}`);
}

const idat = Buffer.concat(chunks.filter((chunk) => chunk.type === "IDAT").map((chunk) => chunk.data));
let raw;
try {
  raw = zlib.inflateSync(idat);
} catch (error) {
  fail(`PNG IDAT cannot be inflated: ${error.message}`);
}

const expectedPixel = manifest.expected_png.first_pixel_rgba;
const bytesPerPixel = 4;
const rowLength = 1 + width * bytesPerPixel;
if (raw.length !== rowLength * height) {
  fail(`PNG raw scanline length mismatch: got ${raw.length}`);
}
if (raw[0] !== 0) {
  fail(`PNG smoke fixture must use filter type 0, got ${raw[0]}`);
}
const pixel = Array.from(raw.subarray(1, 5));
if (pixel.some((value, index) => value !== expectedPixel[index])) {
  fail(`PNG first pixel mismatch: got [${pixel.join(", ")}]`);
}

for (const command of ["npm run validate:export-smoke", "npm run validate:export-png-pixel-smoke", "npm test"]) {
  if (!manifest.validation_commands.includes(command)) {
    fail(`pixel smoke manifest is missing validation command: ${command}`);
  }
}

console.log("export PNG pixel smoke validation passed");
