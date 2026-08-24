import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { inspectPng } from "./render-lisa-full-reference-review-draft.mjs";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const REVIEW_DIRECTORY = `${PACKAGE_PATH}/candidate-evidence/frame-review/lisa-presentation-sent`;
const SOURCE_PATH = `${REVIEW_DIRECTORY}/source.svg`;
const MANIFEST_PATH = `${REVIEW_DIRECTORY}/review-source-manifest.json`;
const APPROVAL_PATH = `${REVIEW_DIRECTORY}/owner-approval.json`;
const DRAFT_PATH = `${REVIEW_DIRECTORY}/draft-current-resolution.png`;
const EXPECTED_DIMENSIONS = Object.freeze({ width: 521, height: 3290 });

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
  const expectedApproval = {
    record_path: "candidate-evidence/frame-review/lisa-presentation-sent/owner-approval.json",
    decision: "approved",
    decision_text: "кадр принят",
    decision_source: "Product Owner в рабочем чате",
    approval_time_precision: "date_only",
    approved_on: "2026-08-24",
  };
  if (
    manifest.frame_id !== "lisa-presentation-sent" ||
    manifest.base_frame_id !== "lisa-presentation-generating" ||
    manifest.base_svg_path !== "candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24/source.svg" ||
    manifest.base_owner_approval_path !== "candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24/owner-approval.json" ||
    manifest.skipped_intermediate_frame_id !== "lisa-presentation-chat-list" ||
    manifest.skipped_intermediate_frame_reason !== "owner_direction_no_rework" ||
    manifest.mock_phone_status_time_value !== "13:40" ||
    !["svg_source_prepared_pending_visual_check", "draft_png_rendered_pending_owner_approval", "owner_frame_approved"].includes(manifest.status) ||
    (manifest.status === "owner_frame_approved" && JSON.stringify(manifest.owner_frame_approval) !== JSON.stringify(expectedApproval)) ||
    (manifest.status !== "owner_frame_approved" && manifest.owner_frame_approval !== null) ||
    manifest.active_release_mutation_prohibited !== true
  ) fail("манифест кадра успеха не соответствует изолированному циклу приёмки");
}

function validateAcceptedApproval(root, manifest) {
  if (manifest.status !== "owner_frame_approved") return;
  const approval = readJson(path.join(root, APPROVAL_PATH));
  if (
    approval.frame_id !== "lisa-presentation-sent" ||
    approval.decision !== "approved" ||
    approval.approval_time_precision !== "date_only" ||
    approval.approved_on !== "2026-08-24" ||
    !approval.decision_evidence_note ||
    approval.approved_source_svg_sha256 !== manifest.source_svg_sha256 ||
    approval.approved_draft_png_sha256 !== manifest.draft_png_sha256
  ) fail("запись приёмки кадра успеха не совпадает с сохранёнными SVG и PNG");
}

function renderDraft({ root = process.cwd(), check = false } = {}) {
  const sourcePath = path.join(root, SOURCE_PATH);
  const manifestPath = path.join(root, MANIFEST_PATH);
  const draftPath = path.join(root, DRAFT_PATH);
  const manifest = readJson(manifestPath);
  validateManifestShape(manifest);
  validateAcceptedApproval(root, manifest);
  if (manifest.source_svg_sha256 !== sha256(sourcePath)) fail("манифест кадра успеха не совпадает с SVG-источником");
  if (check) {
    if (!["draft_png_rendered_pending_owner_approval", "owner_frame_approved"].includes(manifest.status) || manifest.draft_png_rendered !== true) fail("черновой PNG кадра успеха не подготовлен для проверки приёмки владельца");
    const inspected = inspectPng(draftPath, EXPECTED_DIMENSIONS);
    if (
      manifest.draft_png_path !== "candidate-evidence/frame-review/lisa-presentation-sent/draft-current-resolution.png" ||
      manifest.draft_png_sha256 !== sha256(draftPath) ||
      JSON.stringify(manifest.draft_png_dimensions) !== JSON.stringify(EXPECTED_DIMENSIONS) ||
      manifest.draft_png_non_white_pixel_count !== inspected.non_white_pixel_count
    ) fail("манифест кадра успеха не соответствует сохранённому черновому PNG");
    return manifest;
  }
  if (manifest.status !== "svg_source_prepared_pending_visual_check" || manifest.draft_png_rendered !== false) fail("PNG кадра успеха можно создавать только из нового SVG-источника до приёмки владельца");
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "lisa-presentation-sent-draft-"));
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
      draft_png_path: "candidate-evidence/frame-review/lisa-presentation-sent/draft-current-resolution.png",
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
    if (argumentsList.some((argument) => argument !== "--check")) fail("использование: node scripts/render-lisa-presentation-sent-review-draft.mjs [--check]");
    const manifest = renderDraft({ check: argumentsList.includes("--check") });
    process.stdout.write(argumentsList.includes("--check")
      ? `Черновой PNG кадра успеха актуален: ${manifest.draft_png_path}\n`
      : `Черновой PNG кадра успеха подготовлен: ${manifest.draft_png_path}\n`);
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "черновой PNG кадра успеха не подготовлен"}\n`);
    process.exitCode = 1;
  }
}

export { renderDraft };
