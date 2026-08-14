import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import {
  canonicalizeApprovedPng,
  __test as editableSourceTest,
} from "./import-presentation-link-lisa-editable-sources.mjs";

const LISA_PACKAGE_RELATIVE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const EDITABLE_SOURCES_RELATIVE_PATH = `${LISA_PACKAGE_RELATIVE_PATH}/editable-sources`;
const SWIFT_RENDERER_RELATIVE_PATH = "scripts/render-presentation-link-lisa-pdf-slides.swift";
const MAX_PDF_BYTES = 32 * 1024 * 1024;
const PDF_RENDER_TIMEOUT_MS = 60_000;
const PAGE_COUNT = 3;
const SCALE = 4;
const PAGE_DIMENSIONS = Object.freeze({ width: 960, height: 540 });
const SOURCE_DIMENSIONS = Object.freeze({ width: 960, height: 1620 });
const RENDERED_DIMENSIONS = Object.freeze({ width: 3840, height: 6480 });

export const APPROVED_PDF_SLIDE_SOURCES = Object.freeze([
  Object.freeze({
    file_name: "szh_dense_slidedoc.pdf",
    output: "szh-dense-slidedoc-4x.png",
    sha256: "f28bb0685c4788cdf9d81366531ae8d0847921dd53042406d5b7ef9212a5b569",
    output_sha256: "d056230b819da65682014741076b0faad9b5a9a513a378d6d61d11baf466fe32",
    pages: PAGE_COUNT,
    page_dimensions: PAGE_DIMENSIONS,
    source_dimensions: SOURCE_DIMENSIONS,
    rendered_dimensions: RENDERED_DIMENSIONS,
    scale: SCALE,
    raw_file_tracked: false,
    source_path_stored: false,
    copied_to_package: false,
  }),
  Object.freeze({
    file_name: "szh_dense_sber2025.pdf",
    output: "szh-dense-sber2025-4x.png",
    sha256: "90af1070bbdbbe8eccdef05dab20dafed1563fe58ebd2ea8004a5ab0c39e3500",
    output_sha256: "3b71d7d915870783fb4a4b89506906b067f7e2b881e7d13f543617861b26fce7",
    pages: PAGE_COUNT,
    page_dimensions: PAGE_DIMENSIONS,
    source_dimensions: SOURCE_DIMENSIONS,
    rendered_dimensions: RENDERED_DIMENSIONS,
    scale: SCALE,
    raw_file_tracked: false,
    source_path_stored: false,
    copied_to_package: false,
  }),
  Object.freeze({
    file_name: "szh_dense_mag.pdf",
    output: "szh-dense-mag-4x.png",
    sha256: "d237e832e90978bc3af5784439ed0b63334e348c3fd58f29e86a57ca9d579bfc",
    output_sha256: "3c108ca188b08869346a2bd16dc4590dd035cab4e1a94a625d36df3e96542303",
    pages: PAGE_COUNT,
    page_dimensions: PAGE_DIMENSIONS,
    source_dimensions: SOURCE_DIMENSIONS,
    rendered_dimensions: RENDERED_DIMENSIONS,
    scale: SCALE,
    raw_file_tracked: false,
    source_path_stored: false,
    copied_to_package: false,
  }),
]);

function fail(message) {
  throw new Error(message);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function resolveRoot(root) {
  try {
    return fs.realpathSync(root);
  } catch {
    fail("рабочий корень импортёра недоступен");
  }
}

function resolvePackagePath(root, relativePath, label) {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    path.isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    relativePath.includes("\u0000") ||
    relativePath.split("/").includes("..")
  ) {
    fail(`${label}: небезопасный относительный путь`);
  }
  const target = path.resolve(root, relativePath);
  if (!target.startsWith(`${root}${path.sep}`)) fail(`${label}: путь выходит за рабочий корень`);
  return target;
}

