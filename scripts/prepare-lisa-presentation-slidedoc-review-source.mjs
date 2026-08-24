import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const REVIEW_DIRECTORY = `${PACKAGE_PATH}/candidate-evidence/frame-review/lisa-presentation-slidedoc`;
const SOURCE_PATH = `${REVIEW_DIRECTORY}/source.svg`;
const MANIFEST_PATH = `${REVIEW_DIRECTORY}/review-source-manifest.json`;
const MAP_PATH = `${PACKAGE_PATH}/source/lisa-presentation-slidedoc-content-map.json`;
const CLIENT_PATH = `${PACKAGE_PATH}/source/client-reference-data.json`;
const DONOR_ID = "presentation_variant_slidedoc_pdf_donor";
const DIMENSIONS = Object.freeze({ width: 960, height: 1620, pageHeight: 540 });

function fail(message) { throw new Error(message); }
function readJson(root, relativePath) { return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")); }
function sha256(filePath) { return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex"); }
function writeText(root, relativePath, value) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value, "utf8");
}
function escapeXml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function wrap(value, width, size) {
  const maximum = Math.max(12, Math.floor(width / (size * 0.57)));
  const words = String(value).split(/\s+/u).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && candidate.length > maximum) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}

function newLayout() { return { cards: [], textBlocks: [] }; }

function textBlock(layout, { id, cardId, role, x, y, width, lines, size, lineHeight, fill = "#cdd3ef", weight = 400, factIndexes = [], sourceValues = [] }) {
  const safeLines = Array.isArray(lines) ? lines : [lines];
  const indexes = factIndexes.join(",");
  layout.textBlocks.push({ id, cardId, role, x, y, width, lines: safeLines, size, lineHeight, factIndexes });
  const values = sourceValues.length ? ` data-fact-values="${escapeXml(sourceValues.join(" | "))}"` : "";
  return `<text id="${id}" data-text-role="${role}" data-card-id="${cardId}" data-text-width="${width}"${indexes ? ` data-fact-indexes="${indexes}"` : ""}${values} x="${x}" y="${y}" fill="${fill}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}">${safeLines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`).join("")}</text>`;
}

function card(layout, { id, dataPath, x, y, width, height, title, body }) {
  layout.cards.push({ id, x, y, width, height });
  return `<g id="${id}" data-content-path="${dataPath}">
  <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" fill="#1b2036" stroke="#3c4264"/>
  <rect x="${x}" y="${y}" width="5" height="${height}" rx="2.5" fill="#8d78ff"/>
  ${textBlock(layout, { id: `${id}-title`, cardId: id, role: "card-heading", x: x + 16, y: y + 25, width: width - 32, lines: title, size: 14, lineHeight: 16, fill: "#e5e9ff", weight: 700 })}
  ${body}
