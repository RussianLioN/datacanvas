import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import opentype from "opentype.js";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const SOURCE_PATH = `${PACKAGE_PATH}/source`;
const BASE_SVG_PATH = `${PACKAGE_PATH}/editable-sources/5.4.svg`;
const REVIEW_DIRECTORY = `${PACKAGE_PATH}/candidate-evidence/frame-review/lisa-materials-full-reference`;
const REVIEW_SOURCE_PATH = `${REVIEW_DIRECTORY}/source.svg`;
const REVIEW_MANIFEST_PATH = `${REVIEW_DIRECTORY}/review-source-manifest.json`;
const CLIENT_REFERENCE_PATH = `${SOURCE_PATH}/client-reference-data.json`;
const FIXTURE_MANIFEST_PATH = `${SOURCE_PATH}/source-fixture-manifest.json`;
const LEGACY_OVERLAY_ID = "lisa-edit-5-4-title";
const BODY_WIDTH = 345;
const CONTENT_BOTTOM = 4936;
const FRAME_TOP = 101;
const FOOTER_BASELINE_Y = 4952;
const FOOTER_HEIGHT = 162;
const FOOTER_CONTENT_GAP = 72;
const CANVAS_BOTTOM_GAP = 80;
const PRIMARY_FILL = "rgb(29,37,50)";
const SECONDARY_FILL = "rgb(73,80,94)";

function fail(message) {
  throw new Error(message);
}

