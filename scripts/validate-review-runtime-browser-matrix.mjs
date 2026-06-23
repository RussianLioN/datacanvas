import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const manifestPath = "docs/product/ux/review-runtime-browser-matrix.json";

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
const schema = readJson("schemas/review-runtime-browser-matrix.schema.json");
const validate = ajv.compile(schema);

if (!validate(manifest)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("review runtime browser matrix does not match schema");
}

requireFile("docs/product/ux/review-runtime-browser-matrix.md");
requireFile(manifest.html_path);

const html = readText(manifest.html_path);

if (!html.includes('<meta name="viewport" content="width=device-width, initial-scale=1">')) {
  fail("interactive runtime must include responsive viewport meta");
}
if (!html.includes("@media (max-width: 820px)")) {
  fail("interactive runtime must include mobile breakpoint");
}
if (!html.includes("max-width: 1180px")) {
  fail("interactive runtime must constrain main layout width");
}
if (!html.includes("header, .grid { display: block; }")) {
  fail("interactive runtime must switch grid/header layout on mobile");
}
if (!html.includes("flex-wrap: wrap")) {
  fail("interactive runtime toolbar must support wrapping");
}
if (!html.includes("word-break: break-word")) {
  fail("interactive runtime JSON output must wrap long content");
}

for (const controlId of manifest.required_controls) {
  if (!html.includes(`id="${controlId}"`)) {
    fail(`interactive runtime is missing required control: ${controlId}`);
  }
}

const viewportClasses = new Set(manifest.viewport_targets.map((target) => target.class));
for (const requiredClass of ["mobile", "tablet", "desktop"]) {
  if (!viewportClasses.has(requiredClass)) {
    fail(`browser matrix is missing viewport class: ${requiredClass}`);
  }
}

for (const command of ["npm run validate:review-runtime-browser-matrix", "npm run validate:review-runtime-interactive", "npm test"]) {
  if (!manifest.validation_commands.includes(command)) {
    fail(`browser matrix is missing validation command: ${command}`);
  }
}

const guide = readText("docs/product/ux/review-runtime-browser-matrix.md");
for (const requiredText of ["mobile-small", "tablet", "desktop", "Actor ID", "Real UAT"]) {
  if (!guide.includes(requiredText)) {
    fail(`browser matrix guide is missing required text: ${requiredText}`);
  }
}

console.log("review runtime browser matrix validation passed");
