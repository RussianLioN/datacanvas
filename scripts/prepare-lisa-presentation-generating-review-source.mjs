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
const OWNER_APPROVAL_PATH = `${REVIEW_DIRECTORY}/owner-approval.json`;
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
const STATUS_FILL = "rgb(73,80,94)";
const STATUS_X = 80;
const STATUS_BASELINES = Object.freeze([2970, 2986, 3002, 3018]);
// Нижняя панель уже имеет штатное смещение на -2050 по оси Y. Контуры
// размещаем внутри неё после её фона, поэтому сохраняем в манифесте видимые
// координаты, а в SVG передаём координаты локальной системы этой группы.
const FOOTER_PARENT_TRANSLATE_Y = -2050;
const STATUS_SOURCE_BASELINES = Object.freeze(
  STATUS_BASELINES.map((baseline) => baseline - FOOTER_PARENT_TRANSLATE_Y),
);
const STATUS_FONT_SIZE = 11.5;
const STATUS_SAFE_AREA = Object.freeze({ x: 80, y: 2958, width: 345, height: 64 });
const DISABLED_BUTTON_OPACITY = 1;
const DISABLED_BUTTON_TRANSLATE_Y = -18;
const DISABLED_BUTTON_BACKGROUND_FILL = "rgb(224,227,234)";
const DISABLED_BUTTON_LABEL_FILL = "rgb(143,148,160)";
const DYNAMIC_FOOTER_EXTENSION = 82;
const DYNAMIC_CANVAS_HEIGHT = 3226;
const DYNAMIC_FRAME_HEIGHT = 3045;
const DYNAMIC_FOOTER_HEIGHT = 244;

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

function readOwnerApproval(root) {
  const approvalPath = path.join(root, OWNER_APPROVAL_PATH);
  return fs.existsSync(approvalPath) ? readJson(root, OWNER_APPROVAL_PATH) : null;
}

function ownerApprovalSummary(approval) {
  return {
    record_path: "candidate-evidence/frame-review/lisa-presentation-generating/owner-approval.json",
    decision: approval.decision,
    decision_text: approval.decision_text,
    decision_source: approval.decision_source,
    approved_at: approval.approved_at,
  };
}

