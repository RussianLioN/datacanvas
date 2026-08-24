import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import opentype from "opentype.js";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const SOURCE_PATH = `${PACKAGE_PATH}/source`;
const BASE_DIRECTORY = `${PACKAGE_PATH}/candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24`;
const BASE_SOURCE_PATH = `${BASE_DIRECTORY}/source.svg`;
const BASE_MANIFEST_PATH = `${BASE_DIRECTORY}/review-source-manifest.json`;
const BASE_APPROVAL_PATH = `${BASE_DIRECTORY}/owner-approval.json`;
const REVIEW_DIRECTORY = `${PACKAGE_PATH}/candidate-evidence/frame-review/lisa-presentation-sent`;
const REVIEW_SOURCE_PATH = `${REVIEW_DIRECTORY}/source.svg`;
const REVIEW_MANIFEST_PATH = `${REVIEW_DIRECTORY}/review-source-manifest.json`;
const APPROVED_TEXTS_PATH = `${SOURCE_PATH}/owner-approved-texts.json`;
const FIXTURE_MANIFEST_PATH = `${SOURCE_PATH}/source-fixture-manifest.json`;
const PHONE_STATUS_TIME_DONOR_PATH = `${PACKAGE_PATH}/editable-sources/7.3 — Презентация.svg`;
const PHONE_STATUS_TIME_VALUE = "13:40";
const SUCCESS_MESSAGE = "Презентация готова и направлена по электронной почте в ЧЧ:ММ.";
const DISPLAY_LINES = Object.freeze([
  "Презентация готова и направлена",
  "по электронной почте в 13:38.",
]);
const STATUS_FILL = "rgb(73,80,94)";
const STATUS_FONT_SIZE = 11.5;
const STATUS_X = 80;
const STATUS_BASELINES = Object.freeze([3048, 3064]);
const STATUS_SAFE_AREA = Object.freeze({ x: 80, y: 3036, width: 345, height: 40 });
const FOOTER_PARENT_TRANSLATE_Y = -2050;
const STATUS_SOURCE_BASELINES = Object.freeze(
  STATUS_BASELINES.map((baseline) => baseline - FOOTER_PARENT_TRANSLATE_Y),
);
const BASE_CANVAS_HEIGHT = 3226;
const CANVAS_HEIGHT = 3290;
const BASE_FRAME_HEIGHT = 3045;
const FRAME_HEIGHT = 3109;
const BASE_FOOTER_HEIGHT = 244;
const FOOTER_HEIGHT = 308;
const BASE_FOOTER_EXTENSION = 82;
const FOOTER_EXTENSION = 146;

function fail(message) {
  throw new Error(message);
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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

function findGroupRangeAt(source, start, label) {
  const openEnd = source.indexOf(">", start);
  if (openEnd < 0) fail(`не найдено окончание открывающего тега SVG: ${label}`);
  const groupTags = /<\/?g\b[^>]*>/gu;
  groupTags.lastIndex = openEnd + 1;
  let depth = 1;
  for (let match = groupTags.exec(source); match; match = groupTags.exec(source)) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return { start, end: groupTags.lastIndex };
  }
  fail(`не найдено закрытие существующей группы SVG: ${label}`);
}

function findGroupRange(source, id) {
  const start = source.indexOf(`<g id="${id}"`);
  if (start < 0) fail(`не найдена существующая группа SVG: ${id}`);
  return findGroupRangeAt(source, start, id);
}

function groupMarkup(source, id) {
  const range = findGroupRange(source, id);
  return source.slice(range.start, range.end);
}

function replaceRange(source, range, replacement) {
  return source.slice(0, range.start) + replacement + source.slice(range.end);
}

function replaceAllExact(source, before, after, label, count) {
  const matches = source.split(before).length - 1;
  if (matches !== count) fail(`в SVG не найдено ожидаемое количество фрагментов «${label}»: ${matches} вместо ${count}`);
  return source.replaceAll(before, after);
}

