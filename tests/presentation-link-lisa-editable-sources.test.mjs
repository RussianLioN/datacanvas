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
  "1.1.svg": Object.freeze({
    d_sha256: "85c53bf16f947a646a41b41df2e8307c1edcd65c1344b77493306a6a15de29da",
    remainder_sha256: "adc47214aad5257476bb2139f9708299b7c2ec55224d8011286e894cfc6bab44",
  }),
  "5.2.svg": Object.freeze({
    d_sha256: "85c53bf16f947a646a41b41df2e8307c1edcd65c1344b77493306a6a15de29da",
    remainder_sha256: "a9552ea961187a4c2cc344e3c41ccb15c982f2933c5d3770a57de05efb8275e7",
  }),
  "5.4.svg": Object.freeze({
    d_sha256: "85c53bf16f947a646a41b41df2e8307c1edcd65c1344b77493306a6a15de29da",
    remainder_sha256: "7c38451ecd128247be2831228263cc180fd77152f8a65d2ee510e42221603903",
  }),
  "7.1 — Холдинг.svg": Object.freeze({
    d_sha256: "85c53bf16f947a646a41b41df2e8307c1edcd65c1344b77493306a6a15de29da",
    remainder_sha256: "d0be387b1500e6b53fc17b0cc62d313d47cb17e912ea79a80ba0417d71f3c7aa",
  }),
  "7.2 — Длинное название клиента + холдинг.svg": Object.freeze({
    d_sha256: "9fa1a746cb4eb3710c1bb64205c08087904d9c782d813b007ce0743b02e6deee",
    remainder_sha256: "8844d4c1afc92ced27608ac4a22954046509c1fef3147035b9bdb73498b671d2",
  }),
  "7.3 — Презентация.svg": Object.freeze({
    d_sha256: "a54014443503072a026301601bf17905fa21a98669578eedf7e1c9135797bb0c",
    remainder_sha256: "36f3b158a877e61b173dcf2bc3f7c5b3b84a28549d129b6105df821ec51449eb",
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
    fs.copyFileSync(path.join(PROJECT_ROOT, SOURCE_ROOT, spec.source), path.join(sourceDirectory, spec.source));
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

test("отклоняет синтетическую замену fill в path id=\"Time\"", () => {
  const source = "1.1.svg";
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

  assert.equal(written.length, 18);
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
  fs.appendFileSync(path.join(root, SOURCE_ROOT, "1.1.svg"), "\n");

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
