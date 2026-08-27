import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { canonicalizeApprovedPng } from "./import-presentation-link-lisa-editable-sources.mjs";
import { APPROVED_VODOLEY_PDF_SLIDE_SOURCES } from "./import-presentation-link-lisa-pdf-slides.mjs";
import { inspectPng } from "./render-lisa-full-reference-review-draft.mjs";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const REVIEW_ROOT = `${PACKAGE_PATH}/candidate-evidence/frame-review`;
const PDF_IMPORT_CONTRACT_PATH = `${PACKAGE_PATH}/source/presentation-pdf-raster-import-contract.json`;
const PAGE_COUNT = 3;
const PAGE_DIMENSIONS = Object.freeze({ width: 960, height: 540 });
const DRAFT_DIMENSIONS = Object.freeze({ width: 960, height: 1620 });
const MAX_PDF_BYTES = 32 * 1024 * 1024;
const PDF_RENDER_TIMEOUT_MS = 60_000;

export const PRESENTATION_PDF_REVIEW_SPECS = Object.freeze(APPROVED_VODOLEY_PDF_SLIDE_SOURCES.map((source) => Object.freeze({
  frame_id: `lisa-presentation-${source.output.match(/^vodoley-dense-([a-z0-9]+)-4x\.png$/u)[1]}`,
  source_file_name: source.file_name,
  source_pdf_sha256: source.sha256,
  source_pdf_page_count: source.pages,
  source_svg_required: false,
  import_mode: "approved_pdf_to_png",
  draft_scale: 1,
  draft_png_path: `candidate-evidence/frame-review/lisa-presentation-${source.output.match(/^vodoley-dense-([a-z0-9]+)-4x\.png$/u)[1]}-pdf-import/draft-current-resolution.png`,
})));

function fail(message) {
  throw new Error(message);
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sha256File(filePath) {
  return sha256Bytes(fs.readFileSync(filePath));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function safeDirectory(root, relativePath, label, { create = false } = {}) {
  if (typeof relativePath !== "string" || relativePath.length === 0 || path.isAbsolute(relativePath) || relativePath.includes("\\") || relativePath.split("/").includes("..")) {
    fail(`${label}: небезопасный относительный путь`);
  }
  const target = path.resolve(root, relativePath);
  if (!target.startsWith(`${root}${path.sep}`)) fail(`${label}: путь выходит за рабочий корень`);
  let current = root;
  for (const segment of relativePath.split("/")) {
    current = path.join(current, segment);
    if (!fs.existsSync(current)) {
      if (!create) fail(`${label}: каталог отсутствует`);
      fs.mkdirSync(current, { mode: 0o755 });
    }
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || !stat.isDirectory()) fail(`${label}: недопустимый каталог`);
  }
  return target;
}

function readApprovedPdf(sourceDir, spec) {
  if (!sourceDir) fail("для подготовки черновика нужен --source-dir с утверждённым PDF");
  const sourceRoot = fs.realpathSync(sourceDir);
  const sourcePath = path.resolve(sourceRoot, spec.source_file_name);
  if (!sourcePath.startsWith(`${sourceRoot}${path.sep}`)) fail("PDF выходит за утверждённый каталог источника");
  const stat = fs.lstatSync(sourcePath);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size <= 0 || stat.size > MAX_PDF_BYTES) fail("PDF должен быть обычным файлом допустимого размера");
  const bytes = fs.readFileSync(sourcePath);
  if (sha256Bytes(bytes) !== spec.source_pdf_sha256) fail("SHA-256 входного PDF не совпадает с утверждённым значением");
  return sourcePath;
}

