import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import opentype from "opentype.js";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const SOURCE_PATH = `${PACKAGE_PATH}/source`;
const BASE_SVG_PATH = `${PACKAGE_PATH}/editable-sources/7.2 — Длинное название клиента + холдинг.svg`;
const REVIEW_DIRECTORY = `${PACKAGE_PATH}/candidate-evidence/frame-review/lisa-presentation-generating`;
const REVIEW_SOURCE_PATH = `${REVIEW_DIRECTORY}/source.svg`;
const REVIEW_MANIFEST_PATH = `${REVIEW_DIRECTORY}/review-source-manifest.json`;
const CLIENT_REFERENCE_PATH = `${SOURCE_PATH}/client-reference-data.json`;
const APPROVED_TEXTS_PATH = `${SOURCE_PATH}/owner-approved-texts.json`;
const FIXTURE_MANIFEST_PATH = `${SOURCE_PATH}/source-fixture-manifest.json`;
const GENERATION_MESSAGE = "Формирование презентации началось в ЧЧ:ММ и займет не более 20 минут. После завершения презентация будет направлена по электронной почте в SIGMA и OMEGA.";
const DISPLAY_LINES = Object.freeze([
  "Формирование презентации началось в 13:24",
  "и займет не более 20 минут. После",
  "завершения презентация будет направлена",
  "по электронной почте в SIGMA и OMEGA.",
]);
const PRIMARY_FILL = "rgb(29,37,50)";
const STATUS_TITLE_FILL = "rgb(87,92,112)";
const STATUS_BODY_FILL = "rgb(144,150,169)";

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

function findGroupRangeByNeedle(source, id, needle) {
  let start = -1;
  while ((start = source.indexOf(`<g id="${id}"`, start + 1)) >= 0) {
    const range = findGroupRangeAt(source, start, `${id} (${needle})`);
    if (source.slice(range.start, range.end).includes(needle)) return range;
  }
  fail(`не найдена существующая группа SVG ${id} с ожидаемой геометрией ${needle}`);
}

function groupMarkup(source, id) {
  const range = findGroupRange(source, id);
  return source.slice(range.start, range.end);
}

function groupOpen(source, id) {
  const range = findGroupRange(source, id);
  return source.slice(range.start, range.openEnd);
}

function directRects(source, range) {
  const content = source.slice(range.openEnd, range.end);
  const tags = /<\/?g\b[^>]*>|<rect\b[^>]*\/>/gu;
  const rectangles = [];
  let depth = 0;
  for (let match = tags.exec(content); match; match = tags.exec(content)) {
    if (match[0].startsWith("<g")) depth += 1;
    else if (match[0].startsWith("</")) depth -= 1;
    else if (depth === 0) rectangles.push(match[0]);
  }
  return rectangles;
}

function replaceRange(source, range, replacement) {
  return source.slice(0, range.start) + replacement + source.slice(range.end);
}

function replaceGroup(source, id, replacement) {
  return replaceRange(source, findGroupRange(source, id), replacement);
}

function replaceDirectPath(group, replacement, label) {
  const openingEnd = group.indexOf(">") + 1;
  if (openingEnd <= 0) fail(`не найдено открытие существующей группы SVG: ${label}`);
  const content = group.slice(openingEnd);
  const tags = /<\/?g\b[^>]*>|<path\b[^>]*\/>/gu;
  let depth = 0;
  for (let match = tags.exec(content); match; match = tags.exec(content)) {
    if (match[0].startsWith("<g")) depth += 1;
    else if (match[0].startsWith("</")) depth -= 1;
    else if (depth === 0) {
      const start = openingEnd + match.index;
      const end = openingEnd + tags.lastIndex;
      return group.slice(0, start) + replacement + group.slice(end);
    }
  }
  fail(`не найден существующий текстовый путь SVG: ${label}`);
}

function closeGroup() {
  return "</g>";
}