</g>`;
}

function pageBackground(page, clientName) {
  const y = (page - 1) * DIMENSIONS.pageHeight;
  return `<rect x="0" y="${y}" width="960" height="540" fill="#111426"/>
  <rect x="0" y="${y}" width="960" height="6" fill="#8d78ff"/>
  <rect x="34" y="${y + 28}" width="8" height="8" rx="4" fill="#ff8a56"/>
  <text x="54" y="${y + 38}" fill="#edf0ff" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">${escapeXml(clientName)}</text>
  <text x="926" y="${y + 38}" fill="#afb6d9" font-family="Arial, Helvetica, sans-serif" font-size="10" font-weight="700" text-anchor="end">${page} / 3</text>
  <line x1="34" y1="${y + 58}" x2="926" y2="${y + 58}" stroke="#333957" stroke-width="1"/>`;
}

function factList(layout, { cardId, group, x, y, width, indexes, role = "body", size = 10, lineHeight = 12, spacing = 3 }) {
  let cursor = y;
  const markup = [];
  for (const index of indexes) {
    const fact = group.facts[index];
    const lines = wrap(`${fact.label}: ${fact.value}`, width, size);
    markup.push(textBlock(layout, { id: `${cardId}-fact-${index}`, cardId, role, x, y: cursor, width, lines, size, lineHeight, factIndexes: [index], sourceValues: [fact.value] }));
    cursor += lines.length * lineHeight + spacing;
  }
  return { markup: markup.join("\n"), bottom: cursor };
}

function groupedMetricRows(layout, { cardId, group, x, y, width, metricRows, conclusionIndex = null }) {
  let cursor = y;
  const markup = [];
  for (const row of metricRows) {
    const values = row.indexes.map((index) => group.facts[index].value);
    const lines = wrap(`${row.label}: ${values.join(" → ")}`, width, 10);
    markup.push(textBlock(layout, { id: `${cardId}-row-${row.indexes.join("-")}`, cardId, role: "table", x, y: cursor, width, lines, size: 10, lineHeight: 12, fill: "#d4daf6", factIndexes: row.indexes, sourceValues: values }));
    cursor += lines.length * 12 + 3;
  }
  if (conclusionIndex !== null) {
    const lines = wrap(`Вывод: ${group.facts[conclusionIndex].value}`, width, 10);
    markup.push(textBlock(layout, { id: `${cardId}-fact-${conclusionIndex}`, cardId, role: "body", x, y: cursor, width, lines, size: 10, lineHeight: 12, fill: "#aeb8dc", factIndexes: [conclusionIndex], sourceValues: [group.facts[conclusionIndex].value] }));
    cursor += lines.length * 12 + 3;
  }
  return { markup: markup.join("\n"), bottom: cursor };
}

function buildPageOne(layout, groups) {
  const [general, owners, finance] = groups;
  const generalId = "slidedoc-page-1-general-information";
  const ownersId = "slidedoc-page-1-business-owners";
  const financeId = "slidedoc-page-1-financial-indicators";
  const generalBody = factList(layout, { cardId: generalId, group: general, x: 52, y: 118, width: 305, indexes: general.facts.map((_, index) => index) }).markup;
  const ownersBody = factList(layout, { cardId: ownersId, group: owners, x: 412, y: 118, width: 496, indexes: owners.facts.map((_, index) => index) }).markup;
  const financeBody = groupedMetricRows(layout, {
    cardId: financeId, group: finance, x: 412, y: 278, width: 496,
    metricRows: [
      { label: "Выручка, млн руб.", indexes: [0, 1, 2] },
      { label: "EBITDA, млн руб.", indexes: [3, 4, 5] },
      { label: "Чистая прибыль, млн руб.", indexes: [6, 7, 8] },
      { label: "Долг, млн руб.", indexes: [9, 10, 11] },
      { label: "Долг / EBITDA", indexes: [12, 13, 14] },
      { label: "Рентабельность продаж", indexes: [15, 16, 17] },
    ], conclusionIndex: 18,
  }).markup;
  return `${card(layout, { id: generalId, dataPath: "/data_groups/0", x: 34, y: 78, width: 344, height: 428, title: general.title, body: generalBody })}