function phoneStatusTimePathMarkup(source, label) {
  const matches = [...source.matchAll(/<path id="Time" d="[^"]+" fill="rgb\(0,0,0\)" fill-rule="nonzero" \/>/gu)];
  if (matches.length !== 1) fail(`в SVG найдено неверное число штатных контуров системного времени: ${label}`);
  return matches[0][0];
}

function replacePhoneStatusTime(source, donorSource) {
  const original = phoneStatusTimePathMarkup(source, "кадр успеха");
  const replacement = phoneStatusTimePathMarkup(donorSource, "канонический донор 13:40");
  if (original === replacement) fail("SVG кадра успеха уже содержит контур времени 13:40 до целевой замены");
  return source.replace(original, replacement);
}

function parseFont(bytes) {
  return opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}

function resolveOutlineFont(root) {
  const fixture = readJson(root, FIXTURE_MANIFEST_PATH).transient_raster_text_font;
  const candidate = path.join(os.homedir(), "Library", "Fonts", fixture.file_name);
  if (!fs.existsSync(candidate)) fail(`не найден согласованный локальный шрифт для векторных контуров: ${fixture.file_name}`);
  if (sha256File(candidate) !== fixture.sha256) fail("локальный шрифт не совпадает с закреплённым источником контуров");
  return { font: parseFont(fs.readFileSync(candidate)), fixture };
}

function outlineLine(font, text, { x, baseline, size, fill }) {
  const direct = font.getPath(text, 0, 0, size).toPathData(3);
  if (!direct.includes("NaN")) {
    return `<path d="${direct}" transform="translate(${x.toFixed(3)} ${baseline.toFixed(3)})" fill="${fill}" fill-rule="nonzero" />`;
  }
  let cursor = x;
  const glyphs = [];
  for (const character of text) {
    const glyph = font.charToGlyph(character);
    const d = glyph.getPath(0, 0, size).toPathData(3);
    if (d.includes("NaN")) fail(`контур символа «${character}» содержит недопустимые координаты`);
    glyphs.push(`<path d="${d}" transform="translate(${cursor.toFixed(3)} ${baseline.toFixed(3)})" fill="${fill}" fill-rule="nonzero" />`);
    cursor += glyph.advanceWidth * size / font.unitsPerEm;
  }
  return glyphs.join("");
}

function measuredLineWidth(font, text) {
  let width = 0;
  for (const character of text) {
    const advanceWidth = font.charToGlyph(character).advanceWidth;
    if (!Number.isFinite(advanceWidth)) fail(`не удалось измерить ширину символа «${character}»`);
    width += advanceWidth * STATUS_FONT_SIZE / font.unitsPerEm;
  }
  return Number(width.toFixed(3));
}

function validateStatusGeometry(font) {
  const lineWidths = DISPLAY_LINES.map((line) => measuredLineWidth(font, line));
  if (STATUS_X + Math.max(...lineWidths) > STATUS_SAFE_AREA.x + STATUS_SAFE_AREA.width) {
    fail("сообщение об успехе не помещается по ширине в нижнюю панель");
  }
  if (
    STATUS_BASELINES[0] - STATUS_FONT_SIZE < STATUS_SAFE_AREA.y ||
    STATUS_BASELINES.at(-1) + STATUS_FONT_SIZE * 0.25 > STATUS_SAFE_AREA.y + STATUS_SAFE_AREA.height
  ) {
    fail("сообщение об успехе пересекает границы выделенной зоны нижней панели");
  }
  return { safeArea: STATUS_SAFE_AREA, lineWidths };
}

function approvedText(root, topicId) {
  const approvedTexts = readJson(root, APPROVED_TEXTS_PATH);
  const selection = approvedTexts.selections.find((item) => item.topic_id === topicId);
  if (!selection) fail(`в реестре согласованных текстов отсутствует тема ${topicId}`);
  return { text: selection.text, sha256: sha256File(path.join(root, APPROVED_TEXTS_PATH)) };
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
    manifest.owner_frame_approval?.record_path !== "candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24/owner-approval.json" ||
    approval.frame_id !== "lisa-presentation-generating" ||
    approval.decision !== "approved" ||
    approval.approved_source_svg_sha256 !== sourceSha256 ||
    approval.approved_draft_png_sha256 !== sha256File(draftPath)
  ) {
    fail("основой кадра успеха должен быть принятый SVG начала формирования");
  }
  return { sourcePath, sourceSha256, approval };
}

function extendFooter(source) {
  let updated = source;
  updated = replaceAllExact(updated, `viewBox="0 0 521 ${BASE_CANVAS_HEIGHT}"`, `viewBox="0 0 521 ${CANVAS_HEIGHT}"`, "размер холста", 1);
  updated = replaceAllExact(updated, `height="${BASE_CANVAS_HEIGHT}.000000" fill="none"`, `height="${CANVAS_HEIGHT}.000000" fill="none"`, "высота холста", 1);
  updated = replaceAllExact(updated, `height="${BASE_FRAME_HEIGHT}.000000"`, `height="${FRAME_HEIGHT}.000000"`, "внешняя рамка и её отсечение", 2);
  updated = replaceAllExact(updated, `height="${BASE_FOOTER_HEIGHT}.000000"`, `height="${FOOTER_HEIGHT}.000000"`, "фон нижней панели и его отсечение", 2);
  updated = replaceAllExact(updated, `transform="translate(0 ${BASE_FOOTER_EXTENSION})"`, `transform="translate(0 ${FOOTER_EXTENSION})"`, "штатные нижние элементы", 2);
  return updated;
}

