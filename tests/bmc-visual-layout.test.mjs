import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  validateBmcPlantUmlLayout,
  validateBmcSvgLayout,
} from "../scripts/lib/bmc-visual-layout.mjs";

const svgPath = "docs/product/bmc/source/derived/datacanvas-bmc.svg";
const plantUmlPath = "docs/product/bmc/source/derived/datacanvas-bmc.puml";

test("committed BMC SVG keeps text inside balanced frames", () => {
  const issues = validateBmcSvgLayout(fs.readFileSync(svgPath, "utf8"));
  assert.deepEqual(issues, []);
});

test("BMC SVG layout rejects text below a frame", () => {
  const svg = fs.readFileSync(svgPath, "utf8").replace(/(<tspan x="42" y=")\d+("[^>]*>)/, "$19999$2");
  const issues = validateBmcSvgLayout(svg);
  assert.ok(issues.some((issue) => issue.includes("exceeds vertical frame bounds")));
});

test("BMC SVG layout rejects an uneven grid gap", () => {
  const svg = fs.readFileSync(svgPath, "utf8").replace(
    'data-block="B2" data-layout-slot="top-center" transform="translate(1510 280)"',
    'data-block="B2" data-layout-slot="top-center" transform="translate(1520 280)"',
  );
  const issues = validateBmcSvgLayout(svg);
  assert.ok(issues.some((issue) => issue.includes("top-row gaps")));
});

test("committed BMC PlantUML keeps bounded labels and a complete grid", () => {
  const issues = validateBmcPlantUmlLayout(fs.readFileSync(plantUmlPath, "utf8"));
  assert.deepEqual(issues, []);
});

test("BMC PlantUML layout rejects an overlong label line", () => {
  const source = fs.readFileSync(plantUmlPath, "utf8");
  const oversized = source.replace(
    "<b>8. Ключевые партнеры</b>",
    `<b>8. ${"Очень длинная строка ".repeat(8).trim()}</b>`,
  );
  const issues = validateBmcPlantUmlLayout(oversized);
  assert.ok(issues.some((issue) => issue.includes("label line exceeds")));
});