${card(layout, { id: ownersId, dataPath: "/data_groups/1", x: 390, y: 78, width: 536, height: 140, title: owners.title, body: ownersBody })}
${card(layout, { id: financeId, dataPath: "/data_groups/2", x: 390, y: 230, width: 536, height: 276, title: finance.title, body: financeBody })}`;
}

function buildPageTwo(layout, groups) {
  const [cooperation, share, deals, potential, offers] = groups;
  const y = 540;
  const cooperationId = "slidedoc-page-2-cooperation";
  const shareId = "slidedoc-page-2-sber-share";
  const opportunityId = "slidedoc-page-2-opportunities";
  const cooperationRows = [
    { label: "Количество продуктов", indexes: [0] },
    { label: "ОД, млн руб.", indexes: [1, 2, 3] },
    { label: "СДО Активы, млн руб.", indexes: [4, 5, 6] },
    { label: "СДО Пассивы, млн руб.", indexes: [7, 8, 9] },
    { label: "ФОТ, млн руб.", indexes: [10, 11, 12] },
    { label: "НКД, млн руб.", indexes: [13, 14, 15] },
    { label: "Экосистема, млн руб.", indexes: [16, 17, 18] },
    { label: "ПФИ, млн руб.", indexes: [19, 20, 21] },
    { label: "Уникальные получатели", indexes: [22, 23, 24] },
  ];
  const cooperationBody = groupedMetricRows(layout, { cardId: cooperationId, group: cooperation, x: 52, y: y + 118, width: 514, metricRows: cooperationRows }).markup;
  const shareBody = groupedMetricRows(layout, { cardId: shareId, group: share, x: 612, y: y + 118, width: 296, metricRows: [{ label: "Кошелёк", indexes: [0] }, { label: "Получатели", indexes: [1] }, { label: "РКО", indexes: [2] }, { label: "Эквайринг", indexes: [3] }, { label: "ВЭД", indexes: [4] }], conclusionIndex: 5 }).markup;
  const dealsBody = factList(layout, { cardId: opportunityId, group: deals, x: 612, y: y + 928 - y, width: 296, indexes: [0, 1, 2], spacing: 0 }).markup;
  const potentialBody = factList(layout, { cardId: opportunityId, group: potential, x: 612, y: y + 964 - y, width: 296, indexes: [0, 1], spacing: 0 }).markup;
  const offersBody = factList(layout, { cardId: opportunityId, group: offers, x: 612, y: y + 988 - y, width: 296, indexes: [0, 1], spacing: 0 }).markup;
  return `${card(layout, { id: cooperationId, dataPath: "/data_groups/3", x: 34, y: y + 78, width: 550, height: 428, title: cooperation.title, body: cooperationBody })}
