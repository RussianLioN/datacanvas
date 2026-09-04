import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  currentCo2026003BmcItemIds,
  currentCo2026003BmcSource,
  currentCo2026003ForbiddenActiveMeaning,
} from "../scripts/lib/bmc-current-scope-policy.mjs";

const root = new URL("../", import.meta.url);
const tracePath = new URL("docs/product/bmc/bmc-trace.v0.1.json", root);
const sourceLockPath = new URL("docs/product/bmc/source-lock.json", root);
const markdownPath = new URL("docs/product/bmc/bmc-v0.2.md", root);
const textAlternativePath = new URL("docs/product/bmc/text-alternative.md", root);
const derivedManifestPath = new URL("docs/product/bmc/bmc-derived-manifest.json", root);
const packageManifestPath = new URL("docs/product/bmc/manifest.json", root);
const validationNeedsPath = new URL("docs/product/bmc/bmc-validation-needs.json", root);
const visualReviewPath = new URL("docs/product/bmc/evidence/visual-review.md", root);

const activeBlocks = currentCo2026003BmcItemIds;
const requiredFormats = ["PPTX", "PDF"];
const requiredContours = ["SIGMA", "OMEGA"];

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
  assert.ok(sourceIds.includes(currentCo2026003BmcSource), "нет источника принятого дополнения CO-2026-003");

  const trace = readJson(tracePath);
  for (const itemId of activeBlocks) {
    const item = trace.items.find((candidate) => candidate.item_id === itemId);
    const claim = trace.claims.find((candidate) => candidate.claim_id === itemId);
    assert.ok(item, `нет BMC-пункта ${itemId}`);
    assert.ok(claim, `нет технического утверждения BMC ${itemId}`);
    assert.ok(
      item.source_refs.includes(currentCo2026003BmcSource),
      `${itemId} должен ссылаться на принятое дополнение CO-2026-003`,
    );
    assert.equal(
      item.primary_source_ref,
      currentCo2026003BmcSource,
      `${itemId} должен явно называть принятое дополнение CO-2026-003 основным источником`,
    );
    assert.equal(
      claim.primary_source_ref,
      currentCo2026003BmcSource,
      `${itemId} должен сохранять тот же основной источник в техническом утверждении`,
    );
  }
});

test("BMC не оставляет DataCanvas возможность вести уточняющий диалог в Лисе при запуске из агента", () => {
  const trace = readJson(tracePath);
  const activity = trace.items.find((item) => item.item_id === "BMC-CLM-007");
  const text = itemText(activity);

  assert.match(text, /DataCanvas не вед[её]т в Лисе уточняющий диалог/iu);
  assert.doesNotMatch(text, /не применяется как обязательный шаг/iu);
});

test("производные BMC-файлы несут явную дату редакции канонического источника", () => {
  const trace = readJson(tracePath);
  const sourceRevisionAt = trace.source_revision_at;
  assert.match(sourceRevisionAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u);
  const generatedMetadata = [
    [derivedManifestPath, "source_revision_at"],
    [packageManifestPath, "source_revision_at"],
    [validationNeedsPath, "source_revision_at"],
  ];

  for (const [path, field] of generatedMetadata) {
    assert.equal(
      readJson(path)[field],
      sourceRevisionAt,
      `${path.pathname} должен хранить дату редакции канонического источника`,
    );
    assert.equal(
      Object.hasOwn(readJson(path), "generated_at"),
      false,
      `${path.pathname} не должен выдавать дату редакции за время генерации`,
    );
  }
  assert.match(
    fs.readFileSync(visualReviewPath, "utf8"),
    new RegExp(`Редакция источника: ${sourceRevisionAt}`, "u"),
  );
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

  for (const rule of currentCo2026003ForbiddenActiveMeaning) {
    assert.doesNotMatch(combined, rule, `BMC trace вернул устаревший активный смысл: ${rule}`);
  }

  const generatedPublicText = publicTexts();
  for (const rule of currentCo2026003ForbiddenActiveMeaning) {
    assert.doesNotMatch(generatedPublicText, rule, `публичный BMC вернул устаревший активный смысл: ${rule}`);
  }
});