function resolveSafePackageDirectory(root, relativePath, label, { create = false } = {}) {
  const target = resolvePackagePath(root, relativePath, label);
  let current = root;
  for (const segment of relativePath.split("/")) {
    current = path.join(current, segment);
    if (!fs.existsSync(current)) {
      if (!create) fail(`${label}: каталог отсутствует`);
      fs.mkdirSync(current, { mode: 0o755 });
    }
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) fail(`${label}: символическая ссылка запрещена`);
    if (!stat.isDirectory()) fail(`${label}: компонент пути не является каталогом`);
  }
  if (fs.realpathSync(current) !== target) fail(`${label}: фактический путь отличается от договорного`);
  return target;
}

function assertSafeSourceSpec(spec) {
  if (path.basename(spec.file_name) !== spec.file_name || !/^szh_dense_[a-z0-9]+\.pdf$/u.test(spec.file_name)) {
    fail(`${spec.file_name}: небезопасное имя PDF`);
  }
  if (!/^szh-dense-[a-z0-9]+-4x\.png$/u.test(spec.output)) fail(`${spec.output}: небезопасное имя PNG`);
  if (!/^[a-f0-9]{64}$/u.test(spec.sha256)) fail(`${spec.file_name}: неверный SHA-256`);
  if (!/^[a-f0-9]{64}$/u.test(spec.output_sha256)) fail(`${spec.output}: неверный SHA-256 результата`);
}

function readRegularFile(filePath, label, maxBytes) {
  let stat;
  try {
    stat = fs.lstatSync(filePath);
  } catch {
    fail(`${label} недоступен`);
  }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size <= 0 || stat.size > maxBytes) {
    fail(`${label} не является безопасным обычным файлом`);
  }
  return fs.readFileSync(filePath);
}

function renderPdfWithSwift({ root, sourcePath, outputPath, spec }) {
  const renderer = fs.realpathSync(path.resolve(import.meta.dirname, path.basename(SWIFT_RENDERER_RELATIVE_PATH)));
  const result = spawnSync(
    "swift",
    [
      renderer,
      "--input",
      sourcePath,
      "--output",
      outputPath,
      "--expected-pages",
      String(PAGE_COUNT),
      "--page-width",
      String(PAGE_DIMENSIONS.width),
      "--page-height",
      String(PAGE_DIMENSIONS.height),
      "--scale",
      String(SCALE),
    ],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
      timeout: PDF_RENDER_TIMEOUT_MS,
      killSignal: "SIGKILL",
    },
  );
  if (result.error?.code === "ETIMEDOUT") {
    fail(`${spec.file_name}: превышено ограничение времени отрисовки ${PDF_RENDER_TIMEOUT_MS} мс`);
  }
  if (result.error) fail(`${spec.file_name}: дочерний процесс отрисовки не запущен`);
  if (result.status !== 0) {
    fail(`${spec.file_name}: Swift/CoreGraphics не отрисовал PDF (код ${result.status ?? "не получен"})`);
  }
}

function buildResult(spec, bytes) {
  const canonical = canonicalizeApprovedPng(bytes, RENDERED_DIMENSIONS, spec.output);
  const outputSha256 = sha256(canonical);
  if (outputSha256 !== spec.output_sha256) fail(`${spec.output}: SHA-256 опубликованного PNG не совпадает`);
  return {
    file_name: spec.file_name,
    output: spec.output,
    sha256: spec.sha256,
    bytes: canonical,
    byte_length: canonical.length,
    output_sha256: outputSha256,
    pages: PAGE_COUNT,
    page_dimensions: { ...PAGE_DIMENSIONS },
    source_dimensions: { ...SOURCE_DIMENSIONS },
    dimensions: { ...RENDERED_DIMENSIONS },
    scale: SCALE,
    raw_file_tracked: false,
    source_path_stored: false,
    copied_to_package: false,
  };
}

function buildOne(root, sourceDir, spec) {
  assertSafeSourceSpec(spec);
  if (!sourceDir) fail("--source-dir обязателен для импорта PDF");
  const sourceRoot = fs.realpathSync(sourceDir);
  const sourcePath = path.resolve(sourceRoot, spec.file_name);
  if (!sourcePath.startsWith(`${sourceRoot}${path.sep}`)) fail(`${spec.file_name}: путь выходит за каталог источников`);
  const sourceBytes = readRegularFile(sourcePath, spec.file_name, MAX_PDF_BYTES);
  if (sha256(sourceBytes) !== spec.sha256) fail(`${spec.file_name}: SHA-256 входного PDF не совпадает`);

  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "lisa-pdf-slide-render-"));
  const rawOutputPath = path.join(temporaryDirectory, spec.output);
  try {
    renderPdfWithSwift({ root, sourcePath, outputPath: rawOutputPath, spec });
    return buildResult(spec, readRegularFile(rawOutputPath, spec.output, 256 * 1024 * 1024));
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true, maxRetries: 2 });
  }
}

