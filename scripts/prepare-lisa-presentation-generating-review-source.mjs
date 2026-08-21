import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import opentype from "opentype.js";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const SOURCE_PATH = `${PACKAGE_PATH}/source`;
const BASE_FRAME_ID = "lisa-materials-full-reference";
const BASE_SVG_PATH = "candidate-evidence/frame-review/lisa-materials-full-reference/source.svg";
const BASE_MANIFEST_PATH = "candidate-evidence/frame-review/lisa-materials-full-reference/review-source-manifest.json";
const BASE_OWNER_APPROVAL_PATH = "candidate-evidence/frame-review/lisa-materials-full-reference/owner-approval.json";
const REVIEW_DIRECTORY = `${PACKAGE_PATH}/candidate-evidence/frame-review/lisa-presentation-generating`;
const REVIEW_SOURCE_PATH = `${REVIEW_DIRECTORY}/source.svg`;
const REVIEW_MANIFEST_PATH = `${REVIEW_DIRECTORY}/review-source-manifest.json`;
const APPROVED_TEXTS_PATH = `${SOURCE_PATH}/owner-approved-texts.json`;
const FIXTURE_MANIFEST_PATH = `${SOURCE_PATH}/source-fixture-manifest.json`;
const GENERATION_MESSAGE = "Формирование презентации началось в ЧЧ:ММ и займет не более 20 минут. После завершения презентация будет направлена по электронной почте в SIGMA и OMEGA.";
const DISPLAY_LINES = Object.freeze([
  "Формирование презентации началось в 13:24",
  "и займет не более 20 минут.",
  "После завершения презентация будет направлена",
  "по электронной почте в SIGMA и OMEGA.",
]);
const VISIBLE_GROUP_IDS = Object.freeze([
  "general_information",
  "business_owners",
  "financial_indicators",
  "cooperation",
  "sber_share",
  "active_deals",
  "potential",
  "preapproved_offers",
  "insights",
  "meeting_agreements",
]);
const STATUS_FILL = "rgb(87,92,112)";
const STATUS_X = 80;
const STATUS_BASELINES = Object.freeze([2834, 2850, 2866, 2882]);
const STATUS_FONT_SIZE = 10;
const STATUS_SAFE_AREA = Object.freeze({ x: 80, y: 2815, width: 361, height: 79 });
const DISABLED_BUTTON_OPACITY = 0.45;

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
    if (depth === 0) return { start, openEnd: openEnd + 1, end: groupTags.lastIndex };
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

function measuredLineWidth(font, text, size) {
  let width = 0;
  for (const character of text) {
    const advanceWidth = font.charToGlyph(character).advanceWidth;
    if (!Number.isFinite(advanceWidth)) fail(`не удалось измерить ширину символа «${character}»`);
    width += advanceWidth * size / font.unitsPerEm;
  }
  return Number(width.toFixed(3));
}

function validateStatusGeometry(font) {
  const lineWidths = DISPLAY_LINES.map((line) => measuredLineWidth(font, line, STATUS_FONT_SIZE));
  if (STATUS_X < STATUS_SAFE_AREA.x || STATUS_X + Math.max(...lineWidths) > STATUS_SAFE_AREA.x + STATUS_SAFE_AREA.width) {
    fail("текст сообщения о начале не помещается по ширине в свободную зону над кнопкой");
  }
  const firstBaseline = STATUS_BASELINES[0];
  const lastBaseline = STATUS_BASELINES.at(-1);
  if (
    firstBaseline - STATUS_FONT_SIZE < STATUS_SAFE_AREA.y ||
    lastBaseline + STATUS_FONT_SIZE * 0.25 > STATUS_SAFE_AREA.y + STATUS_SAFE_AREA.height
  ) {
    fail("текст сообщения о начале пересекает границы свободной зоны над кнопкой");
  }
  return { safeArea: STATUS_SAFE_AREA, lineWidths };
}

function approvedText(approvedTexts, topicId) {
  const selection = approvedTexts.selections.find((item) => item.topic_id === topicId);
  if (!selection) fail(`в реестре согласованных текстов отсутствует тема ${topicId}`);
  return selection.text;
}

function verifyApprovedBase(root) {
  const basePath = path.join(root, PACKAGE_PATH, BASE_SVG_PATH);
  const baseManifest = readJson(root, `${PACKAGE_PATH}/${BASE_MANIFEST_PATH}`);
  const approval = readJson(root, `${PACKAGE_PATH}/${BASE_OWNER_APPROVAL_PATH}`);
  const baseSha256 = sha256File(basePath);
  if (baseManifest.frame_id !== BASE_FRAME_ID || baseManifest.status !== "owner_frame_approved") {
    fail("основой кадра начала формирования должна быть принятая полная справка");
  }
  if (
    approval.frame_id !== BASE_FRAME_ID ||
    approval.decision !== "approved" ||
    approval.approved_source_svg_sha256 !== baseSha256 ||
    baseManifest.source_svg_sha256 !== baseSha256
  ) {
    fail("принятый SVG полной справки не совпадает с записью решения владельца");
  }
  return { basePath, baseManifest, approval, baseSha256 };
}

