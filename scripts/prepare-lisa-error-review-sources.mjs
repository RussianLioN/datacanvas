import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import opentype from "opentype.js";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const SOURCE_PATH = `${PACKAGE_PATH}/source`;
const CONTRACT_PATH = `${SOURCE_PATH}/error-frame-review-contract.json`;
const FIXTURE_MANIFEST_PATH = `${SOURCE_PATH}/source-fixture-manifest.json`;
const TEMPLATE_DIRECTORY = `${PACKAGE_PATH}/candidate-evidence/frame-review/lisa-presentation-sent`;
const TEMPLATE_SOURCE_PATH = `${TEMPLATE_DIRECTORY}/source.svg`;
const TEMPLATE_MANIFEST_PATH = `${TEMPLATE_DIRECTORY}/review-source-manifest.json`;
const TEMPLATE_APPROVAL_PATH = `${TEMPLATE_DIRECTORY}/owner-approval.json`;
const FRAME_REVIEW_PATH = `${PACKAGE_PATH}/candidate-evidence/frame-review`;
const FONT_SIZE = 11.5;
const FILL = "rgb(73,80,94)";
const SOURCE_OFFSET_Y = 2050;
const EXPECTED_DIMENSIONS = Object.freeze({ width: 521, height: 3290 });

function fail(message) { throw new Error(message); }
function sha256File(filePath) { return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex"); }
function sha256Text(value) { return createHash("sha256").update(value).digest("hex"); }
function readJson(root, relativePath) { return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")); }
function escapeXml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("\"", "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

function findGroupRangeAt(source, start, label) {
  const openEnd = source.indexOf(">", start);
  if (openEnd < 0) fail(`не найдено окончание SVG-группы: ${label}`);
  const tags = /<\/?g\b[^>]*>/gu;
  tags.lastIndex = openEnd + 1;
  let depth = 1;
  for (let match = tags.exec(source); match; match = tags.exec(source)) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return { start, end: tags.lastIndex };
  }
  fail(`не найдено закрытие SVG-группы: ${label}`);
}

function findGroupRange(source, id) {
  const start = source.indexOf(`<g id="${id}"`);
  if (start < 0) fail(`не найдена существующая SVG-группа: ${id}`);
  return findGroupRangeAt(source, start, id);
}

function replaceRange(source, range, replacement) { return source.slice(0, range.start) + replacement + source.slice(range.end); }

function replaceFrameId(source, frameId) {
  const before = 'data-review-frame-id="lisa-presentation-generating"';
  if (source.split(before).length - 1 !== 1) fail("визуальный шаблон должен содержать единственный идентификатор кадра начала");
  return source.replace(before, `data-review-frame-id="${frameId}"`);
}

function resolveOutlineFont(root) {
  const fixture = readJson(root, FIXTURE_MANIFEST_PATH).transient_raster_text_font;
  const fontPath = path.join(os.homedir(), "Library", "Fonts", fixture.file_name);
  if (!fs.existsSync(fontPath)) fail(`не найден локальный шрифт контуров: ${fixture.file_name}`);
  if (sha256File(fontPath) !== fixture.sha256) fail("локальный шрифт контуров не совпадает с закреплённым источником");
  const bytes = fs.readFileSync(fontPath);
  return { font: opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)), fixture };
}

function measuredLineWidth(font, text) {
  let width = 0;
  for (const character of text) {
    const advance = font.charToGlyph(character).advanceWidth;
    if (!Number.isFinite(advance)) fail(`не удалось измерить символ «${character}»`);
    width += advance * FONT_SIZE / font.unitsPerEm;
  }
  return Number(width.toFixed(3));
}

function outlineLine(font, text, x, baseline) {
  const direct = font.getPath(text, 0, 0, FONT_SIZE).toPathData(3);
  if (!direct.includes("NaN")) return `<path d="${direct}" transform="translate(${x.toFixed(3)} ${(baseline + SOURCE_OFFSET_Y).toFixed(3)})" fill="${FILL}" fill-rule="nonzero" />`;
  let cursor = x;
  const paths = [];
  for (const character of text) {
    const glyph = font.charToGlyph(character);
    const data = glyph.getPath(0, 0, FONT_SIZE).toPathData(3);
    if (data.includes("NaN")) fail(`контур символа «${character}» содержит недопустимые координаты`);
    paths.push(`<path d="${data}" transform="translate(${cursor.toFixed(3)} ${(baseline + SOURCE_OFFSET_Y).toFixed(3)})" fill="${FILL}" fill-rule="nonzero" />`);
    cursor += glyph.advanceWidth * FONT_SIZE / font.unitsPerEm;
  }
  return paths.join("");
}

