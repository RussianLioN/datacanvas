import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const manifestPath = "artifacts/examples/renderer-regression-manifest.json";

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function sha256File(relativePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relativePath))).digest("hex");
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function requireFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    fail(`required file does not exist: ${relativePath}`);
  }
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const schema = readJson("schemas/renderer-regression-manifest.schema.json");
const manifest = readJson(manifestPath);
const validate = ajv.compile(schema);

if (!validate(manifest)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("renderer regression manifest does not match schema");
}

for (const sourcePath of manifest.source_paths) {
  requireFile(sourcePath);
}

const exportSmoke = readJson("artifacts/examples/export-smoke-manifest.json");
const exportHashesByPath = new Map(exportSmoke.outputs.map((output) => [output.path, output.sha256]));
const formats = new Set(manifest.cases.map((item) => item.format));
for (const requiredFormat of ["html", "pdf", "png"]) {
  if (!formats.has(requiredFormat)) {
    fail(`renderer regression is missing format: ${requiredFormat}`);
  }
}

for (const regressionCase of manifest.cases) {
  requireFile(regressionCase.path);
  const absolutePath = path.join(root, regressionCase.path);
  const bytes = fs.readFileSync(absolutePath);
  if (bytes.length < regressionCase.min_bytes) {
    fail(`renderer regression case is below min_bytes: ${regressionCase.id}`);
  }
  if (sha256File(regressionCase.path) !== regressionCase.sha256) {
    fail(`renderer regression hash mismatch: ${regressionCase.path}`);
  }

  if (regressionCase.format === "html") {
    const html = readText(regressionCase.path);
    if (!html.startsWith("<!doctype html>")) {
      fail("HTML regression output must start with <!doctype html>");
    }
    for (const required of ['data-source-spec-id="SPEC-minimal"', 'data-slide-id="SLIDE-001"', 'data-fact-ids="FACT-001"']) {
      if (!html.includes(required)) {
        fail(`HTML regression output is missing trace marker: ${required}`);
      }
    }
  }

  if (regressionCase.format === "pdf") {
    if (!bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
      fail("PDF regression output has invalid signature");
    }
    if (exportHashesByPath.get(regressionCase.path) !== regressionCase.sha256) {
      fail("PDF regression hash must match export smoke manifest");
    }
  }

  if (regressionCase.format === "png") {
    if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
      fail("PNG regression output has invalid signature");
    }
    if (exportHashesByPath.get(regressionCase.path) !== regressionCase.sha256) {
      fail("PNG regression hash must match export smoke manifest");
    }
  }
}

for (const gate of ["npm run validate:visual", "npm run validate:export", "npm run validate:export-smoke"]) {
  if (!manifest.required_gates.includes(gate)) {
    fail(`renderer regression manifest is missing gate: ${gate}`);
  }
}

console.log("renderer regression validation passed");