function renderPdf({ root, sourcePath, outputPath }) {
  const rendererPath = path.join(root, "scripts/render-presentation-link-lisa-pdf-slides.swift");
  const result = spawnSync(
    "swift",
    [
      rendererPath,
      "--input", sourcePath,
      "--output", outputPath,
      "--expected-pages", String(PAGE_COUNT),
      "--page-width", String(PAGE_DIMENSIONS.width),
      "--page-height", String(PAGE_DIMENSIONS.height),
      "--scale", "1",
    ],
    { cwd: root, encoding: "utf8", timeout: PDF_RENDER_TIMEOUT_MS, killSignal: "SIGKILL", maxBuffer: 1024 * 1024 },
  );
  if (result.error?.code === "ETIMEDOUT") fail("превышено время контролируемого преобразования PDF");
  if (result.error || result.status !== 0) fail(`Swift/CoreGraphics не создал черновой PNG: ${(result.stderr || result.stdout || "неизвестная ошибка").trim()}`);
}

export function resolvePresentationPdfReviewSpec(frameId) {
  const spec = PRESENTATION_PDF_REVIEW_SPECS.find((candidate) => candidate.frame_id === frameId);
  if (!spec) fail("для кадра не зарегистрирован утверждённый PDF ООО «Водолей Трейд»");
  return spec;
}

function reviewDirectoryFor(spec) {
  return path.posix.dirname(spec.draft_png_path);
}

function manifestRelativePath(spec) {
  return `${reviewDirectoryFor(spec)}/review-source-manifest.json`;
}

function assertDraftPreparationAuthorized(root, spec) {
  const contract = readJson(path.join(root, PDF_IMPORT_CONTRACT_PATH));
  const variant = contract?.variants?.find((candidate) => candidate.frame_id === spec.frame_id);
  if (
    contract?.status !== "all_presentation_drafts_authorized" ||
    contract?.per_frame_review?.batch_draft_preparation_authorized_by_owner !== true ||
    contract?.per_frame_review?.next_variant_blocked_until_owner_approval !== false ||
    !variant ||
    !["draft_preparation_authorized_by_owner", "draft_png_rendered_pending_owner_approval"].includes(variant.review_status)
  ) {
    fail("договор не разрешает подготовку этого PNG-черновика PDF до явного предварительного согласования владельца");
  }
}

function buildManifest(spec, draftPath, inspected) {
  return {
    "$schema": "../../../source/schemas/lisa-presentation-pdf-review-manifest.schema.json",
    "version": "1.0.0",
    "frame_id": spec.frame_id,
    "status": "draft_png_rendered_pending_owner_approval",
    "import_mode": spec.import_mode,
    "source_file_name": spec.source_file_name,
    "source_pdf_sha256": spec.source_pdf_sha256,
    "source_pdf_page_count": spec.source_pdf_page_count,
    "source_pdf_committed_to_git": false,
    "source_path_stored": false,
    "source_svg_required": false,
    "renderer": "swift_coregraphics",
    "draft_scale": spec.draft_scale,
    "draft_png_path": spec.draft_png_path,
    "draft_png_sha256": sha256File(draftPath),
    "draft_png_dimensions": DRAFT_DIMENSIONS,
    "draft_png_non_white_pixel_count": inspected.non_white_pixel_count,
    "active_release_mutation_prohibited": true,
    "owner_frame_approval": null,
  };
}

