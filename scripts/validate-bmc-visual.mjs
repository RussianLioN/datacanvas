import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { validateBmcPlantUmlLayout, validateBmcSvgLayout } from "./lib/bmc-visual-layout.mjs";

const root = process.cwd();
const svgPath = "docs/product/bmc/source/derived/datacanvas-bmc.svg";
const plantUmlPath = "docs/product/bmc/source/derived/datacanvas-bmc.puml";
const generatorPath = "scripts/generate-bmc-artifacts.mjs";
const expectedBlocks = ["B8", "B7", "B6", "B2", "B4", "B3", "B1", "B9", "B5"];

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function requireText(text, fragment, label = fragment) {
  if (!text.includes(fragment)) {
    fail(`BMC SVG is missing ${label}`);
  }
}

if (!fs.existsSync(absolute(svgPath))) {
  fail(`BMC SVG is missing: ${svgPath}`);
}

const svg = fs.readFileSync(absolute(svgPath), "utf8");
const plantUml = fs.readFileSync(absolute(plantUmlPath), "utf8");
const svgWithoutNamespace = svg.replaceAll("http://www.w3.org/2000/svg", "");

for (const fragment of [
  'data-role="bmc-root"',
  'role="img"',
  'width="3840"',
  'height="2160"',
  'viewBox="0 0 3840 2160"',
  "<title>DataCanvas Business Model Canvas</title>",
  "<desc>",
  'data-role="bmc-top-row"',
  'data-role="bmc-bottom-row"',
  'data-extra-role="bmc-cost-row"',
  'data-extra-role="bmc-value-stream-row"',
  'data-layout-slot="top-center"',
]) {
  requireText(svg, fragment);
}

for (const block of expectedBlocks) {
  requireText(svg, `data-block="${block}"`, `block marker ${block}`);
}

for (const issue of validateBmcSvgLayout(svg)) {
  fail(issue);
}
for (const issue of validateBmcPlantUmlLayout(plantUml)) {
  fail(issue);
}

for (let index = 1; index < expectedBlocks.length; index += 1) {
  const previous = svg.indexOf(`data-block="${expectedBlocks[index - 1]}"`);
  const current = svg.indexOf(`data-block="${expectedBlocks[index]}"`);
  if (previous === -1 || current === -1 || previous > current) {
    fail(`BMC SVG block order is not classical at ${expectedBlocks[index - 1]} -> ${expectedBlocks[index]}`);
  }
}

for (const forbidden of [
  "<script",
  "foreignObject",
  "<image",
  "http://",
  "https://",
  "file://",
  "/Users/",
  "data:",
  "не подтверждено",
  "допущение",
  "подтверждено",
  "unconfirmed",
  "assumption",
  "confidence",
  "…",
  "...",
  "data-truncated",
]) {
  if (svgWithoutNamespace.includes(forbidden)) {
    fail(`BMC SVG contains forbidden visual/export content: ${forbidden}`);
  }
}

const fontSizes = [...svg.matchAll(/font-size="(\d+)"/g)].map((match) => Number(match[1]));
if (fontSizes.length === 0) {
  fail("BMC SVG does not define font sizes");
}
const tooSmall = fontSizes.filter((size) => size < 24);
if (tooSmall.length > 0) {
  fail(`BMC SVG contains font smaller than 24px: ${tooSmall.join(", ")}`);
}

if (!svg.includes('fill="#111827"') || !svg.includes('fill="#26313f"')) {
  fail("BMC SVG does not expose expected high-contrast text colors");
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-bmc-svg-"));
try {
  execFileSync("rsvg-convert", ["-w", "3840", "-h", "2160", "-f", "png", absolute(svgPath), "-o", path.join(tmpDir, "check.png")], {
    stdio: "pipe",
  });
} catch (error) {
  const stderr = error.stderr ? String(error.stderr) : error.message;
  fail(`BMC SVG cannot be rendered by rsvg-convert: ${stderr}`);
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

const generator = fs.readFileSync(absolute(generatorPath), "utf8");
if (/wrap(?:Words|SvgText)\(.*\)\.slice\(/s.test(generator)) {
  fail("BMC generator appears to truncate wrapped visual text");
}

console.log("BMC visual validation passed");
