import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { inspectPng } from "./render-lisa-full-reference-review-draft.mjs";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const CONTRACT_PATH = `${PACKAGE_PATH}/source/error-frame-review-contract.json`;
const FRAME_REVIEW_PATH = `${PACKAGE_PATH}/candidate-evidence/frame-review`;
const EXPECTED_DIMENSIONS = Object.freeze({ width: 521, height: 3290 });

function fail(message) { throw new Error(message); }
function sha256(filePath) { return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex"); }
function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
function writeJson(filePath, value) { fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function rendererCommand() {
  for (const candidate of ["/opt/homebrew/bin/rsvg-convert", "/usr/local/bin/rsvg-convert", "/usr/bin/rsvg-convert", "rsvg-convert"]) {
    if (spawnSync(candidate, ["--version"], { encoding: "utf8" }).status === 0) return candidate;
  }
  fail("не найден rsvg-convert для изолированных черновых PNG");
}

function manifestPath(root, candidate) { return path.join(root, FRAME_REVIEW_PATH, candidate.directory, "review-source-manifest.json"); }
function sourcePath(root, candidate) { return path.join(root, FRAME_REVIEW_PATH, candidate.directory, "source.svg"); }
function draftPath(root, candidate) { return path.join(root, FRAME_REVIEW_PATH, candidate.directory, "draft-current-resolution.png"); }

function renderErrorReviewDrafts({ root = process.cwd(), check = false } = {}) {
  const contract = readJson(path.join(root, CONTRACT_PATH));
  if (check) {
    for (const candidate of contract.candidates) {
      const manifest = readJson(manifestPath(root, candidate));
      const draft = draftPath(root, candidate);
      if (!["draft_png_rendered_pending_owner_approval", "owner_frame_approved"].includes(manifest.status) || manifest.draft_png_rendered !== true || manifest.draft_png_path !== `${FRAME_REVIEW_PATH}/${candidate.directory}/draft-current-resolution.png`) fail(`черновой PNG не подготовлен: ${candidate.frame_id}`);
      const inspected = inspectPng(draft, EXPECTED_DIMENSIONS);
      if (manifest.draft_png_sha256 !== sha256(draft) || JSON.stringify(manifest.draft_png_dimensions) !== JSON.stringify(EXPECTED_DIMENSIONS) || manifest.draft_png_non_white_pixel_count !== inspected.non_white_pixel_count || (manifest.status === "draft_png_rendered_pending_owner_approval" && manifest.owner_frame_approval !== null) || (manifest.status === "owner_frame_approved" && manifest.owner_frame_approval === null)) fail(`манифест PNG не соответствует файлу: ${candidate.frame_id}`);
    }
    return contract;
  }
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "lisa-error-review-drafts-"));
  try {
    const rendered = [];
    for (const candidate of contract.candidates) {
      const manifest = readJson(manifestPath(root, candidate));
      if (manifest.status !== "svg_source_prepared_pending_visual_check" || manifest.draft_png_rendered !== false || manifest.owner_frame_approval !== null) fail(`PNG может быть создан только после нового SVG и до приёмки: ${candidate.frame_id}`);
      if (manifest.source_svg_sha256 !== sha256(sourcePath(root, candidate))) fail(`манифест не совпадает с SVG: ${candidate.frame_id}`);
      const temporaryPng = path.join(temporaryDirectory, `${candidate.frame_id}.png`);
      const result = spawnSync(rendererCommand(), [sourcePath(root, candidate), "--output", temporaryPng], { encoding: "utf8" });
      if (result.status !== 0) fail(`rsvg-convert не создал PNG ${candidate.frame_id}: ${(result.stderr || result.stdout || "неизвестная ошибка").trim()}`);
      rendered.push({ candidate, manifest, temporaryPng, inspected: inspectPng(temporaryPng, EXPECTED_DIMENSIONS) });
    }
    for (const item of rendered) {
      const destination = draftPath(root, item.candidate);
      fs.copyFileSync(item.temporaryPng, destination);
      writeJson(manifestPath(root, item.candidate), {
        ...item.manifest,
        status: "draft_png_rendered_pending_owner_approval",
        draft_png_rendered: true,
        draft_png_path: `${FRAME_REVIEW_PATH}/${item.candidate.directory}/draft-current-resolution.png`,
        draft_png_sha256: sha256(destination),
        draft_png_dimensions: EXPECTED_DIMENSIONS,
        draft_png_non_white_pixel_count: item.inspected.non_white_pixel_count
      });
    }
    return contract;
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  try {
    const args = process.argv.slice(2);
    if (args.some((arg) => arg !== "--check")) fail("использование: node scripts/render-lisa-error-review-drafts.mjs [--check]");
    renderErrorReviewDrafts({ check: args.includes("--check") });
    process.stdout.write(args.includes("--check") ? "Черновые PNG ошибок актуальны\n" : "Черновые PNG ошибок подготовлены\n");
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "черновые PNG ошибок не подготовлены"}\n`);
    process.exitCode = 1;
  }
}

export { renderErrorReviewDrafts };