function validateGeometry(font, candidate) {
  if (candidate.display_lines.length !== candidate.baselines.length) fail(`число строк и координат не совпадает: ${candidate.frame_id}`);
  const widths = candidate.display_lines.map((line) => measuredLineWidth(font, line));
  if (widths.some((width) => candidate.safe_area.x + width > candidate.safe_area.x + candidate.safe_area.width)) fail(`текст не помещается по ширине: ${candidate.frame_id}`);
  const top = candidate.baselines[0] - FONT_SIZE;
  const bottom = candidate.baselines.at(-1) + FONT_SIZE * 0.25;
  if (top < candidate.safe_area.y || bottom > candidate.safe_area.y + candidate.safe_area.height) fail(`текст выходит за безопасную область: ${candidate.frame_id}`);
  return widths;
}

function errorGroup(font, candidate) {
  const markup = candidate.display_lines.map((line, index) => outlineLine(font, line, candidate.safe_area.x, candidate.baselines[index])).join("");
  return `<g id="lisa-review-error-status" data-review-role="${candidate.message_id}" aria-label="${escapeXml(candidate.text)}">${markup}</g>`;
}

function expectedOwnerApproval(candidate) {
  return {
    record_path: `candidate-evidence/frame-review/${candidate.directory}/owner-approval.json`,
    decision: "approved",
    decision_text: "Экраны приняты!",
    decision_source: "Product Owner в рабочем чате",
    approval_time_precision: "date_only",
    approved_on: "2026-08-24",
  };
}

function verifyTemplate(root) {
  const sourcePath = path.join(root, TEMPLATE_SOURCE_PATH);
  const manifest = readJson(root, TEMPLATE_MANIFEST_PATH);
  const approval = readJson(root, TEMPLATE_APPROVAL_PATH);
  const sourceSha256 = sha256File(sourcePath);
  if (
    manifest.frame_id !== "lisa-presentation-sent" ||
    manifest.status !== "owner_frame_approved" ||
    manifest.mock_phone_status_time_value !== "13:40" ||
    manifest.source_svg_sha256 !== sourceSha256 ||
    approval.frame_id !== "lisa-presentation-sent" ||
    approval.decision !== "approved" ||
    approval.approved_source_svg_sha256 !== sourceSha256
  ) fail("визуальной основой ошибок должен быть принятый кадр успешной отправки с системным временем 13:40");
  return { sourcePath, sourceSha256 };
}

function extendFooterForAdditionalMessage(source) {
  const beforeFilter = 'filter id="filter_120" width="393.000000" height="162.000000" x="64.000000" y="4952.000000"';
  const beforeClip = '<clipPath id="clipPath_2083">\n\t\t\t<rect width="393.000000" height="162.000000" x="64.000000" y="4952.000000"';
  const beforeGradient = 'y1="4952" y2="5114"';
  if (
    source.split(beforeFilter).length - 1 !== 1 ||
    source.split(beforeClip).length - 1 !== 1 ||
    source.split(beforeGradient).length - 1 !== 1
  ) fail("SVG-шаблон не содержит ожидаемых границ нижней панели");
  return source
    .replace(beforeFilter, 'filter id="filter_120" width="393.000000" height="224.000000" x="64.000000" y="4952.000000"')
    .replace(beforeClip, '<clipPath id="clipPath_2083">\n\t\t\t<rect width="393.000000" height="224.000000" x="64.000000" y="4952.000000"')
    .replace(beforeGradient, 'y1="4952" y2="5176"');
}

function buildCandidate(root, templateSource, candidate, font) {
  let source = replaceFrameId(templateSource, candidate.frame_id);
  if (candidate.keeps_generation_message) source = extendFooterForAdditionalMessage(source);
  source = replaceRange(source, findGroupRange(source, "lisa-review-delivery-success-status"), "");
  const replacement = errorGroup(font, candidate);
  if (candidate.keeps_generation_message) source = replaceRange(source, findGroupRange(source, "button_footer_2.0"), (() => {
    const footer = source.slice(findGroupRange(source, "button_footer_2.0").start, findGroupRange(source, "button_footer_2.0").end);
    if (!footer.endsWith("</g>")) fail("нижняя группа SVG имеет непредвиденную структуру");
    return `${footer.slice(0, -4)}${replacement}</g>`;
  })());
  else source = replaceRange(source, findGroupRange(source, "lisa-review-generation-status"), replacement);
  return source;
}