function appendSuccessStatus(source, font) {
  const range = findGroupRange(source, "button_footer_2.0");
  const original = source.slice(range.start, range.end);
  const lineMarkup = DISPLAY_LINES.map((line, index) => outlineLine(font, line, {
    x: STATUS_X,
    baseline: STATUS_SOURCE_BASELINES[index],
    size: STATUS_FONT_SIZE,
    fill: STATUS_FILL,
  })).join("");
  const statusMarkup = `<g id="lisa-review-delivery-success-status" data-review-role="delivery-success-message" aria-label="${escapeXml(SUCCESS_MESSAGE)}">${lineMarkup}</g>`;
  if (!original.endsWith("</g>")) fail("существующая группа нижней панели имеет непредвиденное окончание");
  return replaceRange(source, range, `${original.slice(0, -4)}${statusMarkup}</g>`);
}

function validateSource(source, baseSource, buttonLabel, phoneStatusTimeDonor) {
  if (
    /<text\b/u.test(source) ||
    source.includes("lisa-edit-") ||
    source.includes("lisa-status-") ||
    !source.includes('data-review-frame-id="lisa-presentation-generating" data-review-transition="same_screen_dynamic_state"') ||
    !source.includes(`aria-label="${escapeXml(buttonLabel)}"`) ||
    !source.includes('id="lisa-review-generation-status"') ||
    !source.includes('id="lisa-review-delivery-success-status"') ||
    !source.includes(`aria-label="${escapeXml(SUCCESS_MESSAGE)}"`) ||
    !source.includes('aria-disabled="true"') ||
    !source.includes('data-review-button-state="disabled"') ||
    !source.includes('fill="rgb(224,227,234)"') ||
    !source.includes(`viewBox="0 0 521 ${CANVAS_HEIGHT}"`) ||
    !source.includes(`height="${CANVAS_HEIGHT}.000000" fill="none"`) ||
    !source.includes(`height="${FRAME_HEIGHT}.000000"`) ||
    !source.includes(`height="${FOOTER_HEIGHT}.000000"`) ||
    !source.includes(`id="logo" customFrame="url(#clipPath_2089)" transform="translate(0 ${FOOTER_EXTENSION})"`) ||
    !source.includes(`id="Home indicator" clip-path="url(#clipPath_2091)" customFrame="url(#clipPath_2091)" transform="translate(0 ${FOOTER_EXTENSION})"`)
  ) {
    fail("SVG кадра успеха нарушает согласованную структуру продолжения");
  }
  if (
    source.indexOf('id="lisa-review-delivery-success-status"') < source.indexOf('id="lisa-review-generation-status"') ||
    source.indexOf('id="lisa-review-delivery-success-status"') < source.indexOf('id="Home indicator"')
  ) {
    fail("сообщение об успехе должно быть над фоном и после сообщения начала в той же нижней панели");
  }
  const success = groupMarkup(source, "lisa-review-delivery-success-status");
  if (/<(?:rect|circle|foreignObject|text)\b/u.test(success)) fail("сообщение об успехе не должно содержать отдельную карточку или растровую накладку");
  if (!source.includes(groupMarkup(baseSource, "lisa-review-generation-status"))) fail("кадр успеха не сохранил согласованное сообщение начала формирования");
  if (phoneStatusTimePathMarkup(source, "кадр успеха") !== phoneStatusTimePathMarkup(phoneStatusTimeDonor, "канонический донор 13:40")) {
    fail("системное время кадра успеха не заменено штатным контуром 13:40");
  }
}

function buildSource(root) {
  const base = verifyApprovedBase(root);
  const successText = approvedText(root, "delivery_success_message");
  if (successText.text !== SUCCESS_MESSAGE) fail("согласованное сообщение об успехе не совпадает с договором кадра");
  const button = approvedText(root, "button_label");
  const { font, fixture } = resolveOutlineFont(root);
  const statusGeometry = validateStatusGeometry(font);
  const baseSource = fs.readFileSync(base.sourcePath, "utf8");
  const phoneStatusTimeDonor = fs.readFileSync(path.join(root, PHONE_STATUS_TIME_DONOR_PATH), "utf8");
  let svg = replacePhoneStatusTime(baseSource, phoneStatusTimeDonor);
  svg = extendFooter(svg);
  svg = appendSuccessStatus(svg, font);
  validateSource(svg, baseSource, button.text, phoneStatusTimeDonor);
  return { svg, base, buttonLabel: button.text, approvedTextsSha256: successText.sha256, fixture, statusGeometry };
}