function sha256File(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function findGroupRange(source, id) {
  const start = source.indexOf(`<g id="${id}"`);
  if (start < 0) fail(`не найдена существующая группа SVG: ${id}`);
  return findGroupRangeAt(source, start, id);
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

function groupMarkup(source, id) {
  const range = findGroupRange(source, id);
  return source.slice(range.start, range.end);
}

function groupMarkupByOpening(source, openingPattern, label) {
  const match = source.match(openingPattern);
  if (!match || match.index === undefined) fail(`не найдена существующая группа SVG: ${label}`);
  const range = findGroupRangeAt(source, match.index, label);
  return source.slice(range.start, range.end);
}

function replaceGroupMarkup(source, id, replacement) {
  const range = findGroupRange(source, id);
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
  if (!direct.includes("NaN")) return `<path d="${direct}" transform="translate(${x.toFixed(3)} ${baseline.toFixed(3)})" fill="${fill}" fill-rule="nonzero" />`;
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

function wrapText(font, text, width, size) {
  const words = text.replaceAll("\n", " ").trim().split(/\s+/u);
  const lines = [];
  let line = "";
  for (const word of words) {
    const proposed = line ? `${line} ${word}` : word;
    if (line && font.getAdvanceWidth(proposed, size) > width) {
      lines.push(line);
      line = word;
    } else {
      line = proposed;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function renderTextBlock(font, text, { x, y, width, size, lineHeight, fill }) {
  const lines = wrapText(font, text, width, size);
  const markup = lines.map((line, index) => outlineLine(font, line, {
    x,
    baseline: y + index * lineHeight,
    size,
    fill,
  })).join("");
  return { markup, nextY: y + lines.length * lineHeight };
}

function buildReferenceContent(font, clientReference) {
  const groupIds = clientReference.coverage.required_group_ids;
  const covered = clientReference.coverage.full_reference_covered_group_ids;
  if (JSON.stringify(groupIds) !== JSON.stringify(covered)) fail("модель справки должна покрывать все утверждённые группы данных");
  const groups = new Map(clientReference.data_groups.map((group) => [group.group_id, group]));
  let y = 218;
  let markup = outlineLine(font, "Справка по клиенту", { x: 80, baseline: y, size: 16, fill: PRIMARY_FILL });
  y += 34;
  for (const groupId of groupIds) {
    const group = groups.get(groupId);
    if (!group) fail(`в модели справки отсутствует обязательная группа: ${groupId}`);
    markup += outlineLine(font, group.title, { x: 80, baseline: y, size: 15, fill: PRIMARY_FILL });
    y += 21;
    for (const fact of group.facts) {
      const text = `${fact.label}: ${fact.value}`;
      const rendered = renderTextBlock(font, text, {
        x: 80,
        y,
        width: BODY_WIDTH,
        size: 11.5,
        lineHeight: 16,
        fill: SECONDARY_FILL,
      });
      markup += rendered.markup;
      y = rendered.nextY + 4;
    }
    y += 10;
  }
  if (y > CONTENT_BOTTOM) fail(`полная справка не помещается в SVG: последняя координата ${y.toFixed(1)} превышает ${CONTENT_BOTTOM}`);
  return { markup, groupIds, contentBottom: y };
}

function replaceFooterButton(font, footer, buttonLabel) {
  const buttonText = outlineLine(font, buttonLabel, {
    x: 146,
    baseline: 4993,
    size: 12,
    fill: "rgb(255,255,255)",
  });
  const replacement = `<g id="buttons_2.0" customFrame="url(#clipPath_2085)" role="button" aria-label="${buttonLabel}"><rect id="buttons_2.0" width="361.000000" height="40.000000" x="80.000000" y="4968.000000" rx="20.000000" fill="rgb(67,103,206)" />${buttonText}</g>`;
  return replaceGroupMarkup(footer, "buttons_2.0", replacement);
}

function footerBackdrop(source) {
  return groupMarkupByOpening(
    source,
    /<g\s+data-pixso-skip-parse="true">\s*<foreignObject\s+width="393\.000000"\s+height="162\.000000"\s+x="64\.000000"\s+y="4952\.000000"/u,
    "существующая подложка нижней панели",
  );
}

function firstDirectFrameBackground(source, frame) {
  const candidate = source.slice(frame.openEnd, frame.end);
  const match = candidate.match(/^\s*(<rect\b[^>]*\bid="Frame 2131329748"[^>]*\/>)/u);
  if (!match) fail("не найден существующий фон внешнего SVG-кадра");
  return match[1];
}

function replaceFullReferenceFrameContent(source, font, content, buttonLabel) {
  const frame = findGroupRange(source, "Frame 2131329748");
  const frameOpening = source.slice(frame.start, frame.openEnd);
  const background = firstDirectFrameBackground(source, frame);
  const header = groupMarkup(source, "moblie header");
  const backdrop = footerBackdrop(source);
  const footer = replaceFooterButton(font, groupMarkup(source, "button_footer_2.0"), buttonLabel);
  const referenceGroup = `<g id="Group 2131328969" data-review-frame-id="lisa-materials-full-reference" role="img" aria-label="Справка по клиенту ООО «Водолей Трейд»">${content.markup}</g>`;
  const replacement = `${frameOpening}${background}${header}${referenceGroup}${backdrop}${footer}</g>`;
  return source.slice(0, frame.start) + replacement + source.slice(frame.end);
}

function shiftExistingFooter(source, offset) {
  const footer = findGroupRange(source, "button_footer_2.0");
  const opening = source.slice(footer.start, footer.openEnd);
  if (opening.includes(" transform=")) fail("нижняя панель SVG уже имеет несогласованное преобразование");
  return source.slice(0, footer.start) + opening.replace(/>$/u, ` transform="translate(0 ${offset})">`) + source.slice(footer.openEnd);
}

function shiftFooterBackdrop(source, offset) {
  const pattern = /<g\s+data-pixso-skip-parse="true">\s*<foreignObject\s+width="393\.000000"\s+height="162\.000000"\s+x="64\.000000"\s+y="4952\.000000"/u;
  const match = source.match(pattern);
  if (!match || match.index === undefined) fail("не найдена существующая подложка нижней панели SVG");
  const range = findGroupRangeAt(source, match.index, "существующая подложка нижней панели");
  const opening = source.slice(range.start, range.openEnd);
  if (opening.includes(" transform=")) fail("подложка нижней панели SVG уже имеет несогласованное преобразование");
  return source.slice(0, range.start) + opening.replace(/>$/u, ` transform="translate(0 ${offset})">`) + source.slice(range.openEnd);
}

function resizeFullReferenceFrame(source, contentBottom) {
  const footerTop = Math.ceil(contentBottom + FOOTER_CONTENT_GAP);
  const footerOffset = footerTop - FOOTER_BASELINE_Y;
  const frameBottom = footerTop + FOOTER_HEIGHT;
  const frameHeight = frameBottom - FRAME_TOP;
  const canvasHeight = frameBottom + CANVAS_BOTTOM_GAP;
  let result = shiftExistingFooter(source, footerOffset);
  result = shiftFooterBackdrop(result, footerOffset);
  result = result.replace(
    /(<rect\s+id="Frame 2131329748"\s+width="393\.000000"\s+height=")5013(\.000000"\s+x="64\.000000"\s+y="101\.000000"\s+rx="24\.000000"\s+fill="rgb\(255,255,255\)"\s*\/>)/u,
    `$1${frameHeight}$2`,
  );
  result = result.replace(
    /(<clipPath id="clipPath_2037">\s*<rect width="393\.000000" height=")5013(\.000000" x="64\.000000" y="101\.000000" rx="24\.000000" fill="rgb\(255,255,255\)"\s*\/>)/u,
    `$1${frameHeight}$2`,
  );
  result = result
    .replace('width="521.000000" height="5194.000000"', `width="521.000000" height="${canvasHeight}.000000"`)
    .replace('viewBox="0 0 521 5194"', `viewBox="0 0 521 ${canvasHeight}"`);
  if (!result.includes(`height="${frameHeight}.000000"`) || !result.includes(`translate(0 ${footerOffset})`)) {
    fail("не удалось согласованно изменить высоту существующего SVG-кадра и положение нижней панели");
  }
  return { source: result, frameHeight, footerTop, footerOffset, canvasHeight };
}

function prepareReviewSource({ root = process.cwd() } = {}) {
  const basePath = path.join(root, BASE_SVG_PATH);
  const clientReference = readJson(root, CLIENT_REFERENCE_PATH);
  const approvedTexts = readJson(root, `${SOURCE_PATH}/owner-approved-texts.json`);
  const buttonLabel = approvedTexts.selections.find((selection) => selection.topic_id === "button_label")?.text;
  if (typeof buttonLabel !== "string") fail("в реестре выбранных текстов отсутствует подпись кнопки");
  const { font, fixture } = resolveOutlineFont(root);
  const baseSource = fs.readFileSync(basePath, "utf8");
  const content = buildReferenceContent(font, clientReference);
  const rebuilt = replaceFullReferenceFrameContent(baseSource, font, content, buttonLabel);
  const geometry = resizeFullReferenceFrame(rebuilt, content.contentBottom);
  let reviewSource = geometry.source;
  reviewSource = reviewSource.replace(new RegExp(`\\s*<g id="${LEGACY_OVERLAY_ID}">[\\s\\S]*?<\\/g>`, "u"), "");
  if (reviewSource.includes(`id="${LEGACY_OVERLAY_ID}"`)) fail("проверочный SVG содержит запрещённую историческую накладку");
  if (/<text\b/u.test(reviewSource)) fail("проверочный SVG не должен использовать текстовые узлы вместо контуров");

  const outputDirectory = path.join(root, REVIEW_DIRECTORY);
  fs.mkdirSync(outputDirectory, { recursive: true });
  const outputPath = path.join(root, REVIEW_SOURCE_PATH);
  fs.writeFileSync(outputPath, reviewSource, "utf8");
  const manifest = {
    $schema: "../../../source/schemas/lisa-full-reference-review-source-manifest.schema.json",
    version: "1.0.0",
    frame_id: "lisa-materials-full-reference",
    status: "svg_source_prepared_pending_visual_check",
    base_svg_path: "editable-sources/5.4.svg",
    base_svg_sha256: sha256File(basePath),
    source_svg_path: "candidate-evidence/frame-review/lisa-materials-full-reference/source.svg",
    source_svg_sha256: sha256File(outputPath),
    client_reference_data_path: "source/client-reference-data.json",
    client_reference_data_sha256: sha256File(path.join(root, CLIENT_REFERENCE_PATH)),
    covered_group_ids: content.groupIds,
    content_bottom_y: Number(content.contentBottom.toFixed(3)),
    frame_geometry: {
      resized: true,
      frame_height: geometry.frameHeight,
      footer_top_y: geometry.footerTop,
      canvas_height: geometry.canvasHeight,
    },
    text_outline_font: {
      family: fixture.family,
      sha256: fixture.sha256,
      copied_to_git: false,
    },
    edit_mode: "replace_existing_frame_group_content",
    button_label_text: buttonLabel,
    prohibited_legacy_overlay_ids: [LEGACY_OVERLAY_ID],
    active_release_mutation_prohibited: true,
    draft_png_rendered: false,
  };
  fs.writeFileSync(path.join(root, REVIEW_MANIFEST_PATH), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  try {
    const manifest = prepareReviewSource();
    process.stdout.write(`Подготовлен SVG первого проверочного кадра: ${manifest.source_svg_path}\n`);
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "не удалось подготовить SVG первого проверочного кадра"}\n`);
    process.exitCode = 1;
  }
}

export { prepareReviewSource };
