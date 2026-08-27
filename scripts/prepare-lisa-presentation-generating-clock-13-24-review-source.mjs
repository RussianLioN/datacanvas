import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const BASE_DIRECTORY = `${PACKAGE_PATH}/candidate-evidence/frame-review/lisa-presentation-generating`;
const BASE_SOURCE_PATH = `${BASE_DIRECTORY}/source.svg`;
const BASE_MANIFEST_PATH = `${BASE_DIRECTORY}/review-source-manifest.json`;
const BASE_APPROVAL_PATH = `${BASE_DIRECTORY}/owner-approval.json`;
const TIME_DONOR_PATH = `${PACKAGE_PATH}/editable-sources/08.svg`;
const REVIEW_DIRECTORY = `${PACKAGE_PATH}/candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24`;
const REVIEW_SOURCE_PATH = `${REVIEW_DIRECTORY}/source.svg`;
const REVIEW_MANIFEST_PATH = `${REVIEW_DIRECTORY}/review-source-manifest.json`;
const REVIEW_APPROVAL_PATH = `${REVIEW_DIRECTORY}/owner-approval.json`;
const MOCK_PHONE_STATUS_TIME_VALUE = "13:24";

function fail(message) {
  throw new Error(message);
}

function sha256File(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function phoneStatusTimePathMarkup(source, label) {
  const matches = [...source.matchAll(/<path id="Time" d="[^"]+" fill="rgb\(0,0,0\)" fill-rule="nonzero" \/>/gu)];
  if (matches.length !== 1) fail(`в SVG найдено неверное число штатных контуров системного времени: ${label}`);
  return matches[0][0];
}

function verifyApprovedBase(root) {
  const sourcePath = path.join(root, BASE_SOURCE_PATH);
  const manifest = readJson(root, BASE_MANIFEST_PATH);
  const approval = readJson(root, BASE_APPROVAL_PATH);
  const sourceSha256 = sha256File(sourcePath);
  const draftPath = path.join(root, BASE_DIRECTORY, "draft-current-resolution.png");
  if (
    manifest.frame_id !== "lisa-presentation-generating" ||
    manifest.status !== "owner_frame_approved" ||
    manifest.source_svg_sha256 !== sourceSha256 ||
    approval.frame_id !== "lisa-presentation-generating" ||
    approval.decision !== "approved" ||
    approval.approved_source_svg_sha256 !== sourceSha256 ||
    approval.approved_draft_png_sha256 !== sha256File(draftPath)
  ) {
    fail("основой исправляющей версии должен быть принятый SVG начала формирования");
  }
  return { sourcePath, sourceSha256 };
}

function buildSource(root) {
  const base = verifyApprovedBase(root);
  const baseSource = fs.readFileSync(base.sourcePath, "utf8");
  const donorSource = fs.readFileSync(path.join(root, TIME_DONOR_PATH), "utf8");
  const currentTimePath = phoneStatusTimePathMarkup(baseSource, "принятый кадр начала формирования");
  const replacementTimePath = phoneStatusTimePathMarkup(donorSource, "канонический донор 13:24");
  if (currentTimePath === replacementTimePath) fail("принятый кадр уже содержит системное время 13:24");
  const source = baseSource.replace(currentTimePath, replacementTimePath);
  if (source === baseSource) fail("штатный контур системного времени не заменён");
  return { source, base };
}

function generatedManifest({ source, base }) {
  return {
    $schema: "../../../source/schemas/lisa-presentation-generating-clock-13-24-review-source-manifest.schema.json",
    version: "1.0.0",
    frame_id: "lisa-presentation-generating",
    status: "svg_source_prepared_pending_visual_check",
    correction_scope: "mock_phone_status_time_only",
    correction_reason: "системное время не может предшествовать сообщению о начале формирования",
    base_source_svg_path: "candidate-evidence/frame-review/lisa-presentation-generating/source.svg",
    base_source_svg_sha256: base.sourceSha256,
    base_owner_approval_path: "candidate-evidence/frame-review/lisa-presentation-generating/owner-approval.json",
    mock_phone_status_time_value: MOCK_PHONE_STATUS_TIME_VALUE,
    mock_phone_status_time_donor_svg_path: "editable-sources/08.svg",
    source_svg_path: "candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24/source.svg",
    source_svg_sha256: sha256Text(source),
    active_release_mutation_prohibited: true,
    draft_png_rendered: false,
    draft_png_path: null,
    draft_png_sha256: null,
    draft_png_dimensions: null,
    draft_png_non_white_pixel_count: null,
    owner_frame_approval: null,
  };
}

function prepareReviewSource({ root = process.cwd() } = {}) {
  const reviewSourcePath = path.join(root, REVIEW_SOURCE_PATH);
  const manifestPath = path.join(root, REVIEW_MANIFEST_PATH);
  const built = buildSource(root);
  fs.mkdirSync(path.dirname(reviewSourcePath), { recursive: true });
  fs.writeFileSync(reviewSourcePath, built.source, "utf8");
  fs.writeFileSync(manifestPath, `${JSON.stringify(generatedManifest(built), null, 2)}\n`, "utf8");
  return generatedManifest(built);
}

function checkReviewSource({ root = process.cwd() } = {}) {
  const built = buildSource(root);
  const source = fs.readFileSync(path.join(root, REVIEW_SOURCE_PATH), "utf8");
  const manifest = readJson(root, REVIEW_MANIFEST_PATH);
  if (source !== built.source) fail("сохранённый SVG исправления времени не совпадает с повторной подготовкой из принятого кадра");
  const expected = generatedManifest(built);
  for (const [key, value] of Object.entries(expected)) {
    if (key === "status" || key.startsWith("draft_png_") || key === "owner_frame_approval") continue;
    if (JSON.stringify(manifest[key]) !== JSON.stringify(value)) fail(`манифест исправления времени не совпадает с SVG по полю ${key}`);
  }
  if (manifest.status === "owner_frame_approved") {
    const approval = readJson(root, REVIEW_APPROVAL_PATH);
    const summary = {
      record_path: "candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24/owner-approval.json",
      decision: "approved",
      decision_text: "кадр принят",
      decision_source: "Product Owner в рабочем чате",
      approved_at: approval.approved_at,
    };
    if (
      JSON.stringify(manifest.owner_frame_approval) !== JSON.stringify(summary) ||
      approval.frame_id !== "lisa-presentation-generating" ||
      approval.decision !== "approved" ||
      approval.approved_source_svg_sha256 !== manifest.source_svg_sha256 ||
      approval.approved_draft_png_sha256 !== manifest.draft_png_sha256
    ) fail("приёмка исправления времени должна связывать принятые SVG и PNG с записью владельца");
  } else if (manifest.status !== "draft_png_rendered_pending_owner_approval" || manifest.owner_frame_approval !== null) {
    fail("черновой PNG исправления времени не подготовлен для приёмки владельца");
  }
  if (manifest.draft_png_rendered !== true) fail("черновой PNG исправления времени отсутствует");
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  try {
    const argumentsList = process.argv.slice(2);
    if (argumentsList.some((argument) => argument !== "--check")) fail("использование: node scripts/prepare-lisa-presentation-generating-clock-13-24-review-source.mjs [--check]");
    const manifest = argumentsList.includes("--check") ? checkReviewSource() : prepareReviewSource();
    process.stdout.write(argumentsList.includes("--check")
      ? `SVG исправления времени актуален: ${manifest.source_svg_path}\n`
      : `SVG исправления времени подготовлен: ${manifest.source_svg_path}\n`);
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "SVG исправления времени не подготовлен"}\n`);
    process.exitCode = 1;
  }
}

export { checkReviewSource, prepareReviewSource };
