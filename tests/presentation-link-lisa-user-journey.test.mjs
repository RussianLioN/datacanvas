import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const activeContractsPath = path.join(root, packagePath, "source/active-contracts.json");
const candidatePath = path.join(root, packagePath, "source/prototype-revision-candidate.json");
const ledgerPath = path.join(root, "docs/product/change-orders/co-2026-003-release-approval-ledger.json");
const generatorPath = path.join(root, "scripts/generate-presentation-link-lisa-user-journey.mjs");

const expectedFrameIds = Object.freeze([
  "lisa-materials-summary",
  "lisa-materials-full-reference",
  "lisa-presentation-order",
  "lisa-presentation-generating",
  "lisa-presentation-chat-list",
  "lisa-presentation-sent",
  "lisa-presentation-email",
  "lisa-presentation-slidedoc",
  "lisa-presentation-sber2025",
  "lisa-presentation-mag",
  "lisa-order-not-accepted",
  "lisa-delivery-delayed",
  "lisa-delivery-partial",
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function snapshotPublishedPackage() {
  const packageRoot = path.join(root, packagePath);
  return ["demo", "derived", "evidence"].map((relativePath) => {
    const target = path.join(packageRoot, relativePath);
    return {
      relativePath,
      exists: fs.existsSync(target),
      modifiedAtMs: fs.existsSync(target) ? fs.statSync(target).mtimeMs : null,
    };
  });
}

test("активный маршрут, кандидат и реестр приёмок используют одни 13 экранов", () => {
  const activeContracts = readJson(activeContractsPath);
  const candidate = readJson(candidatePath);
  const ledger = readJson(ledgerPath);

  assert.equal(activeContracts.route_id, "lisa-presentation-thirteen-screen-route");
  assert.deepEqual(activeContracts.active_state_ids, expectedFrameIds);
  assert.deepEqual(candidate.active_future_frame_ids, expectedFrameIds);
  assert.deepEqual(
    ledger.frame_approvals.map((frame) => frame.frame_id).sort(),
    expectedFrameIds.filter((frameId) => frameId !== "lisa-materials-summary" && frameId !== "lisa-presentation-order" && frameId !== "lisa-presentation-chat-list").sort(),
    "реестр должен содержать только десять отдельных приёмок, а не дублировать неизменённые кадры",
  );
});

test("обычная команда выпуска не содержит частичной HTML-публикации", () => {
  const source = fs.readFileSync(generatorPath, "utf8");

  assert.match(source, /runFullPackageReleaseTransaction\(/u);
  assert.match(source, /recoverFullPackageReleaseTransaction\(/u);
  assert.match(source, /assertReleaseState\(root\)/u);
  assert.doesNotMatch(source, /html-only|compareGeneratedHtml|publishSevenScreenPrototype|publishSevenScreenRuntime/u);
});

test("удалённый режим частичной HTML-публикации не меняет сохранённый пакет", () => {
  const before = snapshotPublishedPackage();
  const result = spawnSync(process.execPath, [generatorPath, "--html-only"], {
    cwd: root,
    encoding: "utf8",
  });
  const output = `${result.stdout}\n${result.stderr}`;

  assert.notEqual(result.status, 0, output);
  assert.match(output, /неизвестные аргументы: --html-only/u);
  assert.deepEqual(snapshotPublishedPackage(), before);
});

test("актуальный набор проверок опирается на договор поэкранной подготовки, а не на прежний 20-экранный маршрут", () => {
  const packageJson = readJson(path.join(root, "package.json"));
  const command = packageJson.scripts["validate:canonical-svg-frame-pipeline"];

  assert.equal(typeof command, "string");
  assert.match(command, /tests\/canonical-svg-frame-pipeline\.test\.mjs/u);
  assert.match(command, /tests\/lisa-prototype-draft\.test\.mjs/u);
  assert.match(command, /tests\/lisa-presentation-slidedoc-content-map\.test\.mjs/u);
  assert.doesNotMatch(command, /presentation-link-lisa-user-journey\.test\.mjs/u);
});
