import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import {
  APPROVED_PDF_SLIDE_SOURCES,
  buildApprovedPdfSlideRasters,
  __test,
} from "../scripts/import-presentation-link-lisa-pdf-slides.mjs";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE_DIR = process.env.LISA_PDF_SOURCE_DIR;
const OUTPUT_ROOT = "docs/product/analysis/presentation-link-lisa-user-journey/editable-sources";
const MANIFEST_PATH = "docs/product/analysis/presentation-link-lisa-user-journey/source/source-fixture-manifest.json";
const MANIFEST_SCHEMA_PATH = "docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/source-fixture-manifest.schema.json";
const EXPECTED_OUTPUTS = Object.freeze([
  "szh-dense-slidedoc-4x.png",
  "szh-dense-sber2025-4x.png",
  "szh-dense-mag-4x.png",
]);
const PNG_SIGNATURE = Buffer.from("89504e470d0a1a0a", "hex");

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

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return chunk;
}

function makeSyntheticCanonicalPng(width, height, label) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const idat = Buffer.from(`pdf-slide-fixture:${label}`, "utf8");
  return Buffer.concat([PNG_SIGNATURE, pngChunk("IHDR", ihdr), pngChunk("IDAT", idat), pngChunk("IEND", Buffer.alloc(0))]);
}

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "lisa-pdf-slides-"));
}

