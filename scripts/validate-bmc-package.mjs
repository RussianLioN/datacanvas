import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const packageManifestPath = "docs/product/bmc/manifest.json";
const visualAcceptancePath = "docs/product/bmc/evidence/bmc-visual-acceptance.json";
const designerConsiliumPath = "docs/product/bmc/evidence/designer-consilium.json";

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

const requiredFiles = [
  "docs/product/bmc/README.md",
  "docs/product/bmc/source-map.md",
  "docs/product/bmc/text-alternative.md",
  packageManifestPath,
  "docs/product/bmc/evidence/visual-review.md",
  designerConsiliumPath,
  visualAcceptancePath,
  "docs/product/bmc/evidence/bmc-visual-design-philosophy.md",
  "docs/product/bmc/evidence/browser-smoke.png",
  "docs/product/bmc/evidence/pdf-raster-smoke.png",
  "docs/product/bmc/source/derived/datacanvas-bmc.svg",
  "docs/product/bmc/source/derived/datacanvas-bmc.png",
  "docs/product/bmc/source/derived/datacanvas-bmc.pdf",
  "docs/product/bmc/source/derived/datacanvas-bmc.puml",
];

for (const filePath of requiredFiles) {
  if (!fs.existsSync(absolute(filePath))) {
    fail(`required BMC package file is missing: ${filePath}`);
  }
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

for (const [schemaPath, dataPath] of [
  ["schemas/bmc-package-manifest.schema.json", packageManifestPath],
  ["schemas/bmc-visual-acceptance.schema.json", visualAcceptancePath],
]) {
  const validate = ajv.compile(readJson(schemaPath));
  const data = readJson(dataPath);
  if (!validate(data)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${dataPath} does not match ${schemaPath}`);
  }
}

const manifest = readJson(packageManifestPath);
const manifestPaths = new Set(manifest.artifacts.map((artifact) => artifact.path));
for (const filePath of requiredFiles.filter((item) => item !== packageManifestPath)) {
  if (!manifestPaths.has(filePath)) {
    fail(`BMC package manifest does not list required file: ${filePath}`);
  }
}

for (const artifact of manifest.artifacts) {
  if (!fs.existsSync(absolute(artifact.path))) {
    fail(`BMC package manifest references missing file: ${artifact.path}`);
  }
  const actualHash = sha256File(artifact.path);
  if (artifact.sha256 !== actualHash) {
    fail(`BMC package manifest hash is stale: ${artifact.path}`);
  }
}

const visualAcceptance = readJson(visualAcceptancePath);
if (visualAcceptance.canonical_visual_path !== "docs/product/bmc/source/derived/datacanvas-bmc.svg") {
  fail("BMC visual acceptance points to the wrong canonical visual source");
}

const designerConsilium = readJson(designerConsiliumPath);
if (designerConsilium.roles.length < 5) {
  fail("designer consilium must include at least 5 design/review roles");
}
if (designerConsilium.severity_summary.blocker !== 0 || designerConsilium.severity_summary.major !== 0) {
  fail("designer consilium contains blocker or major findings");
}

for (const publicPath of [
  "docs/product/bmc/bmc-v0.2.md",
  "docs/product/bmc/source/derived/datacanvas-bmc.svg",
  "docs/product/bmc/source/derived/datacanvas-bmc.puml",
]) {
  const text = readText(publicPath).replaceAll("http://www.w3.org/2000/svg", "");
  for (const forbidden of [
    "не подтверждено",
    "допущение",
    "подтверждено",
    "unconfirmed",
    "assumption",
    "confirmed",
    "Confidence",
    "Evidence Requests",
    "Open Questions",
    "Source refs",
    "/Users/",
    "file://",
  ]) {
    if (text.includes(forbidden)) {
      fail(`public BMC package artifact contains forbidden marker ${forbidden}: ${publicPath}`);
    }
  }
}

console.log("BMC package validation passed");
