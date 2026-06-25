import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const manifestPath = "docs/product/ux/review-runtime-browser-smoke.json";

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

function requireFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    fail(`required file does not exist: ${relativePath}`);
  }
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const manifest = readJson(manifestPath);
const schema = readJson("schemas/review-runtime-browser-smoke.schema.json");
const validate = ajv.compile(schema);

if (!validate(manifest)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("review runtime browser smoke does not match schema");
}

requireFile("docs/product/ux/review-runtime-browser-smoke.md");
requireFile(manifest.html_path);
requireFile(manifest.browser_matrix_path);

const matrix = readJson(manifest.browser_matrix_path);
const interactive = readJson("docs/product/ux/review-runtime-interactive.json");
const html = readText(manifest.html_path);

if (matrix.html_path !== manifest.html_path) {
  fail("browser smoke and browser matrix must target the same HTML path");
}

const viewportClasses = new Set(matrix.viewport_targets.map((target) => target.class));
for (const requiredClass of ["mobile", "tablet", "desktop"]) {
  if (!viewportClasses.has(requiredClass)) {
    fail(`browser matrix is missing viewport class for smoke gate: ${requiredClass}`);
  }
}

if (!html.includes('<meta name="viewport" content="width=device-width, initial-scale=1">')) {
  fail("browser smoke target must include responsive viewport meta");
}

for (const id of manifest.required_dom_ids) {
  if (!html.includes(`id="${id}"`)) {
    fail(`browser smoke target is missing DOM id: ${id}`);
  }
}

for (const controlId of matrix.required_controls) {
  if (!manifest.required_dom_ids.includes(controlId)) {
    fail(`browser smoke manifest must include matrix control id: ${controlId}`);
  }
}

for (const field of interactive.persisted_fields) {
  if (!html.includes(field)) {
    fail(`browser smoke target is missing persisted field marker: ${field}`);
  }
}

for (const rule of manifest.required_css_rules) {
  if (rule === "meta viewport") {
    continue;
  }
  if (!html.includes(rule)) {
    fail(`browser smoke target is missing required CSS rule: ${rule}`);
  }
}

for (const behavior of manifest.required_script_behaviors) {
  if (!html.includes(behavior)) {
    fail(`browser smoke target is missing required script behavior: ${behavior}`);
  }
}

if (!html.includes('download="review-runtime-state-export.json"')) {
  fail("browser smoke target must expose runtime state JSON download");
}
if (!html.includes('data-review-state="draft"') || !html.includes('data-export-enabled="false"')) {
  fail("browser smoke target must expose initial review/export data attributes");
}
if (!html.includes("URL.createObjectURL")) {
  fail("browser smoke target must prepare downloadable JSON through Blob URL");
}

for (const patternText of manifest.forbidden_patterns) {
  const found = patternText === "https?://"
    ? /https?:\/\//i.test(html)
    : html.toLowerCase().includes(patternText.toLowerCase());
  if (found) {
    fail(`browser smoke target contains forbidden pattern: ${patternText}`);
  }
}

for (const command of [
  "npm run validate:review-runtime-browser-smoke",
  "npm run validate:review-runtime-browser-matrix",
  "npm run validate:review-runtime-interactive",
  "npm test",
]) {
  if (!manifest.validation_commands.includes(command)) {
    fail(`browser smoke manifest is missing validation command: ${command}`);
  }
}

const guide = readText("docs/product/ux/review-runtime-browser-smoke.md");
for (const requiredText of ["static browser smoke", "pixel screenshot", "real UAT", "viewport targets"]) {
  if (!guide.toLowerCase().includes(requiredText.toLowerCase())) {
    fail(`browser smoke guide is missing required text: ${requiredText}`);
  }
}

console.log("review runtime browser smoke validation passed");
