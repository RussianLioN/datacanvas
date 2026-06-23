import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const manifestPath = "artifacts/examples/export-smoke-manifest.json";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function sha256File(relativePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relativePath))).digest("hex");
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

const manifest = readJson(manifestPath);
const schema = readJson("schemas/export-smoke-manifest.schema.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validateManifest = ajv.compile(schema);
if (!validateManifest(manifest)) {
  console.error(JSON.stringify(validateManifest.errors, null, 2));
  fail("export smoke manifest does not match schema");
}

if (!fs.existsSync(path.join(root, manifest.source_html_path))) {
  fail(`source HTML does not exist: ${manifest.source_html_path}`);
}

const formats = new Set(manifest.outputs.map((output) => output.format));
for (const requiredFormat of ["pdf", "png"]) {
  if (!formats.has(requiredFormat)) {
    fail(`export smoke manifest is missing ${requiredFormat} output`);
  }
}

for (const output of manifest.outputs) {
  const absolutePath = path.join(root, output.path);
  if (!fs.existsSync(absolutePath)) {
    fail(`export smoke output does not exist: ${output.path}`);
  }

  if (sha256File(output.path) !== output.sha256) {
    fail(`export smoke hash mismatch: ${output.path}`);
  }

  const bytes = fs.readFileSync(absolutePath);
  if (output.format === "pdf" && !bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    fail("PDF smoke output has invalid signature");
  }

  if (output.format === "png" && bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    fail("PNG smoke output has invalid signature");
  }
}

for (const gate of ["npm run validate:export", "npm run validate:visual"]) {
  if (!manifest.required_gates.includes(gate)) {
    fail(`export smoke manifest is missing required gate: ${gate}`);
  }
}

console.log("export smoke validation passed");
