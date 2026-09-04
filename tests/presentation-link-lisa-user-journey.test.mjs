import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const activeContractsPath = path.join(root, packagePath, "source/active-contracts.json");
const historicalContractsPath = path.join(root, packagePath, "source/historical-thirteen-screen-contracts.json");
const candidatePath = path.join(root, packagePath, "source/prototype-revision-candidate.json");
const ledgerPath = path.join(root, "docs/product/change-orders/co-2026-003-release-approval-ledger.json");
const generatorPath = path.join(root, "scripts/generate-presentation-link-lisa-user-journey.mjs");
const legacyValidatorPath = path.join(root, "scripts/validate-presentation-link-lisa-user-journey.mjs");
const legacyEvidenceUpdaterPath = path.join(root, "scripts/update-presentation-link-lisa-seven-screen-evidence.mjs");

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

test("активный маршрут использует 11 принятых кадров, а 13-кадровый контур сохранён только как история", () => {
  const activeContracts = readJson(activeContractsPath);
  const historicalContracts = readJson(historicalContractsPath);
  const candidate = readJson(candidatePath);
  const ledger = readJson(ledgerPath);

  assert.equal(activeContracts.route_id, "lisa-presentation-browser-native-eleven-screen-route");
  assert.deepEqual(activeContracts.active_state_ids, [
    "lisa-materials-full-reference",
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
  assert.equal(historicalContracts.status, "historical");
  assert.deepEqual(historicalContracts.former_active_state_ids, expectedFrameIds);
  assert.equal(historicalContracts.historical_policy.generator_eligible, false);
  assert.equal(historicalContracts.historical_policy.primary_navigation_allowed, false);
  assert.deepEqual(candidate.active_future_frame_ids, expectedFrameIds);
  assert.deepEqual(
    ledger.frame_approvals.map((frame) => frame.frame_id).sort(),
    activeContracts.active_state_ids.slice().sort(),
    "реестр должен содержать ровно 11 принятых кадров финального маршрута",
  );
});

test("историческая команда не может повторно опубликовать 13-кадровый пакет", () => {
  const source = fs.readFileSync(generatorPath, "utf8");

  assert.match(source, /исторический 13-кадровый генератор выведен из публикации/u);
  assert.match(source, /validate-co-2026-003-active-visual-route/u);
  assert.doesNotMatch(source, /runFullPackageReleaseTransaction|recoverFullPackageReleaseTransaction/u);
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

test("устаревший профиль проверки маршрута Лисы теперь является только защитой исторической границы", () => {
  const packageJson = readJson(path.join(root, "package.json"));
  const command = packageJson.scripts["validate:presentation-link-lisa-user-journey:ci"];

  assert.equal(typeof command, "string");
  assert.match(command, /validate:co-2026-003-active-visual-route/u);
  assert.doesNotMatch(command, /test:presentation-link-lisa-user-journey:browser/u);
  assert.doesNotMatch(command, /validate-presentation-link-lisa-user-journey\.mjs/u);
});

test("сохранённая команда проверки исторического маршрута проверяет действующий выпуск и ничего не пересобирает", () => {
  const result = spawnSync(process.execPath, [legacyValidatorPath, "--saved-only"], {
    cwd: root,
    encoding: "utf8",
  });
  const output = `${result.stdout}\n${result.stderr}`;

  assert.equal(result.status, 0, output);
  assert.match(output, /исторический 13-кадровый пакет не публикуется/i);
  assert.match(output, /browser-native/i);
});

test("официальные команды больше не публикуют старый browser-evidence контур", () => {
  const packageJson = readJson(path.join(root, "package.json"));
  const scripts = packageJson.scripts;

  assert.equal(scripts["generate:presentation-link-lisa-user-journey"], undefined);
  assert.equal(scripts["publish:presentation-link-lisa-user-journey"], undefined);
  assert.equal(scripts["update:presentation-link-lisa-user-journey:evidence"], undefined);
  assert.equal(scripts["check:presentation-link-lisa-user-journey:evidence"], undefined);
  assert.equal(scripts["test:presentation-link-lisa-user-journey:browser"], undefined);
  assert.doesNotMatch(JSON.stringify(scripts), /update-presentation-link-lisa-seven-screen-evidence\.mjs/u);
  assert.doesNotMatch(JSON.stringify(scripts), /presentation-link-lisa-seven-screen-prototype\.browser\.spec\.mjs/u);
});

test("прямой запуск исторического updater-а evidence блокируется до браузера и записи", () => {
  for (const args of [[], ["--check"]]) {
    const result = spawnSync(process.execPath, [legacyEvidenceUpdaterPath, ...args], {
      cwd: root,
      encoding: "utf8",
      timeout: 5000,
    });
    const output = `${result.stdout}\n${result.stderr}`;

    assert.notEqual(result.status, 0, output);
    assert.match(output, /исторический browser-evidence updater выведен из эксплуатации/u);
    assert.doesNotMatch(output, /playwright|webkit|браузерная проверка/iu);
  }
});
