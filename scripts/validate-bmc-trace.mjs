import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const tracePath = "docs/product/bmc/bmc-trace.v0.1.json";
const derivedManifestPath = "docs/product/bmc/bmc-derived-manifest.json";

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function sha256File(relativePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(absolute(relativePath))).digest("hex");
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function requireFile(relativePath) {
  if (!fs.existsSync(absolute(relativePath))) {
    fail(`required BMC file is missing: ${relativePath}`);
  }
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

requireFile(tracePath);
requireFile(derivedManifestPath);

for (const [schemaPath, dataPath] of [
  ["schemas/bmc-trace.schema.json", tracePath],
  ["schemas/bmc-derived-manifest.schema.json", derivedManifestPath],
]) {
  const validate = ajv.compile(readJson(schemaPath));
  const data = readJson(dataPath);
  if (!validate(data)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${dataPath} does not match ${schemaPath}`);
  }
}

const trace = readJson(tracePath);
const sourceLock = readJson(trace.source_lock_path);
const manifest = readJson(derivedManifestPath);
const expectedBlocks = ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9"];
const blockIds = new Set(trace.blocks.map((block) => block.id));
const itemIds = new Set(trace.items.map((item) => item.item_id));
const sourceIds = new Set(sourceLock.sources.map((source) => source.id));

for (const block of expectedBlocks) {
  if (!blockIds.has(block)) {
    fail(`BMC trace is missing block: ${block}`);
  }
  if (!trace.items.some((item) => item.block === block)) {
    fail(`BMC trace is missing item for block: ${block}`);
  }
}

for (const item of trace.items) {
  for (const sourceRef of item.source_refs) {
    if (!sourceIds.has(sourceRef)) {
      fail(`BMC item references unknown source ref ${sourceRef}: ${item.item_id}`);
    }
  }
  if (item.status === "confirmed" && item.source_refs.length === 0 && item.evidence_ids.length === 0) {
    fail(`confirmed BMC item has no source or evidence: ${item.item_id}`);
  }
}

for (const claim of trace.claims) {
  if (!itemIds.has(claim.item_id)) {
    fail(`claim references unknown item: ${claim.claim_id}`);
  }
}

if (trace.evidence_requests.length === 0) {
  fail("BMC trace must expose evidence requests");
}

const traceHash = sha256File(tracePath);
if (manifest.source_trace_path !== tracePath) {
  fail("BMC derived manifest points to the wrong source trace");
}
if (manifest.source_trace_sha256 !== traceHash) {
  fail("BMC derived manifest source hash is stale");
}

for (const output of manifest.outputs) {
  requireFile(output.path);
  const actualHash = sha256File(output.path);
  if (output.sha256 !== actualHash) {
    fail(`BMC derived output hash is stale: ${output.path}`);
  }
}

const markdownOutput = manifest.outputs.find((output) => output.format === "markdown");
const pumlOutput = manifest.outputs.find((output) => output.format === "plantuml");
const svgOutput = manifest.outputs.find((output) => output.format === "svg");
const pngOutput = manifest.outputs.find((output) => output.format === "png");
const pdfOutput = manifest.outputs.find((output) => output.format === "pdf");
const validationNeedsOutput = manifest.outputs.find((output) => output.format === "validation_needs_json");

if (!markdownOutput || !pumlOutput || !svgOutput || !pngOutput || !pdfOutput || !validationNeedsOutput) {
  fail("BMC derived manifest must include markdown, plantuml, svg, png, pdf and validation-needs JSON outputs");
}

const markdown = readText(markdownOutput.path);
for (const forbidden of ["не подтверждено", "допущение", "подтверждено", "Evidence Requests", "Open Questions", "Confidence", "Source refs"]) {
  if (markdown.includes(forbidden)) {
    fail(`clean BMC markdown contains validation metadata: ${forbidden}`);
  }
}

const puml = readText(pumlOutput.path);
for (const forbidden of ["!include", "!import", "!theme", "load_json", "%getenv", "не подтверждено", "допущение", "подтверждено"]) {
  if (puml.includes(forbidden)) {
    fail(`BMC PlantUML contains forbidden directive: ${forbidden}`);
  }
}

const svg = readText(svgOutput.path);
const svgWithoutNamespace = svg.replaceAll("http://www.w3.org/2000/svg", "");
for (const forbidden of ["<script", "foreignObject", "http://", "https://", "data:", "не подтверждено", "допущение", "подтверждено", "confidence", "unconfirmed"]) {
  if (svgWithoutNamespace.includes(forbidden)) {
    fail(`BMC SVG contains forbidden content: ${forbidden}`);
  }
}
if (!svg.includes('data-block="B1"') || !svg.includes('data-block="B9"')) {
  fail("BMC SVG does not expose expected BMC block markers");
}

const pngBytes = fs.readFileSync(absolute(pngOutput.path));
if (pngBytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
  fail("BMC PNG preview does not have a PNG signature");
}

const pdfBytes = fs.readFileSync(absolute(pdfOutput.path));
if (pdfBytes.subarray(0, 5).toString("utf8") !== "%PDF-") {
  fail("BMC PDF render does not have a PDF signature");
}

const validationNeedsSchema = readJson("schemas/bmc-validation-needs.schema.json");
const validationNeeds = readJson(validationNeedsOutput.path);
const validateNeeds = ajv.compile(validationNeedsSchema);
if (!validateNeeds(validationNeeds)) {
  console.error(JSON.stringify(validateNeeds.errors, null, 2));
  fail(`${validationNeedsOutput.path} does not match schemas/bmc-validation-needs.schema.json`);
}

const expectedNeeds = trace.items.filter((item) => item.status !== "confirmed").map((item) => item.item_id);
const actualNeeds = new Set(validationNeeds.items.map((item) => item.item_id));
for (const itemId of expectedNeeds) {
  if (!actualNeeds.has(itemId)) {
    fail(`validation-needs JSON is missing BMC item: ${itemId}`);
  }
}

console.log("BMC trace validation passed");
