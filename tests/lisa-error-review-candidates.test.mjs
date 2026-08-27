import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { prepareErrorReviewSources } from "../scripts/prepare-lisa-error-review-sources.mjs";

const root = path.resolve(import.meta.dirname, "..");
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const contractPath = `${packagePath}/source/error-frame-review-contract.json`;
const galleryPath = `${packagePath}/candidate-evidence/frame-review/error-frames-13-40-review.md`;
const ownerApproval = Object.freeze({
  decision: "approved",
  decision_text: "Экраны приняты!",
  decision_source: "Product Owner в рабочем чате",
  approval_time_precision: "date_only",
  approved_on: "2026-08-24",
});

const expectedCandidates = Object.freeze([
  {
    frameId: "lisa-order-not-accepted",
    directory: "lisa-order-not-accepted-clock-13-40",
    messageId: "order_not_accepted",
    keepsGenerationMessage: false,
    text: "Не удалось принять данные для формирования презентации. Вернитесь к диалогу «Справка по клиенту» и уточните данные, либо оформите тикет в сопровождение.",
  },
  {
    frameId: "lisa-delivery-delayed",
    directory: "lisa-delivery-delayed-clock-13-40",
    messageId: "delivery_delayed",
    keepsGenerationMessage: true,
    text: "Презентация формируется дольше 20 минут. Задача передана в сопровождение; сообщу здесь, если отправка на почту будет подтверждена.",
  },
  {
    frameId: "lisa-delivery-partial",
    directory: "lisa-delivery-partial-clock-13-40",
    messageId: "delivery_partial",
    keepsGenerationMessage: true,
    text: "Презентация сформирована и направлена в OMEGA. Отправка в SIGMA пока не подтверждена. Задача передана в сопровождение; сообщу здесь, если отправка будет подтверждена.",
  },
]);
const expectedFullReferenceGroupIds = Object.freeze([
  "general_information",
  "business_owners",
  "financial_indicators",
  "cooperation",
  "sber_share",
  "active_deals",
  "potential",
  "preapproved_offers",
  "insights",
  "meeting_agreements",
]);

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("принятые SVG-кандидаты ошибок продолжают справку в 13:40", () => {
  assert.equal(fs.existsSync(path.join(root, contractPath)), true, "договор кандидатов ошибок должен быть создан");
  const contract = JSON.parse(read(contractPath));
  assert.equal(contract.status, "owner_frame_approved");
  assert.deepEqual(contract.candidates.map((candidate) => candidate.frame_id), expectedCandidates.map((candidate) => candidate.frameId));
  assert.equal(contract.full_delivery_is_represented_by, "lisa-delivery-partial");

  for (const expected of expectedCandidates) {
    const directory = `${packagePath}/candidate-evidence/frame-review/${expected.directory}`;
    const source = read(`${directory}/source.svg`);
    const manifest = JSON.parse(read(`${directory}/review-source-manifest.json`));
    assert.equal(manifest.frame_id, expected.frameId);
    assert.equal(manifest.status, "owner_frame_approved");
    assert.equal(manifest.mock_phone_status_time_value, "13:40");
    assert.equal(manifest.error_message.message_id, expected.messageId);
    assert.equal(manifest.error_message.text, expected.text);
    assert.equal(manifest.keeps_generation_message, expected.keepsGenerationMessage);
    assert.match(source, /data-review-transition="same_screen_dynamic_state"/u);
    assert.match(source, /aria-disabled="true"/u);
    assert.match(source, /fill="rgb\(224,227,234\)"/u);
    assert.match(source, new RegExp(`aria-label="${expected.text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}"`, "u"));
    assert.doesNotMatch(source, /lisa-review-success-status/u);
    assert.doesNotMatch(source, /<text\b/u);
    assert.doesNotMatch(source, /lisa-status-/u);
    for (const groupId of expectedFullReferenceGroupIds) {
      assert.match(source, new RegExp(`data-review-rendered-group-id="${groupId}"`, "u"), `кадр ${expected.frameId} должен продолжать полную справку, а не только нижнюю панель`);
    }
    if (expected.keepsGenerationMessage) assert.match(source, /id="lisa-review-generation-status"/u);
    else assert.doesNotMatch(source, /id="lisa-review-generation-status"/u);
    if (expected.keepsGenerationMessage) {
      assert.match(source, /filter id="filter_120" width="393\.000000" height="224\.000000" x="64\.000000" y="4952\.000000"/u);
      assert.match(source, /clipPath id="clipPath_2083">\s*<rect width="393\.000000" height="224\.000000" x="64\.000000" y="4952\.000000"/u);
    }
    assert.equal(fs.existsSync(path.join(root, directory, "draft-current-resolution.png")), true);
    const approvalPath = `${directory}/owner-approval.json`;
    assert.equal(fs.existsSync(path.join(root, approvalPath)), true, `для ${expected.frameId} должна быть сохранена запись приёмки`);
    const approval = JSON.parse(read(approvalPath));
    assert.deepEqual(manifest.owner_frame_approval, {
      record_path: `candidate-evidence/frame-review/${expected.directory}/owner-approval.json`,
      ...ownerApproval,
    });
    assert.deepEqual({
      decision: approval.decision,
      decision_text: approval.decision_text,
      decision_source: approval.decision_source,
      approval_time_precision: approval.approval_time_precision,
      approved_on: approval.approved_on,
    }, ownerApproval);
    assert.equal(approval.approved_source_svg_sha256, manifest.source_svg_sha256);
    assert.equal(approval.approved_draft_png_sha256, manifest.draft_png_sha256);
  }
});