function generatedManifest({ svg, base, buttonLabel, approvedTextsSha256, fixture, statusGeometry }) {
  return {
    $schema: "../../../source/schemas/lisa-presentation-sent-review-source-manifest.schema.json",
    version: "1.0.0",
    frame_id: "lisa-presentation-sent",
    status: "svg_source_prepared_pending_visual_check",
    base_frame_id: "lisa-presentation-generating",
    base_svg_path: "candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24/source.svg",
    base_svg_sha256: base.sourceSha256,
    base_owner_approval_path: "candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24/owner-approval.json",
    transition_rendering_mode: "same_screen_dynamic_state",
    skipped_intermediate_frame_id: "lisa-presentation-chat-list",
    skipped_intermediate_frame_reason: "owner_direction_no_rework",
    source_svg_path: "candidate-evidence/frame-review/lisa-presentation-sent/source.svg",
    source_svg_sha256: sha256Text(svg),
    approved_texts_path: "source/owner-approved-texts.json",
    approved_texts_sha256: approvedTextsSha256,
    button_label_text: buttonLabel,
    mock_phone_status_time_value: PHONE_STATUS_TIME_VALUE,
    dynamic_footer: {
      button_translate_y: -18,
      background_fill: "rgb(224,227,234)",
      label_fill: "rgb(143,148,160)",
      generation_message_placement: "below_disabled_button",
      delivery_success_message_placement: "below_generation_message",
      extension_height: FOOTER_EXTENSION,
      canvas_height: CANVAS_HEIGHT,
    },
    delivery_success_message: {
      text: SUCCESS_MESSAGE,
      display_lines: DISPLAY_LINES,
      time_value: "13:38",
      inserted_into_existing_frame_group_id: "button_footer_2.0",
      font_size: STATUS_FONT_SIZE,
      fill: STATUS_FILL,
      baselines: STATUS_BASELINES,
      safe_area: statusGeometry.safeArea,
      line_widths: statusGeometry.lineWidths,
    },
    text_outline_font: {
      family: fixture.family,
      sha256: fixture.sha256,
      copied_to_git: false,
    },
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
  fs.writeFileSync(reviewSourcePath, built.svg, "utf8");
  fs.writeFileSync(manifestPath, `${JSON.stringify(generatedManifest(built), null, 2)}\n`, "utf8");
}

function checkReviewSource({ root = process.cwd() } = {}) {
  const reviewSourcePath = path.join(root, REVIEW_SOURCE_PATH);
  const manifestPath = path.join(root, REVIEW_MANIFEST_PATH);
  const built = buildSource(root);
  const manifest = readJson(root, REVIEW_MANIFEST_PATH);
  if (fs.readFileSync(reviewSourcePath, "utf8") !== built.svg) fail("сохранённый SVG кадра успеха не совпадает с повторной подготовкой из принятого SVG начала");
  const expected = generatedManifest(built);
  for (const [key, value] of Object.entries(expected)) {
    if (key === "status" || key.startsWith("draft_png_")) continue;
    if (JSON.stringify(manifest[key]) !== JSON.stringify(value)) fail(`манифест кадра успеха не совпадает с каноническим SVG по полю ${key}`);
  }
  if (manifest.status !== "draft_png_rendered_pending_owner_approval" || manifest.draft_png_rendered !== true) {
    fail("черновой PNG кадра успеха не подготовлен для приёмки владельца");
  }
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  try {
    const argumentsList = process.argv.slice(2);
    if (argumentsList.some((argument) => argument !== "--check")) fail("использование: node scripts/prepare-lisa-presentation-sent-review-source.mjs [--check]");
    if (argumentsList.includes("--check")) {
      const manifest = checkReviewSource();
      process.stdout.write(`SVG кадра успеха актуален: ${manifest.source_svg_path}\n`);
    } else {
      prepareReviewSource();
      process.stdout.write(`SVG кадра успеха подготовлен: ${REVIEW_SOURCE_PATH}\n`);
    }
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "SVG кадра успеха не подготовлен"}\n`);
    process.exitCode = 1;
  }
}

export { checkReviewSource, prepareReviewSource };
