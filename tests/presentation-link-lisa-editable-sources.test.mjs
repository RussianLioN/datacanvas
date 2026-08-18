import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  APPROVED_EDITABLE_SOURCE_RASTERS,
  __test,
  buildApprovedEditableSourceRasters,
  canonicalizeApprovedPng,
} from "../scripts/import-presentation-link-lisa-editable-sources.mjs";

const SOURCE_ROOT = "docs/product/analysis/presentation-link-lisa-user-journey/editable-sources";
const BASE_ROOT = "docs/product/analysis/presentation-link-lisa-user-journey/source/bases";
const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const EXPECTED_LAYER_ROLES = Object.freeze(["system_top", "scroll_content", "system_bottom"]);
const EXPECTED_LAYER_SUFFIXES = Object.freeze({
  system_top: "status",
  scroll_content: "content",
  system_bottom: "home",
});
const PNG_SIGNATURE = Buffer.from("89504e470d0a1a0a", "hex");
const TIME_PATH_MARKER = `<path id="Time" d="__TIME__" fill="rgb(0,0,0)" fill-rule="nonzero" />`;
const EXPECTED_TIME_LAYOUT = Object.freeze({
  "5.2.svg": Object.freeze({
    d_sha256: "85c53bf16f947a646a41b41df2e8307c1edcd65c1344b77493306a6a15de29da",
    remainder_sha256: "657a0ecaa3d90bbac7f6a23cdfacc0b4be97e2a33060e0e5d3ec26b2c0efb22b",
  }),
  "5.4.svg": Object.freeze({
    d_sha256: "85c53bf16f947a646a41b41df2e8307c1edcd65c1344b77493306a6a15de29da",
    remainder_sha256: "8ea290229c387f5f06d97c6599c7ce404cabefc82415fce49f7b3c22d62d99f4",
  }),
  "7.1 — Холдинг.svg": Object.freeze({
    d_sha256: "85c53bf16f947a646a41b41df2e8307c1edcd65c1344b77493306a6a15de29da",
    remainder_sha256: "f59b185414b8f9550f0b3d2eee945d8669f4e8693a49f4958ebd825a9a776184",
  }),
  "7.2 — Длинное название клиента + холдинг.svg": Object.freeze({
    d_sha256: "9fa1a746cb4eb3710c1bb64205c08087904d9c782d813b007ce0743b02e6deee",
    remainder_sha256: "0939cbb6d78a1e2218b05f8c0d148f5f0474d634bcf3bf8eec94760d2e38635a",
  }),
  "7.3 — Презентация.svg": Object.freeze({
    d_sha256: "a54014443503072a026301601bf17905fa21a98669578eedf7e1c9135797bb0c",
    remainder_sha256: "87ecbd1898509be0e6abf6493dc8f25c6406e719bd51cbe406184c6206af0284",
  }),
  "08.svg": Object.freeze({
    d_sha256: "9fa1a746cb4eb3710c1bb64205c08087904d9c782d813b007ce0743b02e6deee",
    remainder_sha256: "d1e440844b408fb5a550717dd5c96f37ff6404bdc36a73551782ffc499e26a73",
  }),
});
const EXPECTED_MEETING_ROW_REMOVAL = Object.freeze({
  "5.4.svg": Object.freeze({
    card_clip_path: "2054",
    old_height: "128.000000",
    new_height: "96.000000",
    x: "80.000000",
    y: "281.000000",
    rx: "16.000000",
  }),
  "7.1 — Холдинг.svg": Object.freeze({
    card_clip_path: "204",
    old_height: "140.000000",
    new_height: "108.000000",
    x: "80.000000",
    y: "522.001221",
    rx: "24.000000",
  }),
  "7.2 — Длинное название клиента + холдинг.svg": Object.freeze({
    card_clip_path: "235",
    old_height: "212.000000",
    new_height: "180.000000",
    x: "80.000000",
    y: "226.000000",
    rx: "24.000000",
  }),
  "7.3 — Презентация.svg": Object.freeze({
    card_clip_path: "274",
    old_height: "140.000000",
    new_height: "108.000000",
    x: "80.000000",
    y: "188.000000",
    rx: "24.000000",
  }),
});

const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function crc32(value) {
  let crc = 0xffffffff;
  for (const byte of value) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return chunk;
}

function makeSyntheticPng(width, height, label) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const idat = Buffer.from(`rollback-fixture:${label}`, "utf8");
  return Buffer.concat([PNG_SIGNATURE, pngChunk("IHDR", ihdr), pngChunk("IDAT", idat), pngChunk("IEND", Buffer.alloc(0))]);
}

function makeTempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lisa-editable-sources-"));
  const sourceDirectory = path.join(root, SOURCE_ROOT);
  fs.mkdirSync(sourceDirectory, { recursive: true });
  for (const spec of APPROVED_EDITABLE_SOURCE_RASTERS) {
    const target = path.join(sourceDirectory, spec.source);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(PROJECT_ROOT, SOURCE_ROOT, spec.source), target);
  }
  return root;
}

function expectedLayerOutputs() {
  return APPROVED_EDITABLE_SOURCE_RASTERS.flatMap((spec) =>
    EXPECTED_LAYER_ROLES.map((role) => `lisa-${spec.state_id.slice("lisa-".length)}-${EXPECTED_LAYER_SUFFIXES[role]}-3x.png`),
  );
}

function seedLegacyFullRasters(root) {
  const baseDirectory = path.join(root, BASE_ROOT);
  fs.mkdirSync(baseDirectory, { recursive: true });
  for (const spec of APPROVED_EDITABLE_SOURCE_RASTERS) {
    fs.writeFileSync(path.join(baseDirectory, spec.legacy_output), makeSyntheticPng(1, 1, spec.legacy_output));
  }
}

function snapshotFiles(root, names) {
  const baseDirectory = path.join(root, BASE_ROOT);
  return new Map(names.map((name) => [name, fs.readFileSync(path.join(baseDirectory, name))]));
}

function assertSnapshotUnchanged(root, before) {
  const baseDirectory = path.join(root, BASE_ROOT);
  for (const [name, bytes] of before) {
    assert.equal(
      fs.readFileSync(path.join(baseDirectory, name)).equals(bytes),
      true,
      `${name}: файл должен быть побайтно восстановлен после отката`,
    );
  }
}

function assertNoTemporaryRasterDirectories(root) {
  const baseDirectory = path.join(root, BASE_ROOT);
  const temporaryDirectories = fs.readdirSync(baseDirectory)
    .filter((name) => name.startsWith(".lisa-editable-source-raster-"));
  assert.deepEqual(temporaryDirectories, []);
}

function readPngDimensions(bytes) {
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function inspectApprovedTimePath(svg, source) {
  const timePaths = [...svg.matchAll(/<path\b(?=[^>]*\bid="Time")[^>]*>/gu)].map((match) => match[0]);
  assert.equal(timePaths.length, 1, `${source}: должен быть ровно один path id="Time"`);

  const timePath = timePaths[0];
  const exactTimePath = timePath.match(/^<path id="Time" d="([^"]+)" fill="rgb\(0,0,0\)" fill-rule="nonzero" \/>$/u);
  assert.ok(
    exactTimePath,
    `${source}: path id="Time" должен сохранять только id, d, fill="rgb(0,0,0)" и fill-rule="nonzero" в утверждённой структуре`,
  );
  return {
    d: exactTimePath[1],
    timePath,
  };
}

test("фиксирует утверждённую раскладку системного времени в редактируемых SVG", () => {
  for (const [source, expected] of Object.entries(EXPECTED_TIME_LAYOUT)) {
    const svg = fs.readFileSync(path.join(PROJECT_ROOT, SOURCE_ROOT, source), "utf8");
    const { d, timePath } = inspectApprovedTimePath(svg, source);
    assert.equal(sha256(d), expected.d_sha256, `${source}: SHA-256 атрибута d системного времени`);

    const withoutTime = svg.replace(timePath, TIME_PATH_MARKER);
    assert.equal(sha256(withoutTime), expected.remainder_sha256, `${source}: вне path id="Time" байты должны совпадать`);
  }
});

test("удаляет всю строку регулярной встречи и сокращает карточку документа", () => {
  for (const [source, expected] of Object.entries(EXPECTED_MEETING_ROW_REMOVAL)) {
    const svg = fs.readFileSync(path.join(PROJECT_ROOT, SOURCE_ROOT, source), "utf8");
    assert.match(
      svg,
      /<g id="Frame 2131330376" opacity="0" customFrame="url\(#clipPath_[0-9]+\)">/u,
      `${source}: строка встречи должна быть скрыта целиком`,
    );
    const expectedRect = `<rect id="Frame 2131330375" width="361.000000" height="${expected.new_height}" x="${expected.x}" y="${expected.y}" rx="${expected.rx}"`;
    const removedRect = `<rect id="Frame 2131330375" width="361.000000" height="${expected.old_height}" x="${expected.x}" y="${expected.y}" rx="${expected.rx}"`;
    assert.ok(svg.includes(expectedRect), `${source}: карточка должна быть сокращена на 32 точки`);
    assert.equal(svg.includes(removedRect), false, `${source}: прежняя высота карточки не допускается`);
    assert.match(
      svg,
      new RegExp(`<clipPath id="clipPath_${expected.card_clip_path}">\\s*<rect width="361\\.000000" height="${expected.new_height}" x="${expected.x}" y="${expected.y}" rx="${expected.rx}"`, "u"),
      `${source}: отсечение карточки должно повторять сокращённую геометрию`,
    );
  }
});