function validateSource(source, candidate) {
  if (
    /<text\b/u.test(source) || source.includes("lisa-edit-") || source.includes("lisa-status-") ||
    source.includes("lisa-review-delivery-success-status") ||
    !source.includes(`data-review-frame-id="${candidate.frame_id}" data-review-transition="same_screen_dynamic_state"`) ||
    !source.includes(`aria-label="${escapeXml(candidate.text)}"`) ||
    !source.includes('id="lisa-review-error-status"') ||
    !source.includes('aria-disabled="true"') || !source.includes('data-review-button-state="disabled"') ||
    !source.includes('fill="rgb(224,227,234)"') || !source.includes('viewBox="0 0 521 3290"')
  ) fail(`SVG-кандидат ошибки нарушает структуру продолжения: ${candidate.frame_id}`);
  const error = source.slice(findGroupRange(source, "lisa-review-error-status").start, findGroupRange(source, "lisa-review-error-status").end);
  if (/<(?:rect|circle|foreignObject|text)\b/u.test(error)) fail(`сообщение ошибки не заменено внутри SVG-группы: ${candidate.frame_id}`);
  if (candidate.keeps_generation_message !== source.includes('id="lisa-review-generation-status"')) fail(`неверно сохранено сообщение начала: ${candidate.frame_id}`);
  if (source.includes("ГК Достовалова")) fail(`SVG-кандидат сохранил прежние данные клиента: ${candidate.frame_id}`);
}

function makeManifest({ source, template, candidate, fixture, widths }) {
  const directory = `${FRAME_REVIEW_PATH}/${candidate.directory}`;
  return {
    $schema: "../../../source/schemas/error-frame-review-source-manifest.schema.json",
    version: "1.0.0",
    frame_id: candidate.frame_id,
    status: "svg_source_prepared_pending_visual_check",
    semantic_base_frame_id: "lisa-presentation-generating",
    visual_template_svg_path: "candidate-evidence/frame-review/lisa-presentation-sent/source.svg",
    visual_template_svg_sha256: template.sourceSha256,
    transition_rendering_mode: "same_screen_dynamic_state",
    mock_phone_status_time_value: "13:40",
    keeps_generation_message: candidate.keeps_generation_message,
    error_message: {
      message_id: candidate.message_id,
      text: candidate.text,
      display_lines: candidate.display_lines,
      font_size: FONT_SIZE,
      fill: FILL,
      baselines: candidate.baselines,
      safe_area: candidate.safe_area,
      line_widths: widths,
      replaced_existing_group_id: candidate.keeps_generation_message ? "lisa-review-delivery-success-status" : "lisa-review-generation-status"
    },
    source_svg_path: `${directory}/source.svg`,
    source_svg_sha256: sha256Text(source),
    text_outline_font: { family: fixture.family, sha256: fixture.sha256, copied_to_git: false },
    active_release_mutation_prohibited: true,
    draft_png_rendered: false,
    draft_png_path: null,
    draft_png_sha256: null,
    draft_png_dimensions: null,
    draft_png_non_white_pixel_count: null,
    owner_frame_approval: null
  };
}

function prepareErrorReviewSources({ root = process.cwd() } = {}) {
  const contract = readJson(root, CONTRACT_PATH);
  for (const candidate of contract.candidates) {
    const approvalPath = path.join(root, FRAME_REVIEW_PATH, candidate.directory, "owner-approval.json");
    if (fs.existsSync(approvalPath)) fail(`принятый кадр нельзя пересобирать: ${candidate.frame_id}`);
  }
  const template = verifyTemplate(root);
  const { font, fixture } = resolveOutlineFont(root);
  const templateSource = fs.readFileSync(template.sourcePath, "utf8");
  for (const candidate of contract.candidates) {
    const directory = `${FRAME_REVIEW_PATH}/${candidate.directory}`;
    const widths = validateGeometry(font, candidate);
    const source = buildCandidate(root, templateSource, candidate, font);
    validateSource(source, candidate);
    fs.mkdirSync(path.join(root, directory), { recursive: true });
    fs.writeFileSync(path.join(root, directory, "source.svg"), source, "utf8");
    fs.writeFileSync(path.join(root, directory, "review-source-manifest.json"), `${JSON.stringify(makeManifest({ source, template, candidate, fixture, widths }), null, 2)}\n`, "utf8");
  }
}