function replaceFrameIdentity(source) {
  const range = findGroupRange(source, "Group 2131328969");
  const original = source.slice(range.start, range.end);
  const updated = original.replace(
    'data-review-frame-id="lisa-materials-full-reference"',
    'data-review-frame-id="lisa-presentation-generating" data-review-transition="same_screen_dynamic_state"',
  );
  if (updated === original) fail("в принятом SVG не найдена идентичность полной справки");
  return replaceRange(source, range, updated);
}

function disableExistingButton(source) {
  const range = findGroupRange(source, "buttons_2.0");
  const original = source.slice(range.start, range.end);
  const openingEnd = original.indexOf(">") + 1;
  const opening = original.slice(0, openingEnd);
  if (opening.includes("aria-disabled=")) fail("в принятом SVG нижняя кнопка уже имеет состояние блокировки");
  const disabledOpening = `${opening.slice(0, -1)} opacity="${DISABLED_BUTTON_OPACITY}" aria-disabled="true" data-review-button-state="disabled">`;
  return replaceRange(source, range, `${disabledOpening}${original.slice(openingEnd)}`);
}

function appendGenerationStatus(source, font) {
  const range = findGroupRange(source, "Group 2131328969");
  const original = source.slice(range.start, range.end);
  const lineMarkup = DISPLAY_LINES.map((line, index) => outlineLine(font, line, {
    x: STATUS_X,
    baseline: STATUS_BASELINES[index],
    size: STATUS_FONT_SIZE,
    fill: STATUS_FILL,
  })).join("");
  const statusMarkup = `<g id="lisa-review-generation-status" data-review-role="generation-started-message" aria-label="${escapeXml(GENERATION_MESSAGE)}">${lineMarkup}</g>`;
  if (!original.endsWith("</g>")) fail("существующая группа полной справки имеет непредвиденное окончание");
  return replaceRange(source, range, `${original.slice(0, -4)}${statusMarkup}</g>`);
}

function verifyPreservedReferenceGroups(baseSource, source) {
  for (const groupId of VISIBLE_GROUP_IDS) {
    const markup = groupMarkup(baseSource, `lisa-review-group-${groupId}`);
    if (!source.includes(markup)) fail(`кадр начала формирования утратил содержимое принятой группы ${groupId}`);
  }
}

function validateSource(source, baseSource, buttonLabel) {
  for (const id of ["Frame 2131329748", "Group 2131328969", "button_footer_2.0", "buttons_2.0", "Paw"]) {
    if (!source.includes(`id="${id}"`)) fail(`в SVG продолжения утрачен обязательный существующий идентификатор ${id}`);
  }
  if (source.includes("7.2 — Длинное название клиента + холдинг.svg")) fail("SVG продолжения не должен ссылаться на короткий кадр 7.2");
  if (source.includes("lisa-edit-") || source.includes("lisa-status-") || /<text\b/u.test(source)) {
    fail("SVG продолжения содержит запрещённую накладку или текстовый элемент");
  }
  const status = groupMarkup(source, "lisa-review-generation-status");
  if (/<(?:rect|circle|foreignObject|text)\b/u.test(status)) fail("сообщение о начале не должно содержать самостоятельную карточку или растровую накладку");
  if (!status.includes(`aria-label="${escapeXml(GENERATION_MESSAGE)}"`)) fail("в SVG отсутствует согласованное сообщение о начале формирования");
  if (!source.includes(`aria-label="${escapeXml(buttonLabel)}"`)) fail("в SVG отсутствует согласованная подпись кнопки");
  const disabledButton = groupMarkup(source, "buttons_2.0");
  if (!disabledButton.includes('aria-disabled="true"') || !disabledButton.includes('data-review-button-state="disabled"')) {
    fail("кнопка заказа должна сохранять исходную группу и быть погашена после нажатия");
  }
  if (!source.includes('data-review-frame-id="lisa-presentation-generating" data-review-transition="same_screen_dynamic_state"')) {
    fail("SVG должен фиксировать динамическое продолжение того же полного экрана");
  }
  verifyPreservedReferenceGroups(baseSource, source);
}

