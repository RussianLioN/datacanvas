import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const validatorPath = path.join(root, "scripts/validate-co-2026-003-active-visual-route.mjs");
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const activeRoutePath = `${packagePath}/source/active-contracts.json`;
const expectedFrameIds = Object.freeze([
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

function readJson(relativePath, targetRoot = root) {
  return JSON.parse(fs.readFileSync(path.join(targetRoot, relativePath), "utf8"));
}

function writeJson(targetRoot, relativePath, value) {
  const target = path.join(targetRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function copyFixtureFile(targetRoot, relativePath) {
  const source = path.join(root, relativePath);
  const target = path.join(targetRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function createFixture() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "co-2026-003-active-route-"));
  for (const relativePath of [
    activeRoutePath,
    `${packagePath}/source/schemas/active-contracts.schema.json`,
    `${packagePath}/source/historical-thirteen-screen-contracts.json`,
    `${packagePath}/source/schemas/historical-thirteen-screen-contracts.schema.json`,
    `${packagePath}/source/browser-native-phone-prototype/browser-native-phone-prototype-contract.json`,
    `${packagePath}/source/schemas/browser-native-phone-prototype-contract.schema.json`,
    `${packagePath}/source/browser-native-phone-prototype/owner-final-approval.json`,
    `${packagePath}/candidate-evidence/browser-native-phone-prototype/manifest.json`,
    "docs/product/change-orders/co-2026-003-release-approval-ledger.json",
    "docs/release/co-2026-003-browser-native-phone-prototype-release-evidence.json",
  ]) {
    copyFixtureFile(fixtureRoot, relativePath);
  }
  return fixtureRoot;
}

function runValidator(targetRoot = root) {
  return spawnSync(process.execPath, [validatorPath, "--root", targetRoot], {
    cwd: root,
    encoding: "utf8",
  });
}

test("активный визуальный маршрут — только принятый browser-native путь из 11 кадров", () => {
  const result = runValidator();
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

  const activeRoute = readJson(activeRoutePath);
  assert.equal(activeRoute.route_id, "lisa-presentation-browser-native-eleven-screen-route");
  assert.deepEqual(activeRoute.active_state_ids, expectedFrameIds);
});

test("исторический 13-кадровый маршрут и дрейф порядка блокируют активный выпуск", () => {
  const fixtureRoot = createFixture();
  try {
    const route = readJson(activeRoutePath, fixtureRoot);
    route.active_state_ids = [
      "lisa-materials-summary",
      ...route.active_state_ids.slice(1),
    ];
    writeJson(fixtureRoot, activeRoutePath, route);

    let result = runValidator(fixtureRoot);
    assert.notEqual(result.status, 0, "исторический кадр не может попасть в активный маршрут");
    assert.match(`${result.stdout}\n${result.stderr}`, /active_state_ids|lisa-materials-summary|11 кадр/u);

    route.active_state_ids = [...expectedFrameIds].reverse();
    writeJson(fixtureRoot, activeRoutePath, route);
    result = runValidator(fixtureRoot);
    assert.notEqual(result.status, 0, "порядок принятых кадров не может меняться");
    assert.match(`${result.stdout}\n${result.stderr}`, /порядок|маршрут/u);
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test("историческая запись 13-кадрового маршрута проверяется собственной схемой", () => {
  const fixtureRoot = createFixture();
  try {
    const historicalPath = `${packagePath}/source/historical-thirteen-screen-contracts.json`;
    const historical = readJson(historicalPath, fixtureRoot);
    historical.unexpected_active_reactivation_hint = true;
    writeJson(fixtureRoot, historicalPath, historical);

    const result = runValidator(fixtureRoot);
    assert.notEqual(result.status, 0, "лишние поля исторической записи должны блокировать активный выпуск");
    assert.match(`${result.stdout}\n${result.stderr}`, /историческ|additionalProperties|unexpected_active_reactivation_hint/u);
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});
