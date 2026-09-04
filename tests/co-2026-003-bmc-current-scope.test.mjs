import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const tracePath = new URL("docs/product/bmc/bmc-trace.v0.1.json", root);
const sourceLockPath = new URL("docs/product/bmc/source-lock.json", root);
const markdownPath = new URL("docs/product/bmc/bmc-v0.2.md", root);
const textAlternativePath = new URL("docs/product/bmc/text-alternative.md", root);

const activeBlocks = ["BMC-CLM-002", "BMC-CLM-003", "BMC-CLM-004", "BMC-CLM-006", "BMC-CLM-007", "BMC-CLM-008"];
const requiredFormats = ["PPTX", "PDF"];
const requiredContours = ["SIGMA", "OMEGA"];
const forbiddenActiveMeaning = [
  /защищ[её]нн(?:ое|ого|ом|ым)\s+хранилищ/iu,
  /хранилищ[ае][^.\n]*(?:PDF|презентац|результат)/iu,
  /ссылк[ау][^.\n]*(?:PDF|презентац|результат|пользовател)/iu,
  /уведомлени[ея][^.\n]*(?:ссылк|результат)/iu,
  /показ(?:ать|ывает|ывают|а)[^.\n]*ссылк/iu,
];

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function itemText(item) {
  return [item.statement, ...(item.bullets ?? []), ...(item.detail ?? []), ...(item.source_refs ?? [])].join("\n");
}

function publicTexts() {
  return [
    fs.readFileSync(markdownPath, "utf8"),
    fs.readFileSync(textAlternativePath, "utf8"),
  ].join("\n");
}

test("BMC текущего контура CO-2026-003 опирается на принятое дополнение владельца", () => {
  const sourceLock = readJson(sourceLockPath);
  const sourceIds = sourceLock.sources.map((source) => source.id);
  assert.ok(sourceIds.includes("SRC-DC-CO-2026-003-BT-AMENDMENT"), "нет источника принятого дополнения CO-2026-003");

  const trace = readJson(tracePath);
  for (const itemId of activeBlocks) {
    const item = trace.items.find((candidate) => candidate.item_id === itemId);
    assert.ok(item, `нет BMC-пункта ${itemId}`);
    assert.ok(
      item.source_refs.includes("SRC-DC-CO-2026-003-BT-AMENDMENT"),
      `${itemId} должен ссылаться на принятое дополнение CO-2026-003`,
    );
  }
});

test("BMC текущего контура говорит о вложениях PPTX/PDF в SIGMA и OMEGA", () => {
  const trace = readJson(tracePath);
  const combined = activeBlocks
    .map((itemId) => trace.items.find((item) => item.item_id === itemId))
    .filter(Boolean)
    .map(itemText)
    .join("\n");

  for (const value of [...requiredFormats, ...requiredContours]) {
    assert.match(combined, new RegExp(value, "u"), `BMC должен явно содержать ${value}`);
  }
  assert.match(combined, /электронн(?:ой|ую)\s+почт/iu, "BMC должен явно сохранять почтовую доставку");
  assert.match(combined, /вложени[яй]|прикладыва(?:ются|ет)/iu, "BMC должен описывать файлы как вложения письма");
});

test("BMC текущего контура не возвращает активную ссылку, хранение или уведомление по ссылке", () => {
  const trace = readJson(tracePath);
  const combined = activeBlocks
    .map((itemId) => trace.items.find((item) => item.item_id === itemId))
    .filter(Boolean)
    .map(itemText)
    .join("\n");

  for (const rule of forbiddenActiveMeaning) {
    assert.doesNotMatch(combined, rule, `BMC trace вернул устаревший активный смысл: ${rule}`);
  }

  const generatedPublicText = publicTexts();
  for (const rule of forbiddenActiveMeaning) {
    assert.doesNotMatch(generatedPublicText, rule, `публичный BMC вернул устаревший активный смысл: ${rule}`);
  }
});