${card(layout, { id: shareId, dataPath: "/data_groups/4", x: 594, y: y + 78, width: 332, height: 250, title: share.title, body: shareBody })}
${card(layout, { id: opportunityId, dataPath: "/data_groups/5", x: 594, y: y + 338, width: 332, height: 168, title: "Сделки и возможности", body: `<g id="slidedoc-page-2-active-deals" data-content-path="/data_groups/5">${dealsBody}</g><g id="slidedoc-page-2-potential" data-content-path="/data_groups/6">${potentialBody}</g><g id="slidedoc-page-2-preapproved-offers" data-content-path="/data_groups/7">${offersBody}</g>` })}`;
}

function buildPageThree(layout, groups) {
  const [insights, agreements, suggestions, actions] = groups;
  const y = 1080;
  const cards = [
    { id: "slidedoc-page-3-insights", group: insights, path: "/data_groups/8", x: 34, y: y + 78, width: 430, height: 204 },
    { id: "slidedoc-page-3-meeting-agreements", group: agreements, path: "/data_groups/9", x: 474, y: y + 78, width: 452, height: 204 },
    { id: "slidedoc-page-3-dynamic-suggestions", group: suggestions, path: "/data_groups/10", x: 34, y: y + 292, width: 550, height: 214 },
    { id: "slidedoc-page-3-actions", group: actions, path: "/data_groups/11", x: 594, y: y + 292, width: 332, height: 214 },
  ];
  return cards.map(({ id, group, path: dataPath, x, y: cardY, width, height }) => {
    const body = factList(layout, { cardId: id, group, x: x + 18, y: cardY + 52, width: width - 36, indexes: group.facts.map((_, index) => index) }).markup;
    return card(layout, { id, dataPath, x, y: cardY, width, height, title: group.title, body });
  }).join("\n");
}

function validateGeometry(layout, map) {
  const policy = map.readability_policy;
  let elementsOutsideCanvas = 0;
  let crossPageOverlap = 0;
  let textOverflow = 0;
  let belowMinimum = 0;
  let outOfCard = 0;
  for (const block of layout.textBlocks) {
    const card = layout.cards.find((item) => item.id === block.cardId);
    if (!card) fail(`не найдена карточка текста ${block.id}`);
    const minimum = block.role === "card-heading" ? policy.minimum_card_heading_font_size_px : block.role === "table" ? policy.minimum_table_font_size_px : policy.minimum_body_font_size_px;
    const pageStart = Math.floor(card.y / DIMENSIONS.pageHeight) * DIMENSIONS.pageHeight;
    const finalBaseline = block.y + (block.lines.length - 1) * block.lineHeight;
    if (block.size < minimum || (block.role !== "card-heading" && block.lineHeight < policy.minimum_line_height_px)) belowMinimum += 1;
    if (block.x < 0 || finalBaseline > DIMENSIONS.height || block.x + block.width > DIMENSIONS.width) elementsOutsideCanvas += 1;
    if (block.y < pageStart || finalBaseline > pageStart + DIMENSIONS.pageHeight) crossPageOverlap += 1;
    if (block.x < card.x + 14 || block.x + block.width > card.x + card.width - 10 || block.y < card.y + 22 || finalBaseline > card.y + card.height - 10) outOfCard += 1;
    if (block.lines.some((line) => line.length * block.size * 0.57 > block.width)) textOverflow += 1;
  }
  return {
    elements_outside_canvas_count: elementsOutsideCanvas,
    cross_page_overlap_count: crossPageOverlap,
    text_overflow_count: textOverflow,
    embedded_raster_count: 0,
    external_resource_count: 0,
    readability_check: {
      minimum_body_font_size_px: policy.minimum_body_font_size_px,
      minimum_table_font_size_px: policy.minimum_table_font_size_px,
      minimum_card_heading_font_size_px: policy.minimum_card_heading_font_size_px,
      minimum_line_height_px: policy.minimum_line_height_px,
      below_minimum_font_size_count: belowMinimum,
      out_of_card_text_count: outOfCard,
      page_capacity_violations: 0,
    },
  };
}

function buildSvg(client, map) {
  const groupsByPath = new Map(client.data_groups.map((group, index) => [`/data_groups/${index}`, group]));
  const pages = map.pages.map((page) => page.content_bindings.map((binding) => groupsByPath.get(binding.data_path)));
  if (pages.flat().some((group) => !group)) fail("карта SlideDoc содержит отсутствующую группу модели");
  const layout = newLayout();
  const source = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="1620" viewBox="0 0 960 1620" role="img" aria-label="Трёхстраничный SlideDoc по справке ООО Водолей Трейд">
  <title>Презентация по справке ООО «Водолей Трейд»</title>
  <desc>Самостоятельный редактируемый SVG. Оформление построено по визуальным признакам PDF-донора; факты получены только из очищенной модели клиента.</desc>
  <g id="slidedoc-page-1" data-page="1">${pageBackground(1, client.client.short_name)}${buildPageOne(layout, pages[0])}</g>
  <g id="slidedoc-page-2" data-page="2">${pageBackground(2, client.client.short_name)}${buildPageTwo(layout, pages[1])}</g>
  <g id="slidedoc-page-3" data-page="3">${pageBackground(3, client.client.short_name)}${buildPageThree(layout, pages[2])}</g>
</svg>\n`;
  return { source, geometry: validateGeometry(layout, map) };
}

function validateSource(source) {
  if (/<(?:image|foreignObject|script)\b/iu.test(source) || /(?:\.pdf\b|szh-dense-slidedoc-4x\.png|ГК Достовалова|\/Users\/|file:\/\/)/iu.test(source)) fail("SVG SlideDoc содержит запрещённый прямой источник или исторический материал");
}
function assertGeometry(geometry) {
  const failures = [geometry.elements_outside_canvas_count, geometry.cross_page_overlap_count, geometry.text_overflow_count, geometry.readability_check.below_minimum_font_size_count, geometry.readability_check.out_of_card_text_count, geometry.readability_check.page_capacity_violations];
  if (failures.some((value) => value !== 0)) fail("SVG SlideDoc не прошёл фактическую проверку читаемости и границ карточек");
}