function readPngDimensions(bytes) {
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function assertCanonicalResult(result, root) {
  const approved = APPROVED_PDF_SLIDE_SOURCES.find((source) => source.output === result.output);
  assert.ok(approved, `${result.output}: результат должен относиться к утверждённому источнику`);
  const published = fs.readFileSync(path.join(root, OUTPUT_ROOT, result.output));
  assert.equal(published.equals(result.bytes), true, `${result.output}: опубликованный файл отличается от результата`);
  assert.deepEqual(readPngDimensions(published), { width: 3840, height: 6480 });
  assert.deepEqual(__test.inspectSafePng(published).chunks, ["IHDR", "IDAT", "IEND"]);
  assert.equal(result.dimensions.width, 3840);
  assert.equal(result.dimensions.height, 6480);
  assert.equal(result.source_dimensions.width, 960);
  assert.equal(result.source_dimensions.height, 1620);
  assert.equal(result.scale, 4);
  assert.equal(result.pages, 3);
  assert.equal(result.output_sha256, approved.output_sha256);
}

test("описывает только три утверждённых PDF и безопасные имена выходных PNG", () => {
  assert.deepEqual(
    APPROVED_PDF_SLIDE_SOURCES.map((source) => source.file_name),
    ["szh_dense_slidedoc.pdf", "szh_dense_sber2025.pdf", "szh_dense_mag.pdf"],
  );
  assert.deepEqual(
    APPROVED_PDF_SLIDE_SOURCES.map((source) => source.output),
    EXPECTED_OUTPUTS,
  );
  for (const source of APPROVED_PDF_SLIDE_SOURCES) {
    assert.match(source.sha256, /^[a-f0-9]{64}$/u);
    assert.match(source.output_sha256, /^[a-f0-9]{64}$/u);
    assert.equal(source.raw_file_tracked, false);
    assert.equal(source.source_path_stored, false);
    assert.equal(source.copied_to_package, false);
    assert.deepEqual(source.page_dimensions, { width: 960, height: 540 });
    assert.deepEqual(source.source_dimensions, { width: 960, height: 1620 });
    assert.deepEqual(source.rendered_dimensions, { width: 3840, height: 6480 });
    assert.equal(path.basename(source.file_name), source.file_name);
  }
});

test("публикует три канонических вертикальных PNG и повторяет импорт побайтно", { skip: SOURCE_DIR ? false : "нужен LISA_PDF_SOURCE_DIR" }, async () => {
  const root = makeTempRoot();
  const first = await buildApprovedPdfSlideRasters({ root, sourceDir: SOURCE_DIR, write: true });
  const firstSnapshot = new Map(first.map((result) => [result.output, fs.readFileSync(path.join(root, OUTPUT_ROOT, result.output))]));

  assert.deepEqual(first.map((result) => result.output), EXPECTED_OUTPUTS);
  for (const result of first) assertCanonicalResult(result, root);

  const second = await buildApprovedPdfSlideRasters({ root, sourceDir: SOURCE_DIR, write: true });
  assert.deepEqual(second.map((result) => result.output), EXPECTED_OUTPUTS);
  for (const result of second) {
    assertCanonicalResult(result, root);
    assert.equal(
      fs.readFileSync(path.join(root, OUTPUT_ROOT, result.output)).equals(firstSnapshot.get(result.output)),
      true,
      `${result.output}: повторный импорт должен быть побайтно детерминирован`,
    );
  }
});

test("--check проверяет опубликованные PNG без исходных PDF", async () => {
  const checkRoot = makeTempRoot();
  fs.mkdirSync(path.join(checkRoot, OUTPUT_ROOT), { recursive: true });
  for (const output of EXPECTED_OUTPUTS) {
    fs.copyFileSync(path.join(PROJECT_ROOT, OUTPUT_ROOT, output), path.join(checkRoot, OUTPUT_ROOT, output));
  }

  const checked = await buildApprovedPdfSlideRasters({ root: checkRoot, write: false });
  assert.deepEqual(checked.map((result) => result.output), EXPECTED_OUTPUTS);
  for (const result of checked) assertCanonicalResult(result, checkRoot);
});

test("--check отвергает PNG, который не был получен из утверждённого PDF", async () => {
  const checkRoot = makeTempRoot();
  fs.mkdirSync(path.join(checkRoot, OUTPUT_ROOT), { recursive: true });
  for (const output of EXPECTED_OUTPUTS) {
    fs.copyFileSync(path.join(PROJECT_ROOT, OUTPUT_ROOT, output), path.join(checkRoot, OUTPUT_ROOT, output));
  }
  fs.writeFileSync(
    path.join(checkRoot, OUTPUT_ROOT, EXPECTED_OUTPUTS[0]),
    makeSyntheticCanonicalPng(3840, 6480, EXPECTED_OUTPUTS[0]),
  );

  await assert.rejects(
    () => buildApprovedPdfSlideRasters({ root: checkRoot, write: false }),
    /SHA-256 опубликованного PNG не совпадает/u,
  );
});

test("не читает и не публикует PNG через символическую ссылку каталога назначения", async () => {
  const checkRoot = makeTempRoot();
  const outsideRoot = makeTempRoot();
  const outputParent = path.dirname(path.join(checkRoot, OUTPUT_ROOT));
  fs.mkdirSync(outputParent, { recursive: true });
  fs.mkdirSync(path.join(outsideRoot, "editable-sources"), { recursive: true });
  fs.symlinkSync(path.join(outsideRoot, "editable-sources"), path.join(checkRoot, OUTPUT_ROOT), "dir");

  await assert.rejects(
    () => buildApprovedPdfSlideRasters({ root: checkRoot, write: false }),
    /символическ/u,
  );
});

test("ограничивает время работы дочернего отрисовщика", () => {
  const importer = fs.readFileSync(path.join(PROJECT_ROOT, "scripts/import-presentation-link-lisa-pdf-slides.mjs"), "utf8");
  assert.match(importer, /timeout:\s*PDF_RENDER_TIMEOUT_MS/u);
  assert.match(importer, /PDF_RENDER_TIMEOUT_MS\s*=\s*60_000/u);
});

test("отрисовщик увеличивает страницу до четырёхкратного холста без белых полей", () => {
  const renderer = fs.readFileSync(path.join(PROJECT_ROOT, "scripts/render-presentation-link-lisa-pdf-slides.swift"), "utf8");
  assert.match(renderer, /context\.scaleBy\(x:\s*scaleX,\s*y:\s*scaleY\)/u);
  assert.doesNotMatch(renderer, /getDrawingTransform/u);
});

test("останавливается при несовпадении SHA-256 входного PDF", { skip: SOURCE_DIR ? false : "нужен LISA_PDF_SOURCE_DIR" }, async () => {
  const root = makeTempRoot();
  const sourceDir = path.join(root, "sources");
  fs.mkdirSync(sourceDir, { recursive: true });
  for (const source of APPROVED_PDF_SLIDE_SOURCES) {
    fs.copyFileSync(path.join(SOURCE_DIR, source.file_name), path.join(sourceDir, source.file_name));
  }
  fs.appendFileSync(path.join(sourceDir, "szh_dense_slidedoc.pdf"), "\n");

  await assert.rejects(
    () => buildApprovedPdfSlideRasters({ root, sourceDir, write: true }),
    /SHA-256 входного PDF не совпадает/u,
  );
});

test("манифест происхождения хранит только basename, hash и page metadata PDF", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, MANIFEST_PATH), "utf8"));
  const schema = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, MANIFEST_SCHEMA_PATH), "utf8"));
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  assert.equal(validate(manifest), true, JSON.stringify(validate.errors));
  assert.deepEqual(
    manifest.approved_presentation_pdfs.map((source) => source.file_name),
    APPROVED_PDF_SLIDE_SOURCES.map((source) => source.file_name),
  );
  assert.equal(JSON.stringify(manifest).includes("source_dir"), false);
  for (const source of manifest.approved_presentation_pdfs) {
    const approved = APPROVED_PDF_SLIDE_SOURCES.find((candidate) => candidate.file_name === source.file_name);
    assert.ok(approved, `${source.file_name}: PDF должен входить в утверждённый список`);
    assert.deepEqual(Object.keys(source).sort(), [
      "copied_to_package",
      "file_name",
      "output_file",
      "output_sha256",
      "page_count",
      "page_dimensions",
      "raw_file_tracked",
      "rendered_dimensions",
      "scale",
      "source_path_stored",
      "source_sha256",
    ]);
    assert.equal(path.basename(source.file_name), source.file_name);
    assert.equal(source.source_sha256, approved.sha256);
    assert.equal(source.output_sha256, approved.output_sha256);
    assert.equal(source.output_file, approved.output);
    assert.equal(source.page_count, 3);
    assert.deepEqual(source.page_dimensions, { width: 960, height: 540 });
    assert.deepEqual(source.rendered_dimensions, { width: 3840, height: 6480 });
    assert.equal(source.scale, 4);
    assert.equal(source.raw_file_tracked, false);
    assert.equal(source.source_path_stored, false);
    assert.equal(source.copied_to_package, false);
  }
});