test("галерея приёмки показывает все три черновых PNG ошибок прямо в документе", () => {
  assert.equal(fs.existsSync(path.join(root, galleryPath)), true, "должна быть единая галерея PNG для покадровой приёмки");
  const gallery = read(galleryPath);
  const galleryText = gallery.replace(/^>\s?/gmu, "").replace(/\s+/gu, " ");
  for (const expected of expectedCandidates) {
    const pngPath = `${expected.directory}/draft-current-resolution.png`;
    assert.match(gallery, new RegExp(`!\\[[^\\]]*\\]\\(${pngPath.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}\\)`, "u"));
    assert.match(galleryText, new RegExp(expected.text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  }
  assert.doesNotMatch(gallery, /https?:\/\//u, "галерея должна открывать только зафиксированные локальные PNG");
});

test("проверка принятых кандидатов ошибок не создаёт PNG повторно", () => {
  const result = spawnSync(process.execPath, ["scripts/prepare-lisa-error-review-sources.mjs", "--check"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("повторная подготовка не возвращает принятые кадры ошибок в ожидание", () => {
  const before = expectedCandidates.map(({ directory }) => read(`${packagePath}/candidate-evidence/frame-review/${directory}/review-source-manifest.json`));
  const result = spawnSync(process.execPath, ["scripts/prepare-lisa-error-review-sources.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /принятый кадр нельзя пересобирать/u);
  const after = expectedCandidates.map(({ directory }) => read(`${packagePath}/candidate-evidence/frame-review/${directory}/review-source-manifest.json`));
  assert.deepEqual(after, before, "проверка принятого пакета не должна менять ни один манифест");
});

test("подготовка всего пакета останавливается до записи, если принят более поздний кадр", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lisa-error-preflight-"));
  try {
    const temporaryPackagePath = path.join(temporaryRoot, packagePath);
    fs.mkdirSync(path.join(temporaryPackagePath, "source"), { recursive: true });
    fs.writeFileSync(
      path.join(temporaryPackagePath, "source/error-frame-review-contract.json"),
      read(contractPath),
      "utf8",
    );
    const firstDirectory = expectedCandidates[0].directory;
    const secondDirectory = expectedCandidates[1].directory;
    const firstManifestPath = path.join(temporaryPackagePath, `candidate-evidence/frame-review/${firstDirectory}/review-source-manifest.json`);
    const secondApprovalPath = path.join(temporaryPackagePath, `candidate-evidence/frame-review/${secondDirectory}/owner-approval.json`);
    fs.mkdirSync(path.dirname(firstManifestPath), { recursive: true });
    fs.mkdirSync(path.dirname(secondApprovalPath), { recursive: true });
    fs.writeFileSync(firstManifestPath, "sentinel-before-preflight\n", "utf8");
    fs.writeFileSync(secondApprovalPath, "{}\n", "utf8");

    assert.throws(
      () => prepareErrorReviewSources({ root: temporaryRoot }),
      /принятый кадр нельзя пересобирать: lisa-delivery-delayed/u,
    );
    assert.equal(fs.readFileSync(firstManifestPath, "utf8"), "sentinel-before-preflight\n");
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
