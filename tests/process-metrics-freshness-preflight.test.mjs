import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("полный набор проверок сначала проверяет свежесть снимка процессных метрик", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const testCommand = packageJson.scripts.test;

  assert.ok(
    testCommand.startsWith("npm run validate:process-metrics-snapshot && npm run generate:golden"),
    "npm test должен проверять снимок метрик до изменяющей генерации",
  );
});

test("проверка GitHub сначала проверяет свежесть снимка процессных метрик", () => {
  const workflow = fs.readFileSync(path.join(root, ".github/workflows/docs-check.yml"), "utf8");
  const preflightIndex = workflow.indexOf("npm run validate:process-metrics-snapshot");
  const qualityGateIndex = workflow.indexOf("run: npm test");

  assert.ok(preflightIndex >= 0, "в GitHub Actions отсутствует ранняя проверка снимка метрик");
  assert.ok(qualityGateIndex >= 0, "в GitHub Actions отсутствует полный набор проверок");
  assert.ok(preflightIndex < qualityGateIndex, "ранняя проверка должна выполняться до npm test");
});