function openingWithLabel(opening, label) {
  if (!opening.endsWith(">")) fail("открывающий тег SVG не заканчивается символом >");
  if (opening.includes("aria-label=")) return opening.replace(/aria-label="[^"]*"/u, `aria-label="${escapeXml(label)}"`);
  return `${opening.slice(0, -1)} aria-label="${escapeXml(label)}">`;
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

function centeredOutline(font, text, { x, y, width, height, size, fill }) {
  const pathData = font.getPath(text, 0, 0, size);
  const bbox = pathData.getBoundingBox();
  if (![bbox.x1, bbox.y1, bbox.x2, bbox.y2].every(Number.isFinite)) fail("не удалось измерить подпись действия");
  const baseline = y + height / 2 - (bbox.y1 + bbox.y2) / 2;
  const textX = x + width / 2 - (bbox.x1 + bbox.x2) / 2;
  return outlineLine(font, text, { x: textX, baseline, size, fill });
}

function clientFacts(clientReference) {
  const general = clientReference.data_groups.find((group) => group.group_id === "general_information");
  if (!general) fail("в модели данных отсутствует общая информация о клиенте");
  const fact = (label) => general.facts.find((item) => item.label === label)?.value;
  const clientName = fact("Сокращённое наименование");
  const inn = fact("ИНН");
  const bank = fact("ТБ");
  const segment = fact("Сегмент");
  const holding = fact("Холдинг");
  const headcount = fact("Численность");
  if ([clientName, inn, bank, segment, holding, headcount].some((value) => !value)) fail("в общей информации отсутствует факт для карточки продолжения");
  return {
    title: "Справка по клиенту",
    client_name: clientName,
    inn: `ИНН ${inn}`,
    bank,
    segment: `Сегмент: ${segment}`,
    holding,
    headcount,
  };
}

function approvedText(approvedTexts, topicId) {
  const selection = approvedTexts.selections.find((item) => item.topic_id === topicId);
  if (!selection) fail(`в реестре согласованных текстов отсутствует тема ${topicId}`);
  return selection.text;
}

function rebuildCard(source, font, card) {
  const outer = findGroupRange(source, "Frame 2131330375");
  const mid = findGroupRange(source, "Frame 2131330372");
  const body = findGroupRange(source, "Frame 2131330377");
  const footer = findGroupRange(source, "Frame 2131330376");
  const footerText = findGroupRange(source, "Frame 2131330391");
  const outerRects = directRects(source, outer);
  const midRects = directRects(source, mid);
  const bodyRects = directRects(source, body);
  const footerRects = directRects(source, footer);
  if (outerRects.length !== 2 || midRects.length !== 1 || bodyRects.length !== 1 || footerRects.length !== 2) {
    fail("исходная геометрия карточки 7.2 отличается от согласованной структуры");
  }
  const title = outlineLine(font, card.title, { x: 96, baseline: 260, size: 16, fill: PRIMARY_FILL });
  const bodyText = [
    outlineLine(font, card.client_name, { x: 96, baseline: 292, size: 12, fill: STATUS_TITLE_FILL }),
    outlineLine(font, card.inn, { x: 96, baseline: 318, size: 12, fill: STATUS_TITLE_FILL }),
    outlineLine(font, `${card.bank} · ${card.segment}`, { x: 96, baseline: 344, size: 11.5, fill: STATUS_TITLE_FILL }),
  ].join("");
  const footerTextMarkup = [
    outlineLine(font, card.holding, { x: 96, baseline: 416, size: 11, fill: STATUS_BODY_FILL }),
    outlineLine(font, card.headcount, { x: 338, baseline: 416, size: 11, fill: STATUS_BODY_FILL }),
  ].join("");
  const cardLabel = `${card.title}: ${card.client_name}; ${card.inn}; ${card.bank}; ${card.segment}; ${card.holding}; ${card.headcount}`;
  return `${openingWithLabel(groupOpen(source, "Frame 2131330375"), cardLabel)}${outerRects[0]}${title}${groupOpen(source, "Frame 2131330372")}${midRects[0]}${groupOpen(source, "Frame 2131330377")}${bodyRects[0]}${bodyText}${closeGroup()}${groupOpen(source, "Frame 2131330376")}${footerRects.join("")}${groupOpen(source, "Frame 2131330391")}${footerTextMarkup}${closeGroup()}${closeGroup()}${closeGroup()}${outerRects[1]}${closeGroup()}`;
}

function replaceActionButton(source, font, label) {
  const range = findGroupRange(source, "ai-button");
  const original = source.slice(range.start, range.end);
  const replacement = `<g id="button" data-review-button-label="selected-text" aria-label="${escapeXml(label)}">${centeredOutline(font, label, { x: 80, y: 454, width: 255, height: 40, size: 13, fill: PRIMARY_FILL })}</g>`;
  const updated = original.replace(/<path\s+id="button"[^>]*\/>/u, replacement);
  if (updated === original) fail("не найдена существующая подпись верхнего действия SVG");
  return replaceRange(source, range, updated);
}

function replaceUserMessage(source, font, label) {
  const range = findGroupRangeByNeedle(source, "messages_2.0", "x=\"186.000000\" y=\"566.000000\"");
  const original = source.slice(range.start, range.end);
  const updated = replaceDirectPath(
    original,
    `<g data-review-user-message="selected-text" aria-label="${escapeXml(label)}">${centeredOutline(font, label, { x: 186, y: 566, width: 255, height: 48, size: 13, fill: PRIMARY_FILL })}</g>`,
    "сообщение пользователя",
  );
  const openingEnd = updated.indexOf(">") + 1;
  const labelled = `${openingWithLabel(updated.slice(0, openingEnd), label)}${updated.slice(openingEnd)}`;
  return replaceRange(source, range, labelled);
}

function replaceStatus(source, font) {
  const marker = groupMarkup(source, "marker_md-24");
  const startOne = `${groupOpen(source, "presentation-start-line-1")}${outlineLine(font, DISPLAY_LINES[0], { x: 112, baseline: 664, size: 12, fill: STATUS_TITLE_FILL })}${closeGroup()}`;
  const startTwo = `${groupOpen(source, "presentation-start-line-2")}${closeGroup()}`;
  const bodyLines = DISPLAY_LINES.slice(1).map((line, index) => {
    const id = `presentation-status-line-${index + 1}`;
    return `${groupOpen(source, id)}${outlineLine(font, line, { x: 80, baseline: 702 + index * 25, size: 12, fill: STATUS_BODY_FILL })}${closeGroup()}`;
  }).join("");
  const emptyFourth = `${groupOpen(source, "presentation-status-line-4")}${closeGroup()}`;
  const startGroup = `${groupOpen(source, "Group 2131329029")}${startOne}${startTwo}${marker}${closeGroup()}`;
  const detailsGroup = `${groupOpen(source, "presentation-status-details")}${bodyLines}${emptyFourth}${closeGroup()}`;
  const outer = openingWithLabel(groupOpen(source, "Group 2131329372"), GENERATION_MESSAGE);
  return `${outer}${startGroup}${detailsGroup}${closeGroup()}`;
}

function replaceDocumentCreatedTitle(source, font) {
  return replaceGroup(
    source,
    "Group 2131329368",
    `${groupOpen(source, "Group 2131329368")}${outlineLine(font, "Справка по клиенту сформирована", { x: 104, baseline: 203, size: 15, fill: PRIMARY_FILL })}${closeGroup()}`,
  );
}

function validateSource(source, card, buttonLabel) {
  for (const id of [
    "Frame 2131329748",
    "Frame 2131330375",
    "Frame 2131330372",
    "Frame 2131330377",
    "Frame 2131330376",
    "Frame 2131330391",
    "ai-button",
    "Group 2131329372",
    "Group 2131329029",
    "presentation-start-line-1",
    "presentation-start-line-2",
    "presentation-status-details",
    "presentation-status-line-1",
    "presentation-status-line-2",
    "presentation-status-line-3",
    "presentation-status-line-4",
  ]) {
    if (!source.includes(`id="${id}"`)) fail(`в изолированном SVG утрачен обязательный существующий идентификатор ${id}`);
  }
  if (source.includes("lisa-edit-") || source.includes("lisa-status-") || /<text\b/u.test(source)) {
    fail("изолированный SVG содержит запрещённую накладку или текстовый элемент");
  }
  if (!source.includes(`aria-label="${escapeXml(GENERATION_MESSAGE)}"`)) fail("в SVG отсутствует согласованное сообщение о начале формирования");
  if (!source.includes(`aria-label="${escapeXml(buttonLabel)}"`)) fail("в SVG отсутствует доступная подпись выбранного действия");
  const cardLabel = `${card.title}: ${card.client_name}; ${card.inn}; ${card.bank}; ${card.segment}; ${card.holding}; ${card.headcount}`;
  if (!source.includes(`aria-label="${escapeXml(cardLabel)}"`)) fail("в SVG отсутствует доступная подпись карточки клиента");
  const userMessageRange = findGroupRangeByNeedle(source, "messages_2.0", "x=\"186.000000\" y=\"566.000000\"");
  const userMessage = source.slice(userMessageRange.start, userMessageRange.end);
  if (!userMessage.includes('id="Rectangle 240652035"') || !userMessage.includes('data-review-user-message="selected-text"')) {
    fail("замена сообщения пользователя утратила штатную подложку или собственный текстовый путь");
  }
  if ((source.match(/id="button"/gu) || []).length !== 1) fail("в SVG не допускается повторяющийся идентификатор подписи действия");
}

function buildSource(root) {
  const basePath = path.join(root, BASE_SVG_PATH);
  const clientReference = readJson(root, CLIENT_REFERENCE_PATH);
  const approvedTexts = readJson(root, APPROVED_TEXTS_PATH);
  if (approvedTexts.status !== "owner_approved") fail("реестр текстов не подтвержден владельцем");
  const buttonLabel = approvedText(approvedTexts, "button_label");
  const generationMessage = approvedText(approvedTexts, "generation_started_message");
  if (generationMessage !== GENERATION_MESSAGE) fail("согласованное сообщение о начале формирования не совпадает с договором кадра");
  const card = clientFacts(clientReference);
  const { font, fixture } = resolveOutlineFont(root);
  let svg = fs.readFileSync(basePath, "utf8");
  svg = replaceDocumentCreatedTitle(svg, font);
  svg = replaceGroup(svg, "Frame 2131330375", rebuildCard(svg, font, card));
  svg = replaceActionButton(svg, font, buttonLabel);
  svg = replaceUserMessage(svg, font, buttonLabel);
  svg = replaceGroup(svg, "Group 2131329372", replaceStatus(svg, font));
  validateSource(svg, card, buttonLabel);
  return { svg, clientReference, approvedTexts, card, buttonLabel, fixture };
}

function prepareReviewSource({ root = process.cwd() } = {}) {
  const basePath = path.join(root, BASE_SVG_PATH);
  const reviewSourcePath = path.join(root, REVIEW_SOURCE_PATH);
  const manifestPath = path.join(root, REVIEW_MANIFEST_PATH);
  const { svg, clientReference, approvedTexts, card, buttonLabel, fixture } = buildSource(root);
  fs.mkdirSync(path.dirname(reviewSourcePath), { recursive: true });
  fs.writeFileSync(reviewSourcePath, svg, "utf8");
  const manifest = {
    $schema: "../../../source/schemas/lisa-presentation-generating-review-source-manifest.schema.json",
    version: "1.0.0",
    frame_id: "lisa-presentation-generating",
    status: "svg_source_prepared_pending_visual_check",
    base_svg_path: "editable-sources/7.2 — Длинное название клиента + холдинг.svg",
    base_svg_sha256: sha256File(basePath),
    source_svg_path: "candidate-evidence/frame-review/lisa-presentation-generating/source.svg",
    source_svg_sha256: sha256Text(svg),
    client_reference_data_path: "source/client-reference-data.json",
    client_reference_data_sha256: sha256File(path.join(root, CLIENT_REFERENCE_PATH)),
    approved_texts_path: "source/owner-approved-texts.json",
    approved_texts_sha256: sha256File(path.join(root, APPROVED_TEXTS_PATH)),
    client_card: card,
    button_label_text: buttonLabel,
    generation_started_message: {
      text: GENERATION_MESSAGE,
      display_lines: DISPLAY_LINES,
      time_value: "13:24",
    },
    preserved_existing_group_ids: [
      "Frame 2131329748",
      "Frame 2131330375",
      "Frame 2131330372",
      "Frame 2131330377",
      "Frame 2131330376",
      "Frame 2131330391",
      "ai-button",
      "Group 2131329372",
      "Group 2131329029",
      "presentation-start-line-1",
      "presentation-start-line-2",
      "presentation-status-details",
      "presentation-status-line-1",
      "presentation-status-line-2",
      "presentation-status-line-3",
      "presentation-status-line-4",
    ],
    replaced_text_group_ids: [
      "Group 2131329368",
      "Frame 2131330375",
      "Frame 2131330377",
      "Frame 2131330391",
      "ai-button",
      "messages_2.0@186,566",
      "presentation-start-line-1",
      "presentation-start-line-2",
      "presentation-status-line-1",
      "presentation-status-line-2",
      "presentation-status-line-3",
      "presentation-status-line-4",
    ],
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
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

function checkReviewSource({ root = process.cwd() } = {}) {
  const reviewSourcePath = path.join(root, REVIEW_SOURCE_PATH);
  const manifestPath = path.join(root, REVIEW_MANIFEST_PATH);
  const { svg } = buildSource(root);
  const manifest = readJson(root, REVIEW_MANIFEST_PATH);
  if (
    !fs.existsSync(reviewSourcePath) ||
    fs.readFileSync(reviewSourcePath, "utf8") !== svg ||
    manifest.source_svg_sha256 !== sha256Text(svg)
  ) {
    fail("сохранённый SVG второго кадра не совпадает с повторной подготовкой из канонического источника");
  }
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  try {
    const argumentsAfterScript = process.argv.slice(2);
    if (argumentsAfterScript.some((argument) => argument !== "--check")) fail("использование: node scripts/prepare-lisa-presentation-generating-review-source.mjs [--check]");
    const check = argumentsAfterScript.includes("--check");
    const manifest = check ? checkReviewSource() : prepareReviewSource();
    process.stdout.write(check
      ? `SVG-источник второго чернового кадра актуален: ${manifest.source_svg_path}\n`
      : `SVG-источник чернового кадра подготовлен: ${manifest.source_svg_path}\n`);
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "SVG-источник не подготовлен"}\n`);
    process.exitCode = 1;
  }
}

export { checkReviewSource, prepareReviewSource };