function verifyPublished(root, spec) {
  assertSafeSourceSpec(spec);
  const outputDirectory = resolveSafePackageDirectory(root, EDITABLE_SOURCES_RELATIVE_PATH, "каталог PNG");
  const outputPath = path.join(outputDirectory, spec.output);
  return buildResult(spec, readRegularFile(outputPath, spec.output, 256 * 1024 * 1024));
}

function publishResults(root, results) {
  const outputDirectory = resolveSafePackageDirectory(root, EDITABLE_SOURCES_RELATIVE_PATH, "каталог PNG", { create: true });
  const stagingDirectory = fs.mkdtempSync(path.join(outputDirectory, ".lisa-pdf-slides-"));
  const backupDirectory = fs.mkdtempSync(path.join(outputDirectory, ".lisa-pdf-slides-backup-"));
  const backups = [];
  const activated = [];
  try {
    for (const result of results) {
      fs.writeFileSync(path.join(stagingDirectory, result.output), result.bytes, { flag: "wx" });
    }
    for (const result of results) {
      const target = path.join(outputDirectory, result.output);
      const backup = path.join(backupDirectory, result.output);
      if (fs.existsSync(target)) {
        fs.renameSync(target, backup);
        backups.push({ target, backup });
      }
    }
    for (const result of results) {
      const target = path.join(outputDirectory, result.output);
      fs.renameSync(path.join(stagingDirectory, result.output), target);
      activated.push(target);
      const published = verifyPublished(root, result);
      if (!published.bytes.equals(result.bytes)) fail(`${result.output}: опубликованный PNG отличается от канонического результата`);
    }
  } catch (error) {
    for (const target of activated) fs.rmSync(target, { force: true });
    for (const { target, backup } of backups) {
      if (fs.existsSync(backup)) {
        if (fs.existsSync(target)) fs.rmSync(target, { force: true });
        fs.renameSync(backup, target);
      }
    }
    throw error;
  } finally {
    fs.rmSync(stagingDirectory, { recursive: true, force: true, maxRetries: 2 });
    fs.rmSync(backupDirectory, { recursive: true, force: true, maxRetries: 2 });
  }
}

export async function buildApprovedPdfSlideRasters({ root = process.cwd(), sourceDir, write = false } = {}) {
  if (typeof write !== "boolean") fail("write должен быть логическим значением");
  const resolvedRoot = resolveRoot(root);
  const results = write
    ? APPROVED_PDF_SLIDE_SOURCES.map((spec) => buildOne(resolvedRoot, sourceDir, spec))
    : APPROVED_PDF_SLIDE_SOURCES.map((spec) => verifyPublished(resolvedRoot, spec));
  if (write) publishResults(resolvedRoot, results);
  return results;
}

function parseCliArguments(args) {
  if (args.length === 1 && args[0] === "--check") return { write: false };
  if (args.length === 2 && args[0] === "--source-dir") return { write: true, sourceDir: args[1] };
  fail("использование: node scripts/import-presentation-link-lisa-pdf-slides.mjs --source-dir <каталог> | --check");
}

function isEntrypoint() {
  if (!process.argv[1]) return false;
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(import.meta.filename);
  } catch {
    return false;
  }
}

export const __test = Object.freeze({
  inspectSafePng: editableSourceTest.inspectSafePng,
});

if (isEntrypoint()) {
  try {
    const result = await buildApprovedPdfSlideRasters(parseCliArguments(process.argv.slice(2)));
    const printable = result.map(({ bytes, ...item }) => ({ ...item, bytes: bytes.length }));
    process.stdout.write(`${JSON.stringify({ mode: process.argv.includes("--check") ? "check" : "write", rasters: printable }, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "импорт не выполнен"}\n`);
    process.exitCode = 1;
  }
}
