import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { inspectPng } from "./render-lisa-full-reference-review-draft.mjs";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const REVIEW_DIRECTORY = `${PACKAGE_PATH}/candidate-evidence/frame-review/lisa-presentation-slidedoc`;
const SOURCE_PATH = `${REVIEW_DIRECTORY}/source.svg`;
const MANIFEST_PATH = `${REVIEW_DIRECTORY}/review-source-manifest.json`;
const DRAFT_PATH = `${REVIEW_DIRECTORY}/draft-current-resolution.png`;
const DRAFT_PAGE_RELATIVE_PATHS = Object.freeze([1, 2, 3].map((page) => `candidate-evidence/frame-review/lisa-presentation-slidedoc/draft-page-${page}.png`));
const DRAFT_PAGE_PATHS = Object.freeze(DRAFT_PAGE_RELATIVE_PATHS.map((relativePath) => `${PACKAGE_PATH}/${relativePath}`));
const EXPECTED_DIMENSIONS = Object.freeze({ width: 960, height: 1620 });
const EXPECTED_PAGE_DIMENSIONS = Object.freeze({ width: 960, height: 540 });

function fail(message) { throw new Error(message); }
function sha256(filePath) { return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex"); }
function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
function writeJson(filePath, value) { fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function rendererCommand() {
  for (const candidate of ["/opt/homebrew/bin/rsvg-convert", "/usr/local/bin/rsvg-convert", "/usr/bin/rsvg-convert", "rsvg-convert"]) {
    if (spawnSync(candidate, ["--version"], { encoding: "utf8" }).status === 0) return candidate;
  }
  fail("не найден rsvg-convert для чернового PNG SlideDoc");
}

function validateManifest(manifest) {
  if (
    manifest.frame_id !== "lisa-presentation-slidedoc" ||
    !["svg_source_prepared_pending_visual_check", "draft_png_rendered_pending_owner_approval"].includes(manifest.status) ||
    manifest.visual_donor_id !== "presentation_variant_slidedoc_pdf_donor" ||
    manifest.visual_reference_only !== true ||
    manifest.raw_pdf_direct_render_used !== false ||
    manifest.active_release_mutation_prohibited !== true ||
    manifest.source_svg_path !== "candidate-evidence/frame-review/lisa-presentation-slidedoc/source.svg" ||
    manifest.owner_frame_approval !== null
  ) fail("манифест SlideDoc не соответствует изолированной покадровой приёмке");
}

function inspectPagePng(root, entry) {
  const expectedPath = DRAFT_PAGE_RELATIVE_PATHS[entry.page - 1];
  const filePath = path.join(root, PACKAGE_PATH, expectedPath);
  const inspected = inspectPng(filePath, EXPECTED_PAGE_DIMENSIONS);
  if (entry.path !== expectedPath || entry.sha256 !== sha256(filePath) || JSON.stringify(entry.dimensions) !== JSON.stringify(EXPECTED_PAGE_DIMENSIONS) || entry.non_white_pixel_count !== inspected.non_white_pixel_count) {
    fail("манифест SlideDoc не совпадает с отдельной страницей чернового PNG");
  }
}

function renderDraft({ root = process.cwd(), check = false } = {}) {
  const sourcePath = path.join(root, SOURCE_PATH);
  const manifestPath = path.join(root, MANIFEST_PATH);
  const draftPath = path.join(root, DRAFT_PATH);
  const manifest = readJson(manifestPath);
  validateManifest(manifest);
  const source = fs.readFileSync(sourcePath, "utf8");
  if (/<(?:image|foreignObject|script)\b/iu.test(source) || /(?:\.pdf\b|szh-dense-slidedoc-4x\.png|ГК Достовалова|\/Users\/|file:\/\/)/iu.test(source)) {
    fail("SVG SlideDoc содержит запрещённый источник или исторический материал");
  }
  if (manifest.source_svg_sha256 !== sha256(sourcePath)) fail("манифест SlideDoc не совпадает с SVG-источником");
  if (check) {
    if (manifest.status !== "draft_png_rendered_pending_owner_approval" || manifest.draft_png_rendered !== true) fail("черновой PNG SlideDoc ещё не подготовлен");
    const inspected = inspectPng(draftPath, EXPECTED_DIMENSIONS);
    if (
      manifest.draft_png_path !== "candidate-evidence/frame-review/lisa-presentation-slidedoc/draft-current-resolution.png" ||
      manifest.draft_png_sha256 !== sha256(draftPath) ||
      JSON.stringify(manifest.draft_png_dimensions) !== JSON.stringify(EXPECTED_DIMENSIONS) ||
      manifest.draft_png_non_white_pixel_count !== inspected.non_white_pixel_count
    ) fail("манифест SlideDoc не совпадает с сохранённым PNG");
    if (!Array.isArray(manifest.draft_page_pngs) || manifest.draft_page_pngs.length !== 3) fail("для приёмки SlideDoc нужны три отдельные PNG-страницы");
    manifest.draft_page_pngs.forEach((entry, index) => {
      if (entry.page !== index + 1) fail("отдельные PNG-страницы SlideDoc нарушают порядок 1–3");
      inspectPagePng(root, entry);
    });
    return manifest;
  }
  if (manifest.status !== "svg_source_prepared_pending_visual_check" || manifest.draft_png_rendered !== false) fail("PNG SlideDoc можно создать только один раз из нового SVG до приёмки владельца");
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "lisa-slidedoc-draft-"));
  const temporaryPng = path.join(temporaryDirectory, "draft.png");
  const temporaryPages = [1, 2, 3].map((page) => path.join(temporaryDirectory, `draft-page-${page}.png`));
  try {
    const result = spawnSync(rendererCommand(), [sourcePath, "--output", temporaryPng], { encoding: "utf8" });
    if (result.status !== 0) fail(`rsvg-convert не создал PNG SlideDoc: ${(result.stderr || result.stdout || "неизвестная ошибка").trim()}`);
    const inspected = inspectPng(temporaryPng, EXPECTED_DIMENSIONS);
    const renderer = rendererCommand();
    const pageEvidence = [];
    for (const page of [1, 2, 3]) {
      const pageResult = spawnSync(renderer, [sourcePath, "--export-id", `slidedoc-page-${page}`, "--output", temporaryPages[page - 1]], { encoding: "utf8" });
      if (pageResult.status !== 0) fail(`rsvg-convert не создал PNG страницы ${page}: ${(pageResult.stderr || pageResult.stdout || "неизвестная ошибка").trim()}`);
      const pageInspection = inspectPng(temporaryPages[page - 1], EXPECTED_PAGE_DIMENSIONS);
      pageEvidence.push({ page, path: DRAFT_PAGE_RELATIVE_PATHS[page - 1], sha256: sha256(temporaryPages[page - 1]), dimensions: EXPECTED_PAGE_DIMENSIONS, non_white_pixel_count: pageInspection.non_white_pixel_count });
    }
    fs.renameSync(temporaryPng, draftPath);
    for (let page = 1; page <= 3; page += 1) fs.renameSync(temporaryPages[page - 1], path.join(root, DRAFT_PAGE_PATHS[page - 1]));
    const updated = {
      ...manifest,
      status: "draft_png_rendered_pending_owner_approval",
      draft_png_rendered: true,
      draft_png_path: "candidate-evidence/frame-review/lisa-presentation-slidedoc/draft-current-resolution.png",
      draft_png_sha256: sha256(draftPath),
      draft_png_dimensions: EXPECTED_DIMENSIONS,
      draft_png_non_white_pixel_count: inspected.non_white_pixel_count,
      draft_page_pngs: pageEvidence.map((entry) => ({ ...entry, sha256: sha256(path.join(root, PACKAGE_PATH, entry.path)) })),
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
    if (argumentsList.some((argument) => argument !== "--check")) fail("использование: node scripts/render-lisa-presentation-slidedoc-review-draft.mjs [--check]");
    const manifest = renderDraft({ check: argumentsList.includes("--check") });
    process.stdout.write(argumentsList.includes("--check") ? `Черновой PNG SlideDoc актуален: ${manifest.draft_png_path}\n` : `Черновой PNG SlideDoc подготовлен: ${manifest.draft_png_path}\n`);
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "черновой PNG SlideDoc не подготовлен"}\n`);
    process.exitCode = 1;
  }
}

export { renderDraft };