function validateOwnerApproval(approval, sourceSvgSha256, draftPngSha256) {
  if (!approval) return;
  if (
    approval.change_order_id !== "CO-2026-003" ||
    approval.frame_id !== "lisa-presentation-generating" ||
    approval.decision !== "approved" ||
    approval.decision_text !== "кадр принят" ||
    approval.decision_source !== "Product Owner в рабочем чате" ||
    approval.approved_source_svg_sha256 !== sourceSvgSha256 ||
    approval.approved_draft_png_sha256 !== draftPngSha256
  ) {
    fail("запись приёмки владельца не соответствует SVG и PNG кадра начала формирования");
  }
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
    fail("текст сообщения о начале не помещается по ширине в зону под погашенной кнопкой");
  }
  const firstBaseline = STATUS_BASELINES[0];
  const lastBaseline = STATUS_BASELINES.at(-1);
  if (
    firstBaseline - STATUS_FONT_SIZE < STATUS_SAFE_AREA.y ||
    lastBaseline + STATUS_FONT_SIZE * 0.25 > STATUS_SAFE_AREA.y + STATUS_SAFE_AREA.height
  ) {
    fail("текст сообщения о начале пересекает границы зоны под погашенной кнопкой");
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

function replaceExactOccurrences(source, before, after, expectedCount, label) {
  const count = source.split(before).length - 1;
  if (count !== expectedCount) fail(`SVG продолжения содержит непредвиденное число фрагментов: ${label}`);
  return source.replaceAll(before, after);
}

function translateExistingGroup(source, id, deltaY) {
  const range = findGroupRange(source, id);
  const opening = source.slice(range.start, range.openEnd);
  if (opening.includes(" transform=")) fail(`существующая группа SVG уже имеет преобразование: ${id}`);
  const translated = `${opening.slice(0, -1)} transform="translate(0 ${deltaY})">`;
  return replaceRange(source, range, `${translated}${source.slice(range.openEnd, range.end)}`);
}

function extendDynamicFooter(source) {
  let result = replaceExactOccurrences(source, 'viewBox="0 0 521 3144"', `viewBox="0 0 521 ${DYNAMIC_CANVAS_HEIGHT}"`, 1, "размер холста");
  result = replaceExactOccurrences(result, 'height="3144.000000" fill="none"', `height="${DYNAMIC_CANVAS_HEIGHT}.000000" fill="none"`, 1, "высота холста");
  result = replaceExactOccurrences(result, 'height="2963.000000"', `height="${DYNAMIC_FRAME_HEIGHT}.000000"`, 2, "высота основного экрана и его обрезки");
  result = replaceExactOccurrences(
    result,
    '<rect id="button_footer_2.0" width="393.000000" height="162.000000"',
    `<rect id="button_footer_2.0" width="393.000000" height="${DYNAMIC_FOOTER_HEIGHT}.000000"`,
    1,
    "высота нижней панели",
  );
  result = replaceExactOccurrences(
    result,
    '<foreignObject width="393.000000" height="162.000000" x="64.000000" y="4952.000000"',
    `<foreignObject width="393.000000" height="${DYNAMIC_FOOTER_HEIGHT}.000000" x="64.000000" y="4952.000000"`,
    1,
    "высота подложки нижней панели",
  );
  result = translateExistingGroup(result, "logo", DYNAMIC_FOOTER_EXTENSION);
  result = translateExistingGroup(result, "Home indicator", DYNAMIC_FOOTER_EXTENSION);
  return result;
}

function disableExistingButton(source) {
  const range = findGroupRange(source, "buttons_2.0");
  const original = source.slice(range.start, range.end);
  const recoloredBackground = original.replace(
    /(<rect\s+id="buttons_2\.0"[^>]*\sfill=")rgb\(67,103,206\)("[^>]*\/>)/u,
    `$1${DISABLED_BUTTON_BACKGROUND_FILL}$2`,
  );
  if (recoloredBackground === original) fail("в существующей кнопке не найден активный синий фон");
  const labelRange = findGroupRange(recoloredBackground, "button");
  const label = recoloredBackground.slice(labelRange.start, labelRange.end);
  const recoloredLabel = label.replaceAll('fill="rgb(255,255,255)"', `fill="${DISABLED_BUTTON_LABEL_FILL}"`);
  if (recoloredLabel === label) fail("в существующей кнопке не найдена белая подпись");
  let updated = replaceRange(recoloredBackground, labelRange, recoloredLabel);
  const openingEnd = updated.indexOf(">") + 1;
  const opening = updated.slice(0, openingEnd);
  if (opening.includes("aria-disabled=")) fail("в принятом SVG нижняя кнопка уже имеет состояние блокировки");
  const disabledOpening = `${opening.slice(0, -1)} transform="translate(0 ${DISABLED_BUTTON_TRANSLATE_Y})" opacity="${DISABLED_BUTTON_OPACITY}" aria-disabled="true" data-review-button-state="disabled">`;
  updated = `${disabledOpening}${updated.slice(openingEnd)}`;
  return replaceRange(source, range, updated);
}

function appendGenerationStatus(source, font) {
  // Нельзя добавлять статус в основную группу справки: штатная подложка
  // нижней панели рисуется позже и закрывает такой текст. Вставка в её
  // существующую группу после штатных дочерних элементов сохраняет фон
  // прозрачным и выводит текст поверх подложки, без отдельного слоя.
  const range = findGroupRange(source, "button_footer_2.0");
  const original = source.slice(range.start, range.end);
  const lineMarkup = DISPLAY_LINES.map((line, index) => outlineLine(font, line, {
    x: STATUS_X,
    baseline: STATUS_SOURCE_BASELINES[index],
    size: STATUS_FONT_SIZE,
    fill: STATUS_FILL,
  })).join("");
  const statusMarkup = `<g id="lisa-review-generation-status" data-review-role="generation-started-message" aria-label="${escapeXml(GENERATION_MESSAGE)}">${lineMarkup}</g>`;
  if (!original.endsWith("</g>")) fail("существующая группа нижней панели имеет непредвиденное окончание");
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
  if (source.indexOf('id="lisa-review-generation-status"') < source.indexOf('id="Home indicator"')) {
    fail("сообщение о начале должно быть записано после подложки нижней панели и не может быть ею перекрыто");
  }
  if (!source.includes(`aria-label="${escapeXml(buttonLabel)}"`)) fail("в SVG отсутствует согласованная подпись кнопки");
  const disabledButton = groupMarkup(source, "buttons_2.0");
  if (
    !disabledButton.includes('aria-disabled="true"') ||
    !disabledButton.includes('data-review-button-state="disabled"') ||
    !disabledButton.includes(`transform="translate(0 ${DISABLED_BUTTON_TRANSLATE_Y})"`) ||
    !disabledButton.includes(`fill="${DISABLED_BUTTON_BACKGROUND_FILL}"`) ||
    !disabledButton.includes(`fill="${DISABLED_BUTTON_LABEL_FILL}"`)
  ) {
    fail("кнопка заказа должна сохранять исходную группу и быть погашена после нажатия");
  }
  if (
    !source.includes(`viewBox="0 0 521 ${DYNAMIC_CANVAS_HEIGHT}"`) ||
    !source.includes(`height="${DYNAMIC_CANVAS_HEIGHT}.000000" fill="none"`) ||
    !source.includes(`height="${DYNAMIC_FRAME_HEIGHT}.000000"`) ||
    !source.includes(`height="${DYNAMIC_FOOTER_HEIGHT}.000000"`) ||
    !source.includes(`id="logo" customFrame="url(#clipPath_2089)" transform="translate(0 ${DYNAMIC_FOOTER_EXTENSION})"`) ||
    !source.includes(`id="Home indicator" clip-path="url(#clipPath_2091)" customFrame="url(#clipPath_2091)" transform="translate(0 ${DYNAMIC_FOOTER_EXTENSION})"`)
  ) {
    fail("нижняя фиксированная панель SVG не расширена для сообщения под погашенной кнопкой");
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
  svg = extendDynamicFooter(svg);
  svg = disableExistingButton(svg);
  svg = appendGenerationStatus(svg, font);
  validateSource(svg, baseSource, buttonLabel);
  return { svg, base, approvedTexts, buttonLabel, fixture, statusGeometry };
}

function generatedManifest({ svg, base, approvedTexts, buttonLabel, fixture, statusGeometry }, root) {
  return {
    $schema: "../../../source/schemas/lisa-presentation-generating-review-source-manifest.schema.json",
    version: "2.2.0",
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
    dynamic_footer: {
      button_translate_y: DISABLED_BUTTON_TRANSLATE_Y,
      background_fill: DISABLED_BUTTON_BACKGROUND_FILL,
      label_fill: DISABLED_BUTTON_LABEL_FILL,
      status_placement: "below_disabled_button",
      extension_height: DYNAMIC_FOOTER_EXTENSION,
    },
    generation_started_message: {
      text: GENERATION_MESSAGE,
      display_lines: DISPLAY_LINES,
      time_value: "13:24",
      inserted_into_existing_frame_group_id: "button_footer_2.0",
      font_size: STATUS_FONT_SIZE,
      fill: STATUS_FILL,
      baselines: STATUS_BASELINES,
      safe_area: statusGeometry.safeArea,
      line_widths: statusGeometry.lineWidths,
    },
    preserved_visible_group_ids: VISIBLE_GROUP_IDS,
    modified_existing_group_ids: ["Group 2131328969", "button_footer_2.0", "buttons_2.0", "logo", "Home indicator"],
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

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validateStoredStatusGeometry(message) {
  if (
    message.text !== GENERATION_MESSAGE ||
    !sameJson(message.display_lines, DISPLAY_LINES) ||
    message.time_value !== "13:24" ||
    message.inserted_into_existing_frame_group_id !== "button_footer_2.0" ||
    message.font_size !== STATUS_FONT_SIZE ||
    message.fill !== STATUS_FILL ||
    !sameJson(message.baselines, STATUS_BASELINES) ||
    !sameJson(message.safe_area, STATUS_SAFE_AREA) ||
    !Array.isArray(message.line_widths) ||
    message.line_widths.length !== DISPLAY_LINES.length ||
    message.line_widths.some((width) => !Number.isFinite(width) || width <= 0 || width > STATUS_SAFE_AREA.width)
  ) {
    fail("сохранённый манифест второго кадра не подтверждает геометрию согласованного сообщения");
  }
}

function validateStoredManifest({ manifest, root, source, base, approvedTexts, buttonLabel }) {
  const fixture = readJson(root, FIXTURE_MANIFEST_PATH).transient_raster_text_font;
  if (fixture.ci_check_requires_local_font !== false) fail("манифест происхождения не разрешает проверку SVG без локального шрифта");
  if (
    manifest.$schema !== "../../../source/schemas/lisa-presentation-generating-review-source-manifest.schema.json" ||
    manifest.version !== "2.2.0" ||
    manifest.frame_id !== "lisa-presentation-generating" ||
    manifest.base_frame_id !== BASE_FRAME_ID ||
    manifest.base_svg_path !== BASE_SVG_PATH ||
    manifest.base_svg_sha256 !== base.baseSha256 ||
    manifest.base_owner_approval_path !== BASE_OWNER_APPROVAL_PATH ||
    manifest.base_owner_approved_svg_sha256 !== base.approval.approved_source_svg_sha256 ||
    manifest.transition_rendering_mode !== "same_screen_dynamic_state" ||
    manifest.source_svg_path !== "candidate-evidence/frame-review/lisa-presentation-generating/source.svg" ||
    manifest.source_svg_sha256 !== sha256Text(source) ||
    manifest.approved_texts_path !== "source/owner-approved-texts.json" ||
    manifest.approved_texts_sha256 !== sha256File(path.join(root, APPROVED_TEXTS_PATH)) ||
    manifest.button_label_text !== buttonLabel ||
    !sameJson(manifest.disabled_button, {
      existing_group_id: "buttons_2.0",
      aria_disabled: true,
      opacity: DISABLED_BUTTON_OPACITY,
      label_unchanged: true,
    }) ||
    !sameJson(manifest.dynamic_footer, {
      button_translate_y: DISABLED_BUTTON_TRANSLATE_Y,
      background_fill: DISABLED_BUTTON_BACKGROUND_FILL,
      label_fill: DISABLED_BUTTON_LABEL_FILL,
      status_placement: "below_disabled_button",
      extension_height: DYNAMIC_FOOTER_EXTENSION,
    }) ||
    !sameJson(manifest.preserved_visible_group_ids, VISIBLE_GROUP_IDS) ||
    !sameJson(manifest.modified_existing_group_ids, ["Group 2131328969", "button_footer_2.0", "buttons_2.0", "logo", "Home indicator"]) ||
    !sameJson(manifest.prohibited_legacy_overlay_ids, ["lisa-edit-5-4-title", "lisa-status-"]) ||
    !sameJson(manifest.text_outline_font, {
      family: fixture.family,
      sha256: fixture.sha256,
      copied_to_git: false,
    }) ||
    manifest.active_release_mutation_prohibited !== true ||
    manifest.draft_png_rendered !== true
  ) {
    fail("сохранённый манифест второго кадра не совпадает с каноническим SVG и его принятыми источниками");
  }
  if (approvedTexts.status !== "owner_approved") fail("реестр текстов не подтвержден владельцем");
  if (approvedText(approvedTexts, "generation_started_message") !== GENERATION_MESSAGE) {
    fail("согласованное сообщение о начале формирования не совпадает с договором кадра");
  }
  validateStoredStatusGeometry(manifest.generation_started_message);
}

function prepareReviewSource({ root = process.cwd() } = {}) {
  const reviewSourcePath = path.join(root, REVIEW_SOURCE_PATH);
  const manifestPath = path.join(root, REVIEW_MANIFEST_PATH);
  if (readOwnerApproval(root)) {
    fail("принятый кадр начала формирования нельзя перезаписывать: для изменения требуется новая приёмка");
  }
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
  const base = verifyApprovedBase(root);
  const approvedTexts = readJson(root, APPROVED_TEXTS_PATH);
  const buttonLabel = approvedText(approvedTexts, "button_label");
  const source = fs.readFileSync(reviewSourcePath, "utf8");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const baseSource = fs.readFileSync(base.basePath, "utf8");
  validateSource(source, baseSource, buttonLabel);
  validateStoredManifest({ manifest, root, source, base, approvedTexts, buttonLabel });
  const approval = readOwnerApproval(root);
  const draftPath = path.join(root, REVIEW_DIRECTORY, "draft-current-resolution.png");
  if (manifest.draft_png_path !== "candidate-evidence/frame-review/lisa-presentation-generating/draft-current-resolution.png" ||
    manifest.draft_png_sha256 !== sha256File(draftPath) ||
    !sameJson(manifest.draft_png_dimensions, { width: 521, height: DYNAMIC_CANVAS_HEIGHT }) ||
    !Number.isInteger(manifest.draft_png_non_white_pixel_count) || manifest.draft_png_non_white_pixel_count < 1_000) {
    fail("черновой PNG второго кадра не совпадает с сохранённым манифестом");
  }
  validateOwnerApproval(approval, sha256Text(source), sha256File(draftPath));
  if (approval) {
    if (
      manifest.status !== "owner_frame_approved" ||
      JSON.stringify(manifest.owner_frame_approval) !== JSON.stringify(ownerApprovalSummary(approval))
    ) {
      fail("манифест второго кадра не фиксирует принятую владельцем версию");
    }
  } else if (manifest.status !== "draft_png_rendered_pending_owner_approval" || manifest.owner_frame_approval !== null) {
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