function buildSource(root) {
  const approvedTexts = readJson(root, APPROVED_TEXTS_PATH);
  if (approvedTexts.status !== "owner_approved") fail("реестр текстов не подтвержден владельцем");
  const buttonLabel = approvedText(approvedTexts, "button_label");
  if (approvedText(approvedTexts, "generation_started_message") !== GENERATION_MESSAGE) {
    fail("согласованное сообщение о начале формирования не совпадает с договором кадра");
  }
  const base = verifyApprovedBase(root);
  const { font, fixture } = resolveOutlineFont(root);
  const statusGeometry = validateStatusGeometry(font);
  const baseSource = fs.readFileSync(base.basePath, "utf8");
  let svg = replaceFrameIdentity(baseSource);
  svg = disableExistingButton(svg);
  svg = appendGenerationStatus(svg, font);
  validateSource(svg, baseSource, buttonLabel);
  return { svg, base, approvedTexts, buttonLabel, fixture, statusGeometry };
}

function generatedManifest({ svg, base, approvedTexts, buttonLabel, fixture, statusGeometry }, root) {
  return {
    $schema: "../../../source/schemas/lisa-presentation-generating-review-source-manifest.schema.json",
    version: "2.0.0",
    frame_id: "lisa-presentation-generating",
    status: "svg_source_prepared_pending_visual_check",
    base_frame_id: BASE_FRAME_ID,
    base_svg_path: BASE_SVG_PATH,
    base_svg_sha256: base.baseSha256,
    base_owner_approval_path: BASE_OWNER_APPROVAL_PATH,
    base_owner_approved_svg_sha256: base.approval.approved_source_svg_sha256,
    transition_rendering_mode: "same_screen_dynamic_state",
    source_svg_path: "candidate-evidence/frame-review/lisa-presentation-generating/source.svg",
    source_svg_sha256: sha256Text(svg),
    approved_texts_path: "source/owner-approved-texts.json",
    approved_texts_sha256: sha256File(path.join(root, APPROVED_TEXTS_PATH)),
    button_label_text: buttonLabel,
    disabled_button: {
      existing_group_id: "buttons_2.0",
      aria_disabled: true,
      opacity: DISABLED_BUTTON_OPACITY,
      label_unchanged: true,
    },
    generation_started_message: {
      text: GENERATION_MESSAGE,
      display_lines: DISPLAY_LINES,
      time_value: "13:24",
      inserted_into_existing_frame_group_id: "Group 2131328969",
      font_size: STATUS_FONT_SIZE,
      fill: STATUS_FILL,
      baselines: STATUS_BASELINES,
      safe_area: statusGeometry.safeArea,
      line_widths: statusGeometry.lineWidths,
    },
    preserved_visible_group_ids: VISIBLE_GROUP_IDS,
    modified_existing_group_ids: ["Group 2131328969", "buttons_2.0"],
    prohibited_legacy_overlay_ids: ["lisa-edit-5-4-title", "lisa-status-"],
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
  const manifest = generatedManifest(built, root);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

function checkReviewSource({ root = process.cwd() } = {}) {
  const reviewSourcePath = path.join(root, REVIEW_SOURCE_PATH);
  const manifestPath = path.join(root, REVIEW_MANIFEST_PATH);
  const built = buildSource(root);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (fs.readFileSync(reviewSourcePath, "utf8") !== built.svg) fail("сохранённый SVG второго кадра не совпадает с повторной подготовкой из принятой полной справки");
  const expected = generatedManifest(built, root);
  for (const [key, value] of Object.entries(expected)) {
    if (key === "status" || key.startsWith("draft_png_")) continue;
    if (JSON.stringify(manifest[key]) !== JSON.stringify(value)) fail(`манифест второго кадра не совпадает с каноническим SVG по полю ${key}`);
  }
  if (manifest.status !== "draft_png_rendered_pending_owner_approval" || manifest.draft_png_rendered !== true) {
    fail("черновой PNG второго кадра не подготовлен для приёмки владельца");
  }
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  try {
    const argumentsList = process.argv.slice(2);
    if (argumentsList.some((argument) => argument !== "--check")) fail("использование: node scripts/prepare-lisa-presentation-generating-review-source.mjs [--check]");
    const manifest = argumentsList.includes("--check") ? checkReviewSource() : prepareReviewSource();
    process.stdout.write(argumentsList.includes("--check")
      ? `SVG второго кадра актуален: ${manifest.source_svg_path}\n`
      : `SVG второго кадра подготовлен: ${manifest.source_svg_path}\n`);
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "SVG второго кадра не подготовлен"}\n`);
    process.exitCode = 1;
  }
}

export { checkReviewSource, prepareReviewSource };