test("заменяет текст плашки четвёртого кадра без изменения её габаритов", () => {
  const svg = fs.readFileSync(path.join(PROJECT_ROOT, SOURCE_ROOT, "7.1 — Холдинг.svg"), "utf8");
  const chip = svg.match(/<g id="lisa-edit-7-1-full-reference-chip">([\s\S]*?)<\/g>/u)?.[1] ?? "";

  assert.match(
    chip,
    /<rect x="215" y="400" width="226" height="48" rx="24" fill="rgb\(238\.345,238\.243,244\)" \/>/u,
    "плашка полной справки должна сохранять исходную геометрию",
  );
  assert.equal(
    (chip.match(/<path d="[^"]+" fill="rgb\(29,37,50\)" fill-rule="nonzero" \/>/gu) ?? []).length,
    3,
    "новая фраза должна быть записана отдельными контурами трёх слов",
  );
  assert.doesNotMatch(chip, /NaN/u, "контуры новой фразы не должны содержать недопустимых координат");
});

test("убирает белую подложку статуса формирования и скрывает только прежние перекрываемые строки", () => {
  const source = "7.2 — Длинное название клиента + холдинг.svg";
  const svg = fs.readFileSync(path.join(PROJECT_ROOT, SOURCE_ROOT, source), "utf8");

  assert.match(
    svg,
    /<g id="presentation-status-line-1" fill="rgb\(144,150,169\)" fill-rule="nonzero">/u,
    "первая исходная строка со сроком должна оставаться видимой",
  );
  for (const line of [2, 3, 4]) {
    assert.match(
      svg,
      new RegExp(`<g id="presentation-status-line-${line}" opacity="0" fill="rgb\\(144,150,169\\)" fill-rule="nonzero">`, "u"),
      `исходная строка ${line} должна быть скрыта, чтобы не дублировать новый текст`,
    );
  }
  assert.match(
    svg,
    /<g id="lisa-edit-7-2-email-text"><path d="/u,
    "новый текст должен быть сохранён в SVG-векторах, а не в браузерном тексте",
  );
  assert.doesNotMatch(
    svg,
    /<g id="lisa-edit-7-2-email-text"><rect\b/u,
    "у нового текста не должно быть белой подложки",
  );
});

test("переносит название справки в выбранный чат и возвращает нижнюю строку шестого кадра", () => {
  const svg = fs.readFileSync(path.join(PROJECT_ROOT, SOURCE_ROOT, "08.svg"), "utf8");

  assert.match(
    svg,
    /<g id="lisa-edit-08-client-name"><rect x="84" y="476" width="289" height="29" fill="rgb\(238,238,244\)" \/>/u,
    "маска названия должна завершаться на правой границе выбранного чата",
  );
  assert.doesNotMatch(
    svg,
    /<g id="lisa-edit-08-client-name"><rect x="84" y="476" width="230" height="29"/u,
    "прежняя короткая маска не покрывает новое название",
  );
  assert.doesNotMatch(
    svg,
    /id="lisa-edit-08-meeting-title"/u,
    "нижняя строка должна быть исходной, без выступающей маски",
  );
  const selectedChatOverlay = svg.match(/<g id="lisa-edit-08-client-name">([\s\S]*?)<\/g>/u)?.[1] ?? "";
  assert.doesNotMatch(
    selectedChatOverlay,
    /NaN/u,
    "контуры длинного названия не должны содержать недопустимых координат",
  );
});

test("отклоняет синтетическую замену fill в path id=\"Time\"", () => {
  const source = "08.svg";
  const svg = fs.readFileSync(path.join(PROJECT_ROOT, SOURCE_ROOT, source), "utf8");
  const { timePath } = inspectApprovedTimePath(svg, source);
  const mutated = svg.replace(timePath, timePath.replace('fill="rgb(0,0,0)"', 'fill="rgb(1,0,0)"'));

  assert.throws(
    () => inspectApprovedTimePath(mutated, `${source}: synthetic-fill-mutation`),
    /path id="Time" должен сохранять/u,
  );
});

test("пишет и проверяет утверждённые SVG как три безопасных 3x PNG-слоя во временной копии", async () => {
  const root = makeTempRoot();
  seedLegacyFullRasters(root);
  const written = await buildApprovedEditableSourceRasters({ root, write: true });

  assert.equal(written.length, expectedLayerOutputs().length);
  assert.deepEqual(written.map((item) => item.output), expectedLayerOutputs());

  for (const result of written) {
    const published = fs.readFileSync(path.join(root, BASE_ROOT, result.output));
    assert.equal(published.equals(result.bytes), true);
    assert.deepEqual(readPngDimensions(published), {
      width: result.dimensions.width,
      height: result.dimensions.height,
    });
    assert.equal(result.dimensions.width, result.source_rect.width * 3);
    assert.equal(result.dimensions.height, result.source_rect.height * 3);
    assert.deepEqual(result.viewport_rect, {
      x: result.role === "system_top" ? 0 : 0,
      y: result.role === "system_top" ? 0 : result.role === "scroll_content" ? 53 : 818,
      width: 393,
      height: result.role === "system_top" ? 53 : result.role === "scroll_content" ? 765 : 34,
    });
    assert.deepEqual(__test.inspectSafePng(published).chunks, ["IHDR", "IDAT", "IEND"]);
  }
  for (const spec of APPROVED_EDITABLE_SOURCE_RASTERS) {
    assert.equal(
      fs.existsSync(path.join(root, BASE_ROOT, spec.legacy_output)),
      false,
      `${spec.legacy_output}: старый полный PNG должен удаляться только после успешной публикации сегментов`,
    );
  }

  const checked = await buildApprovedEditableSourceRasters({ root });
  assert.deepEqual(
    checked.map(({ bytes, ...item }) => item),
    written.map(({ bytes, ...item }) => item),
  );
});

test("останавливается при изменении SHA-256 утверждённого SVG", async () => {
  const root = makeTempRoot();
  fs.appendFileSync(path.join(root, SOURCE_ROOT, "08.svg"), "\n");

  await assert.rejects(
    () => buildApprovedEditableSourceRasters({ root, write: true }),
    /SHA-256 исходного SVG не совпадает/u,
  );
});

test("канонизация удаляет служебный PNG-член sBIT из снимка WebKit", () => {
  const source = Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0])),
    pngChunk("sBIT", Buffer.from([8, 8, 8, 8])),
    pngChunk("IDAT", Buffer.from("webkit-sbit-fixture", "utf8")),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);

  const canonical = canonicalizeApprovedPng(source, { width: 1, height: 1 }, "webkit-sbit-fixture");
  assert.deepEqual(__test.inspectSafePng(canonical).chunks, ["IHDR", "IDAT", "IEND"]);
});

