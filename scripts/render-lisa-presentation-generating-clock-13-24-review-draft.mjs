import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { inspectPng } from "./render-lisa-full-reference-review-draft.mjs";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const REVIEW_DIRECTORY = `${PACKAGE_PATH}/candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24`;
const SOURCE_PATH = `${REVIEW_DIRECTORY}/source.svg`;
const MANIFEST_PATH = `${REVIEW_DIRECTORY}/review-source-manifest.json`;
const DRAFT_PATH = `${REVIEW_DIRECTORY}/draft-current-resolution.png`;
const EXPECTED_DIMENSIONS = Object.freeze({ width: 521, height: 3226 });

function fail(message) { throw new Error(message); }
function sha256(filePath) { return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex"); }
function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
function writeJson(filePath, value) { fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }

function rendererCommand() {
  const candidates = ["/opt/homebrew/bin/rsvg-convert", "/usr/local/bin/rsvg-convert", "/usr/bin/rsvg-convert", "rsvg-convert"];
  for (const candidate of candidates) {
    if (spawnSync(candidate, ["--version"], { encoding: "utf8" }).status === 0) return candidate;
  }
  fail("не найден rsvg-convert для изолированного чернового PNG");
}

function validateManifestShape(manifest) {
  if (
    manifest.frame_id !== "lisa-presentation-generating" ||
    manifest.correction_scope !== "mock_phone_status_time_only" ||
    manifest.mock_phone_status_time_value !== "13:24" ||
    manifest.mock_phone_status_time_donor_svg_path !== "editable-sources/08.svg" ||
    manifest.active_release_mutation_prohibited !== true
  ) fail("манифест исправления времени не соответствует изолированному циклу приёмки");
}

function renderDraft({ root = process.cwd(), check = false } = {}) {
  const sourcePath = path.join(root, SOURCE_PATH);
  const manifestPath = path.join(root, MANIFEST_PATH);
  const draftPath = path.join(root, DRAFT_PATH);
  const manifest = readJson(manifestPath);
  validateManifestShape(manifest);
  if (manifest.source_svg_sha256 !== sha256(sourcePath)) fail("манифест исправления времени не совпадает с SVG-источником");
  if (check) {
    if (!["draft_png_rendered_pending_owner_approval", "owner_frame_approved"].includes(manifest.status) || manifest.draft_png_rendered !== true) fail("черновой PNG исправления времени не подготовлен для приёмки владельца");
    const inspected = inspectPng(draftPath, EXPECTED_DIMENSIONS);
    if (
      manifest.draft_png_path !== "candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24/draft-current-resolution.png" ||
      manifest.draft_png_sha256 !== sha256(draftPath) ||
      JSON.stringify(manifest.draft_png_dimensions) !== JSON.stringify(EXPECTED_DIMENSIONS) ||
      manifest.draft_png_non_white_pixel_count !== inspected.non_white_pixel_count
    ) fail("манифест исправления времени не соответствует сохранённому черновому PNG");
    return manifest;
  }
  if (manifest.status !== "svg_source_prepared_pending_visual_check" || manifest.draft_png_rendered !== false || manifest.owner_frame_approval !== null) fail("PNG исправления времени можно создавать только из нового SVG-источника до приёмки владельца");
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "lisa-generation-clock-13-24-draft-"));
  const temporaryPng = path.join(temporaryDirectory, "draft.png");
  try {
    const result = spawnSync(rendererCommand(), [sourcePath, "--output", temporaryPng], { encoding: "utf8" });
    if (result.status !== 0) fail(`rsvg-convert не создал черновой PNG: ${(result.stderr || result.stdout || "неизвестная ошибка").trim()}`);
    const inspected = inspectPng(temporaryPng, EXPECTED_DIMENSIONS);
    fs.renameSync(temporaryPng, draftPath);
    const updated = {
      ...manifest,
      status: "draft_png_rendered_pending_owner_approval",
      draft_png_rendered: true,
      draft_png_path: "candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24/draft-current-resolution.png",
      draft_png_sha256: sha256(draftPath),
      draft_png_dimensions: EXPECTED_DIMENSIONS,
      draft_png_non_white_pixel_count: inspected.non_white_pixel_count,
    };
    writeJson(manifestPath, updated);
    return updated;
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  try {
    const argumentsList = process.argv.slice(2);
    if (argumentsList.some((argument) => argument !== "--check")) fail("использование: node scripts/render-lisa-presentation-generating-clock-13-24-review-draft.mjs [--check]");
    const manifest = renderDraft({ check: argumentsList.includes("--check") });
    process.stdout.write(argumentsList.includes("--check")
      ? `Черновой PNG исправления времени актуален: ${manifest.draft_png_path}\n`
      : `Черновой PNG исправления времени подготовлен: ${manifest.draft_png_path}\n`);
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "черновой PNG исправления времени не подготовлен"}\n`);
    process.exitCode = 1;
  }
}

export { renderDraft };