function validateSavedManifest(root, spec) {
  const manifestPath = path.join(root, PACKAGE_PATH, manifestRelativePath(spec));
  const draftPath = path.join(root, PACKAGE_PATH, spec.draft_png_path);
  const manifest = readJson(manifestPath);
  if (
    manifest.frame_id !== spec.frame_id ||
    manifest.status !== "draft_png_rendered_pending_owner_approval" ||
    manifest.import_mode !== "approved_pdf_to_png" ||
    manifest.source_file_name !== spec.source_file_name ||
    manifest.source_pdf_sha256 !== spec.source_pdf_sha256 ||
    manifest.source_pdf_page_count !== PAGE_COUNT ||
    manifest.source_pdf_committed_to_git !== false ||
    manifest.source_path_stored !== false ||
    manifest.source_svg_required !== false ||
    manifest.renderer !== "swift_coregraphics" ||
    manifest.draft_scale !== 1 ||
    manifest.draft_png_path !== spec.draft_png_path ||
    manifest.active_release_mutation_prohibited !== true ||
    manifest.owner_frame_approval !== null
  ) fail("сохранённый манифест чернового PDF-кадра не соответствует договору");
  const inspected = inspectPng(draftPath, DRAFT_DIMENSIONS);
  if (
    manifest.draft_png_sha256 !== sha256File(draftPath) ||
    JSON.stringify(manifest.draft_png_dimensions) !== JSON.stringify(DRAFT_DIMENSIONS) ||
    manifest.draft_png_non_white_pixel_count !== inspected.non_white_pixel_count
  ) fail("сохранённый PNG не соответствует манифесту чернового PDF-кадра");
  if (/(?:\/Users\/|file:\/\/|\.pdf\b)/iu.test(JSON.stringify(manifest).replace(spec.source_file_name, ""))) {
    fail("манифест чернового PDF-кадра содержит недопустимый путь или сырой источник");
  }
  return manifest;
}

export function renderPresentationPdfReviewDraft({ root = process.cwd(), sourceDir, frameId, check = false } = {}) {
  const resolvedRoot = fs.realpathSync(root);
  const spec = resolvePresentationPdfReviewSpec(frameId);
  if (check) return validateSavedManifest(resolvedRoot, spec);

  assertDraftPreparationAuthorized(resolvedRoot, spec);
  const sourcePath = readApprovedPdf(sourceDir, spec);
  const reviewDirectory = safeDirectory(resolvedRoot, `${PACKAGE_PATH}/${reviewDirectoryFor(spec)}`, "каталог чернового PDF-кадра", { create: true });
  const draftPath = path.join(resolvedRoot, PACKAGE_PATH, spec.draft_png_path);
  const manifestPath = path.join(resolvedRoot, PACKAGE_PATH, manifestRelativePath(spec));
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "lisa-pdf-review-"));
  try {
    const renderedPath = path.join(temporaryDirectory, "draft.png");
    renderPdf({ root: resolvedRoot, sourcePath, outputPath: renderedPath });
    const canonical = canonicalizeApprovedPng(fs.readFileSync(renderedPath), DRAFT_DIMENSIONS, path.basename(draftPath));
    const canonicalPath = path.join(temporaryDirectory, "canonical.png");
    fs.writeFileSync(canonicalPath, canonical, { flag: "wx" });
    const inspected = inspectPng(canonicalPath, DRAFT_DIMENSIONS);
    const stagedManifestPath = path.join(temporaryDirectory, "review-source-manifest.json");
    const manifest = buildManifest(spec, canonicalPath, inspected);
    writeJson(stagedManifestPath, manifest);
    fs.renameSync(canonicalPath, draftPath);
    fs.renameSync(stagedManifestPath, manifestPath);
    return validateSavedManifest(resolvedRoot, spec);
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function parseArguments(args) {
  const options = { check: false, frameId: null, sourceDir: null };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--frame" && args[index + 1]) options.frameId = args[++index];
    else if (argument === "--source-dir" && args[index + 1]) options.sourceDir = args[++index];
    else fail("использование: node scripts/render-lisa-presentation-pdf-review-draft.mjs --frame <кадр> [--source-dir <каталог> | --check]");
  }
  if (!options.frameId || (options.check && options.sourceDir) || (!options.check && !options.sourceDir)) {
    fail("для проверки укажите --frame --check, для подготовки — --frame и --source-dir");
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  try {
    const options = parseArguments(process.argv.slice(2));
    const manifest = renderPresentationPdfReviewDraft(options);
    process.stdout.write(options.check
      ? `Черновой PDF-кадр актуален: ${manifest.draft_png_path}\n`
      : `Черновой PDF-кадр подготовлен: ${manifest.draft_png_path}\n`);
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "черновой PDF-кадр не подготовлен"}\n`);
    process.exitCode = 1;
  }
}
