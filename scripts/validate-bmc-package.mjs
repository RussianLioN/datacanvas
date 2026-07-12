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
  "docs/product/bmc/bmc-v0.2.md",
  "docs/product/bmc/source-map.md",
  "docs/product/bmc/text-alternative.md",
  packageManifestPath,
  "docs/product/bmc/evidence/visual-review.md",
  designerConsiliumPath,
  visualAcceptancePath,
  "docs/product/bmc/evidence/bmc-visual-design-philosophy.md",
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

const packageReadme = readText("docs/product/bmc/README.md");
for (const relativeTarget of [
  "bmc-v0.2.md",
  "text-alternative.md",
  "source/derived/datacanvas-bmc.svg",
  "source/derived/datacanvas-bmc.png",
  "source/derived/datacanvas-bmc.pdf",
  "source/derived/datacanvas-bmc.puml",
]) {
  if (!packageReadme.includes(`](${relativeTarget})`)) {
    fail(`BMC README is missing a clickable relative link: ${relativeTarget}`);
  }
}
for (const previewTarget of [
  "source/derived/datacanvas-bmc.svg",
  "source/derived/datacanvas-bmc.png",
]) {
  if (!new RegExp(`!\\[[^\\]]+\\]\\(${previewTarget.replaceAll(".", "\\.")}\\)`, "u").test(packageReadme)) {
    fail(`BMC README is missing an embedded preview: ${previewTarget}`);
  }
}
if (!/\[!\[[^\]]+\]\(source\/derived\/datacanvas-bmc\.png\)\]\(source\/derived\/datacanvas-bmc\.pdf\)/u.test(packageReadme)) {
  fail("BMC README must provide a clickable visual preview for the PDF render");
}
if (/`docs\/product\/bmc\//u.test(packageReadme) || /## Команды|validation-needs\.json/u.test(packageReadme)) {
  fail("BMC README must remain human navigation without raw repository paths or service instructions");
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
for (const historicalEvidence of [
  "docs/product/bmc/evidence/browser-smoke.png",
  "docs/product/bmc/evidence/pdf-raster-smoke.png",
]) {
  if (manifestPaths.has(historicalEvidence)) {
    fail(`historical BMC screenshot must not be presented as current package evidence: ${historicalEvidence}`);
  }
}

if (manifest.public_content_policy?.allowed_public_content !== "business_model_canvas_only") {
  fail("BMC package manifest must require public BMC surfaces to contain only business model canvas content");
}
for (const publicSurface of [
  "docs/product/bmc/bmc-v0.2.md",
  "docs/product/bmc/text-alternative.md",
  "docs/product/bmc/source/derived/datacanvas-bmc.svg",
  "docs/product/bmc/source/derived/datacanvas-bmc.png",
  "docs/product/bmc/source/derived/datacanvas-bmc.pdf",
  "docs/product/bmc/source/derived/datacanvas-bmc.puml",
]) {
  if (!manifest.public_content_policy.public_surfaces.includes(publicSurface)) {
    fail(`BMC package manifest public content policy is missing surface: ${publicSurface}`);
  }
}
for (const serviceStorage of [
  packageManifestPath,
  "docs/product/bmc/bmc-derived-manifest.json",
  "docs/product/bmc/bmc-validation-needs.json",
  "docs/product/bmc/evidence/bmc-visual-acceptance.json",
]) {
  if (!manifest.public_content_policy.service_information_storage.includes(serviceStorage)) {
    fail(`BMC package manifest public content policy is missing service storage: ${serviceStorage}`);
  }
}
for (const forbiddenClass of ["status", "methodology_notes", "model_boundary_summary", "source_refs", "validation_status", "hashes"]) {
  if (!manifest.public_content_policy.forbidden_public_information.includes(forbiddenClass)) {
    fail(`BMC package manifest public content policy is missing forbidden class: ${forbiddenClass}`);
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
const visualCheckById = new Map(visualAcceptance.checks.map((check) => [check.id, check]));
for (const checkId of [
  "svg_text_fit",
  "balanced_grid",
  "raster_frame_clearance",
  "per_block_render_correspondence",
  "pdf_visual_correspondence",
  "plantuml_layout",
]) {
  if (visualCheckById.get(checkId)?.status !== "passed") {
    fail(`BMC visual acceptance is missing passed geometry check: ${checkId}`);
  }
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
  "docs/product/bmc/text-alternative.md",
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
    "source_refs",
    "evidence_requests",
    "PresentationSpec",
    "trace",
    "validation companion",
    "companion JSON",
    "quality gates",
    "renderer",
    "gateway",
    "callback",
    "A2A",
    "MCP",
    "LLM",
    "SHA",
    "Статус:",
    "## Методика",
    "## Граница модели",
    "рабочая версия",
    "классическую схему Business Model Canvas",
    "внутреннего ИТ-продукта",
    "внешняя выручка",
    "служебные доказательства",
    "машинные артефакты",
    "требует отдельной проверки",
    "предметом отдельной проверки",
    "открытая зависимость",
    "открытые зависимости",
    "/Users/",
    "file://",
  ]) {
    if (text.includes(forbidden)) {
      fail(`public BMC package artifact contains forbidden marker ${forbidden}: ${publicPath}`);
    }
  }
}

for (const requiredValidator of [
  "npm run generate:bmc -- --check",
  "npm run validate:bmc-trace",
  "npm run validate:bmc-content-classic",
  "npm run validate:bmc-visual",
  "npm run validate:bmc-render-parity",
  "npm run validate:bmc-package",
  "npm run validate:data-leakage",
  "npm run validate:artifact-hashes",
]) {
  if (!manifest.validators.includes(requiredValidator)) {
    fail(`BMC package manifest is missing validator: ${requiredValidator}`);
  }
}

console.log("BMC package validation passed");