test("откатывает весь управляемый набор при сбое rename в середине cutover", async () => {
  const root = makeTempRoot();
  const initialResults = await buildApprovedEditableSourceRasters({ root, write: true });
  const baseDirectory = path.join(root, BASE_ROOT);
  for (const result of initialResults) {
    fs.writeFileSync(
      path.join(baseDirectory, result.output),
      makeSyntheticPng(result.dimensions.width, result.dimensions.height, result.output),
    );
  }
  seedLegacyFullRasters(root);

  const managedNames = [
    ...initialResults.map((result) => result.output),
    ...APPROVED_EDITABLE_SOURCE_RASTERS.map((spec) => spec.legacy_output),
  ];
  const before = snapshotFiles(root, managedNames);
  let activateRenameCount = 0;

  await assert.rejects(
    () => __test.withPublishRenameHook(({ phase }) => {
      if (phase !== "activate") return;
      activateRenameCount += 1;
      if (activateRenameCount === 10) throw new Error("контрольный сбой rename в середине cutover");
    }, () => buildApprovedEditableSourceRasters({ root, write: true })),
    /контрольный сбой rename в середине cutover/u,
  );

  assert.equal(activateRenameCount, 10);
  assertSnapshotUnchanged(root, before);
  assertNoTemporaryRasterDirectories(root);
});

test("запрещает внешние ссылки в SVG", () => {
  const svg = Buffer.from(`<svg viewBox="0 0 521 980" xmlns="http://www.w3.org/2000/svg">
<rect width="1" height="1" fill="url(https://example.invalid/a)" />
</svg>`);

  assert.throws(
    () => __test.validateApprovedSvg(svg, { width: 521, height: 980 }, "malicious-external"),
    /внешний протокол|внешний URL/u,
  );
});

test("запрещает script в SVG", () => {
  const svg = Buffer.from(`<svg viewBox="0 0 521 980" xmlns="http://www.w3.org/2000/svg">
<script>alert(1)</script>
</svg>`);

  assert.throws(
    () => __test.validateApprovedSvg(svg, { width: 521, height: 980 }, "malicious-script"),
    /запрещённый активный или внешний элемент/u,
  );
});
