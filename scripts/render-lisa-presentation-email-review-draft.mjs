import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { inspectPng } from "./render-lisa-full-reference-review-draft.mjs";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const REVIEW_DIRECTORY = `${PACKAGE_PATH}/candidate-evidence/frame-review/lisa-presentation-email`;
const SOURCE_PATH = `${REVIEW_DIRECTORY}/source.svg`;
const MANIFEST_PATH = `${REVIEW_DIRECTORY}/review-source-manifest.json`;
const APPROVAL_PATH = `${REVIEW_DIRECTORY}/owner-approval.json`;
const DRAFT_PATH = `${REVIEW_DIRECTORY}/draft-current-resolution.png`;
const EXPECTED_DIMENSIONS = Object.freeze({ width: 1280, height: 960 });

function fail(message) {
  throw new Error(message);
}

function sha256(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function rendererCommand() {
  const candidates = ["/opt/homebrew/bin/rsvg-convert", "/usr/local/bin/rsvg-convert", "/usr/bin/rsvg-convert", "rsvg-convert"];
  for (const candidate of candidates) {
    if (spawnSync(candidate, ["--version"], { encoding: "utf8" }).status === 0) return candidate;
  }
  fail("не найден rsvg-convert для чернового PNG письма");
}

function expectedApprovalSummary() {
  return {
    record_path: "candidate-evidence/frame-review/lisa-presentation-email/owner-approval.json",
    decision: "approved",
    decision_text: "ok",
    decision_source: "Product Owner в рабочем чате",
    approval_time_precision: "date_only",
    approved_on: "2026-08-24",
  };
}

function validateManifest(manifest) {
  if (
    manifest.frame_id !== "lisa-presentation-email" ||
    !["svg_source_prepared_pending_visual_check", "draft_png_rendered_pending_owner_approval", "owner_frame_approved"].includes(manifest.status) ||
    (manifest.status === "owner_frame_approved" && JSON.stringify(manifest.owner_frame_approval) !== JSON.stringify(expectedApprovalSummary())) ||
    (manifest.status !== "owner_frame_approved" && manifest.owner_frame_approval !== null) ||
    manifest.source_svg_path !== "candidate-evidence/frame-review/lisa-presentation-email/source.svg" ||
    manifest.visual_reference_id !== "owner_supplied_outlook_corporate_email_screenshot_2026_08_19" ||
    manifest.visual_reference_persisted_in_repository !== false ||
    manifest.recipient !== "Солодовников Роман Юрьевич" ||
    JSON.stringify(manifest.signature_lines) !== JSON.stringify(["С уважением,", "команда «ЕФС • Наш бизнес»"]) ||
    JSON.stringify(manifest.attachments) !== JSON.stringify([
      { display_name: "Презентация по справке.pptx", format: "PPTX" },
      { display_name: "Презентация по справке.pdf", format: "PDF" },
    ]) ||
    manifest.active_release_mutation_prohibited !== true
  ) fail("манифест кадра письма не соответствует договору черновой приёмки");
}

function validateAcceptedApproval(root, manifest) {
  if (manifest.status !== "owner_frame_approved") return;
  const approvalPath = path.join(root, APPROVAL_PATH);
  if (!fs.existsSync(approvalPath)) fail("принятому кадру письма нужна запись приёмки владельца");
  const approval = readJson(approvalPath);
  if (
    approval.frame_id !== "lisa-presentation-email" ||
    approval.decision !== "approved" ||
    approval.decision_text !== "ok" ||
    approval.decision_source !== "Product Owner в рабочем чате" ||
    approval.approval_time_precision !== "date_only" ||
    approval.approved_on !== "2026-08-24" ||
    !approval.decision_evidence_note ||
    approval.approved_source_svg_sha256 !== manifest.source_svg_sha256 ||
    approval.approved_draft_png_sha256 !== manifest.draft_png_sha256
  ) fail("запись приёмки кадра письма не совпадает с сохранёнными SVG и PNG");
}

function renderDraft({ root = process.cwd(), check = false } = {}) {
  const sourcePath = path.join(root, SOURCE_PATH);
  const manifestPath = path.join(root, MANIFEST_PATH);
  const draftPath = path.join(root, DRAFT_PATH);
  const manifest = readJson(manifestPath);
  validateManifest(manifest);
  validateAcceptedApproval(root, manifest);
  const source = fs.readFileSync(sourcePath, "utf8");
  if (/<image\b/u.test(source)) fail("SVG кадра письма содержит запрещённую растровую подложку");
  if (manifest.source_svg_sha256 !== sha256(sourcePath)) fail("манифест кадра письма не совпадает с SVG-источником");
  if (check) {
    if (!["draft_png_rendered_pending_owner_approval", "owner_frame_approved"].includes(manifest.status) || manifest.draft_png_rendered !== true) {
      fail("черновой PNG письма ещё не подготовлен для покадровой приёмки");
    }
    const inspected = inspectPng(draftPath, EXPECTED_DIMENSIONS);
    if (
      manifest.draft_png_path !== "candidate-evidence/frame-review/lisa-presentation-email/draft-current-resolution.png" ||
      manifest.draft_png_sha256 !== sha256(draftPath) ||
      JSON.stringify(manifest.draft_png_dimensions) !== JSON.stringify(EXPECTED_DIMENSIONS) ||
      manifest.draft_png_non_white_pixel_count !== inspected.non_white_pixel_count
    ) fail("манифест кадра письма не соответствует сохранённому PNG");
    return manifest;
  }
  if (manifest.status !== "svg_source_prepared_pending_visual_check" || manifest.draft_png_rendered !== false) {
    fail("PNG письма можно создавать только один раз из нового SVG до приёмки владельца");
  }
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "lisa-presentation-email-draft-"));
  const temporaryPng = path.join(temporaryDirectory, "draft.png");
  try {
    const result = spawnSync(rendererCommand(), [sourcePath, "--output", temporaryPng], { encoding: "utf8" });
    if (result.status !== 0) fail(`rsvg-convert не создал PNG письма: ${(result.stderr || result.stdout || "неизвестная ошибка").trim()}`);
    const inspected = inspectPng(temporaryPng, EXPECTED_DIMENSIONS);
    fs.renameSync(temporaryPng, draftPath);
    const updated = {
      ...manifest,
      status: "draft_png_rendered_pending_owner_approval",
      draft_png_rendered: true,
      draft_png_path: "candidate-evidence/frame-review/lisa-presentation-email/draft-current-resolution.png",
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
    if (argumentsList.some((argument) => argument !== "--check")) fail("использование: node scripts/render-lisa-presentation-email-review-draft.mjs [--check]");
    const manifest = renderDraft({ check: argumentsList.includes("--check") });
    process.stdout.write(argumentsList.includes("--check")
      ? `Черновой PNG письма актуален: ${manifest.draft_png_path}\n`
      : `Черновой PNG письма подготовлен: ${manifest.draft_png_path}\n`);
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "черновой PNG письма не подготовлен"}\n`);
    process.exitCode = 1;
  }
}

export { renderDraft };