function checkErrorReviewSources({ root = process.cwd() } = {}) {
  const contract = readJson(root, CONTRACT_PATH);
  const template = verifyTemplate(root);
  const fixture = readJson(root, FIXTURE_MANIFEST_PATH).transient_raster_text_font;
  for (const candidate of contract.candidates) {
    const directory = `${FRAME_REVIEW_PATH}/${candidate.directory}`;
    const source = fs.readFileSync(path.join(root, directory, "source.svg"), "utf8");
    const manifest = readJson(root, `${directory}/review-source-manifest.json`);
    validateSource(source, candidate);
    if (
      manifest.frame_id !== candidate.frame_id ||
      !["svg_source_prepared_pending_visual_check", "draft_png_rendered_pending_owner_approval", "owner_frame_approved"].includes(manifest.status) ||
      manifest.semantic_base_frame_id !== "lisa-presentation-generating" ||
      manifest.visual_template_svg_sha256 !== template.sourceSha256 ||
      manifest.mock_phone_status_time_value !== "13:40" ||
      manifest.keeps_generation_message !== candidate.keeps_generation_message ||
      manifest.source_svg_sha256 !== sha256Text(source) ||
      manifest.error_message?.message_id !== candidate.message_id ||
      manifest.error_message?.text !== candidate.text ||
      JSON.stringify(manifest.error_message?.display_lines) !== JSON.stringify(candidate.display_lines) ||
      JSON.stringify(manifest.error_message?.baselines) !== JSON.stringify(candidate.baselines) ||
      JSON.stringify(manifest.error_message?.safe_area) !== JSON.stringify(candidate.safe_area) ||
      manifest.error_message?.font_size !== FONT_SIZE || manifest.error_message?.fill !== FILL ||
      !Array.isArray(manifest.error_message?.line_widths) || manifest.error_message.line_widths.some((width) => !Number.isFinite(width) || width <= 0 || width > candidate.safe_area.width) ||
      manifest.text_outline_font?.family !== fixture.family || manifest.text_outline_font?.sha256 !== fixture.sha256 ||
      manifest.active_release_mutation_prohibited !== true
    ) fail(`сохранённый SVG-кандидат не соответствует договору: ${candidate.frame_id}`);
    if (manifest.status === "draft_png_rendered_pending_owner_approval" && (!manifest.draft_png_rendered || !fs.existsSync(path.join(root, directory, "draft-current-resolution.png")))) fail(`черновой PNG отсутствует: ${candidate.frame_id}`);
    if (manifest.status === "owner_frame_approved") {
      const approval = readJson(root, `${directory}/owner-approval.json`);
      if (
        JSON.stringify(manifest.owner_frame_approval) !== JSON.stringify(expectedOwnerApproval(candidate)) ||
        approval.frame_id !== candidate.frame_id ||
        approval.decision_text !== "Экраны приняты!" ||
        approval.approved_source_svg_sha256 !== manifest.source_svg_sha256 ||
        approval.approved_draft_png_sha256 !== manifest.draft_png_sha256
      ) fail(`приёмка кадра ошибки не связывает принятые SVG и PNG: ${candidate.frame_id}`);
    } else if (manifest.owner_frame_approval !== null) fail(`у не принятого кадра ошибки не должно быть записи приёмки: ${candidate.frame_id}`);
  }
  return contract;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  try {
    const args = process.argv.slice(2);
    if (args.some((arg) => arg !== "--check")) fail("использование: node scripts/prepare-lisa-error-review-sources.mjs [--check]");
    if (args.includes("--check")) {
      checkErrorReviewSources();
      process.stdout.write("SVG-кандидаты ошибок актуальны\n");
    } else {
      prepareErrorReviewSources();
      process.stdout.write("SVG-кандидаты ошибок подготовлены\n");
    }
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "SVG-кандидаты ошибок не подготовлены"}\n`);
    process.exitCode = 1;
  }
}

export { checkErrorReviewSources, prepareErrorReviewSources };