function prepareSlideDocReviewSource({ root = process.cwd(), check = false, replaceUnaccepted = false } = {}) {
  const sourcePath = path.join(root, SOURCE_PATH);
  const manifestPath = path.join(root, MANIFEST_PATH);
  const approvalPath = path.join(root, REVIEW_DIRECTORY, "owner-approval.json");
  const map = readJson(root, MAP_PATH);
  const client = readJson(root, CLIENT_PATH);
  const expected = buildSvg(client, map);
  validateSource(expected.source);
  assertGeometry(expected.geometry);
  if (check) {
    const manifest = readJson(root, MANIFEST_PATH);
    if (fs.readFileSync(sourcePath, "utf8") !== expected.source || manifest.source_svg_sha256 !== sha256(sourcePath) || JSON.stringify(manifest.geometry_check) !== JSON.stringify(expected.geometry)) fail("сохранённый SVG SlideDoc не совпадает с картой данных или проверенной компоновкой");
    return manifest;
  }
  if (fs.existsSync(approvalPath)) fail("принятый кадр SlideDoc нельзя пересобирать");
  if (fs.existsSync(manifestPath) && !replaceUnaccepted) fail("SVG SlideDoc уже подготовлен; для исправления до приёмки нужен явный --replace-unaccepted");
  writeText(root, SOURCE_PATH, expected.source);
  const manifest = {
    "$schema": "../../../source/schemas/lisa-presentation-variant-review-source-manifest.schema.json",
    "version": "1.1.0",
    "frame_id": "lisa-presentation-slidedoc",
    "status": "svg_source_prepared_pending_visual_check",
    "visual_donor_id": DONOR_ID,
    "visual_reference_only": true,
    "raw_pdf_direct_render_used": false,
    "content_map_path": "source/lisa-presentation-slidedoc-content-map.json",
    "content_map_sha256": sha256(path.join(root, MAP_PATH)),
    "client_reference_data_path": "source/client-reference-data.json",
    "client_reference_data_sha256": sha256(path.join(root, CLIENT_PATH)),
    "source_svg_path": "candidate-evidence/frame-review/lisa-presentation-slidedoc/source.svg",
    "source_svg_sha256": sha256(sourcePath),
    "source_svg_dimensions": { "width": DIMENSIONS.width, "height": DIMENSIONS.height },
    "page_count": 3,
    "geometry_check": expected.geometry,
    "active_release_mutation_prohibited": true,
    "draft_png_rendered": false,
    "draft_png_path": null,
    "draft_png_sha256": null,
    "draft_png_dimensions": null,
    "draft_png_non_white_pixel_count": null,
    "draft_page_pngs": null,
    "owner_frame_approval": null
  };
  writeText(root, MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  try {
    const argumentsList = process.argv.slice(2);
    if (argumentsList.some((argument) => !["--check", "--replace-unaccepted"].includes(argument)) || (argumentsList.includes("--check") && argumentsList.includes("--replace-unaccepted"))) fail("использование: node scripts/prepare-lisa-presentation-slidedoc-review-source.mjs [--check|--replace-unaccepted]");
    const manifest = prepareSlideDocReviewSource({ check: argumentsList.includes("--check"), replaceUnaccepted: argumentsList.includes("--replace-unaccepted") });
    process.stdout.write(argumentsList.includes("--check") ? `SVG SlideDoc актуален: ${manifest.source_svg_path}\n` : `SVG SlideDoc подготовлен: ${manifest.source_svg_path}\n`);
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "SVG SlideDoc не подготовлен"}\n`);
    process.exitCode = 1;
  }
}

export { buildSvg, prepareSlideDocReviewSource };
