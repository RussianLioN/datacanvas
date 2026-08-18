import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import opentype from "opentype.js";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const SOURCE_PATH = `${PACKAGE_PATH}/editable-sources`;
const SOURCE_RENDER_CATALOG_PATH = `${PACKAGE_PATH}/source/source-render-catalog.json`;
const FONT_PATH = `${PACKAGE_PATH}/source/fonts/NotoSans[wdth,wght].ttf`;
const TITLE = "Справка по клиенту";
const TITLE_FILL = "rgb(29,37,50)";
const BODY_FILL = "rgb(162,165,184)";
const CHAT_FILL = "rgb(44,51,64)";
const MEETING_CARD_SPECS = Object.freeze({
  "5.4.svg": Object.freeze({
    card_clip_path: "2054",
    meeting_clip_path: "2057",
    old_height: "128.000000",
    new_height: "96.000000",
    x: "80.000000",
    y: "281.000000",
    rx: "16.000000",
    occurrences: 6,
  }),
  "7.1 — Холдинг.svg": Object.freeze({
    card_clip_path: "204",
    meeting_clip_path: "207",
    old_height: "140.000000",
    new_height: "108.000000",
    x: "80.000000",
    y: "522.001221",
    rx: "24.000000",
    occurrences: 1,
  }),
  "7.2 — Длинное название клиента + холдинг.svg": Object.freeze({
    card_clip_path: "235",
    meeting_clip_path: "238",
    old_height: "212.000000",
    new_height: "180.000000",
    x: "80.000000",
    y: "226.000000",
    rx: "24.000000",
    occurrences: 1,
  }),
  "7.3 — Презентация.svg": Object.freeze({
    card_clip_path: "274",
    meeting_clip_path: "277",
    old_height: "140.000000",
    new_height: "108.000000",
    x: "80.000000",
    y: "188.000000",
    rx: "24.000000",
    occurrences: 1,
  }),
});

function fail(message) {
  throw new Error(message);
}

function toArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function loadFont(root) {
  const bytes = fs.readFileSync(path.join(root, FONT_PATH));
  return opentype.parse(toArrayBuffer(bytes));
}

function outlinedText(font, text, { x, baseline, size, fill = TITLE_FILL, weight = 400 }) {
  const d = font.getPath(text, x, baseline, size, { variation: { wght: weight, wdth: 100 } }).toPathData(3);
  return `<path d="${d}" fill="${fill}" fill-rule="nonzero" />`;
}

function outlinedWords(font, text, options) {
  let cursor = options.x;
  return text.split(/\s+/u).map((word) => {
    const path = outlinedText(font, word, { ...options, x: cursor });
    cursor += font.getAdvanceWidth(`${word} `, options.size, { variation: { wght: options.weight ?? 400, wdth: 100 } });
    return path;
  }).join("");
}

function wrapText(font, text, width, size, weight = 400) {
  const words = text.split(/\s+/u);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    const candidateWidth = font.getAdvanceWidth(candidate, size, { variation: { wght: weight, wdth: 100 } });
    if (line && candidateWidth > width) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function overlay(id, rect, paths) {
  const radius = rect.rx === undefined ? "" : ` rx="${rect.rx}"`;
  const background = `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}"${radius} fill="${rect.fill}" />`;
  return `<g id="${id}">${background}${paths}</g>`;
}

function textOverlay(id, paths) {
  return `<g id="${id}">${paths}</g>`;
}

function textLines(font, lines, { x, baseline, size, lineHeight, fill, weight = 400 }) {
  return lines.map((line, index) => outlinedText(font, line, {
    x,
    baseline: baseline + index * lineHeight,
    size,
    fill,
    weight,
  })).join("");
}

function replaceExactly(source, search, replacement, label) {
  const occurrences = source.split(search).length - 1;
  if (occurrences !== 1) fail(`${label}: ожидается ровно одно совпадение, получено ${occurrences}`);
  return source.replace(search, replacement);
}

function replaceAllExactly(source, search, replacement, expectedCount, label) {
  const occurrences = source.split(search).length - 1;
  if (occurrences !== expectedCount) fail(`${label}: ожидается ${expectedCount} совпадений, получено ${occurrences}`);
  return source.replaceAll(search, replacement);
}

function ensureExactly(source, search, replacement, label) {
  if (source.includes(replacement)) return source;
  return replaceExactly(source, search, replacement, label);
}

function appendOverlay(source, markup, label) {
  const id = markup.match(/^<g id="([^"]+)"/u)?.[1];
  if (!id) fail(`${label}: отсутствует идентификатор векторной правки`);
  if (source.includes(`id="${id}"`)) return source;
  const closing = "</svg>";
  if (!source.endsWith(`${closing}\n`)) fail(`${label}: SVG должен завершаться закрывающим тегом`);
  return `${source.slice(0, -closing.length - 1)}\t${markup}\n${closing}\n`;
}

function replaceOverlay(source, markup, label) {
  const id = markup.match(/^<g id="([^"]+)"/u)?.[1];
  if (!id) fail(`${label}: отсутствует идентификатор векторной правки`);
  const pattern = new RegExp(`<g id="${id}">[\\s\\S]*?<\\/g>`, "u");
  if (pattern.test(source)) return source.replace(pattern, markup);
  return appendOverlay(source, markup, label);
}

function removeOverlay(source, id) {
  const pattern = new RegExp(`<g id="${id}">[\\s\\S]*?<\\/g>\\n?`, "u");
  return source.replace(pattern, "");
}

function prepareSvgUpdate(root, fileName, transform) {
  const filePath = path.join(root, SOURCE_PATH, fileName);
  const before = fs.readFileSync(filePath, "utf8");
  const after = transform(before);
  return { filePath, before, after };
}

function titleOverlay(font, id, rect, text) {
  return overlay(id, rect, outlinedText(font, text, {
    x: rect.text_x,
    baseline: rect.baseline,
    size: rect.size,
    weight: 700,
  }));
}

function summaryCtaOverlay() {
  return `<g id="lisa-edit-5-2-cta"><rect x="64" y="738" width="393" height="64" fill="rgb(255,255,255)" /><rect x="80" y="754" width="361" height="40" rx="20" fill="rgb(67,103,206)" /><text x="260.5" y="779" fill="rgb(255,255,255)" font-family="Arial, sans-serif" font-size="16" font-weight="700" text-anchor="middle">Сформировать презентацию</text></g>`;
}

function rewriteSummary(font, source) {
  let updated = source;
  if (updated.includes('<rect id="Frame 2131330375" width="361.000000" height="104.000000" x="80.000000" y="281.000000" rx="16.000000"')) {
    updated = replaceAllExactly(
      updated,
      '<rect id="Frame 2131330375" width="361.000000" height="104.000000" x="80.000000" y="281.000000" rx="16.000000"',
      '<rect id="Frame 2131330375" width="361.000000" height="56.000000" x="80.000000" y="281.000000" rx="16.000000"',
      6,
      "5.2: высота плашки",
    );
  }
  updated = ensureExactly(
    updated,
    '<g id="Group 2131329366">',
    '<g id="Group 2131329366" transform="translate(0,-48)">',
    "5.2: содержимое после плашки",
  );
  updated = ensureExactly(
    updated,
    '<g id="Frame 2131330375" customFrame="url(#clipPath_2292)">',
    '<g id="Frame 2131330375" transform="translate(0,48)" customFrame="url(#clipPath_2292)">',
    "5.2: закреплённая плашка",
  );
  updated = ensureExactly(
    updated,
    '<g id="Frame 2131330372" opacity="0" customFrame="url(#clipPath_2293)">',
    '<g id="Frame 2131330372" customFrame="url(#clipPath_2293)">',
    "5.2: строка клиента",
  );
  updated = ensureExactly(
    updated,
    '<g id="Frame 2131330376" customFrame="url(#clipPath_2295)">',
    '<g id="Frame 2131330376" opacity="0" customFrame="url(#clipPath_2295)">',
    "5.2: строка регулярной встречи",
  );
  updated = ensureExactly(
    updated,
    '<g id="Frame 2131330382" transform="translate(0,-48)" customFrame="url(#clipPath_2300)">',
    '<g id="Frame 2131330382" customFrame="url(#clipPath_2300)">',
    "5.2: вложенное содержимое",
  );
  updated = ensureExactly(
    updated,
    '<g id="Frame 2131329808" transform="translate(0,-48)" customFrame="url(#clipPath_2320)">',
    '<g id="Frame 2131329808" customFrame="url(#clipPath_2320)">',
    "5.2: кнопка заказа",
  );
  updated = ensureExactly(
    updated,
    '<rect width="393.000000" height="64.000000" x="64.000000" y="690.000000" fill="rgb(255,255,255)" />',
    '<rect width="393.000000" height="64.000000" x="64.000000" y="738.000000" fill="rgb(255,255,255)" />',
    "5.2: область кнопки заказа",
  );
  updated = ensureExactly(
    updated,
    '<rect width="361.000000" height="40.000000" x="80.000000" y="706.000000" rx="20.000000" fill="rgb(255,255,255)" />',
    '<rect width="361.000000" height="40.000000" x="80.000000" y="754.000000" rx="20.000000" fill="rgb(255,255,255)" />',
    "5.2: область синей кнопки",
  );
  updated = ensureExactly(
    updated,
    '<g id="button_footer_2.0" filter="url(#filter_161)">',
    '<g id="button_footer_2.0" filter="url(#filter_161)" customFrame="url(#clipPath_2319)">',
    "5.2: внешняя отсечка кнопки",
  );
  updated = appendOverlay(updated, '<g id="lisa-edit-5-2-card" />', "5.2: маркер карточки");
  updated = replaceOverlay(updated, summaryCtaOverlay(), "5.2: кнопка заказа");
  return appendOverlay(updated, titleOverlay(font, "lisa-edit-5-2-title", {
    x: 78, y: 190, width: 292, height: 34, fill: "rgb(255,255,255)", text_x: 80, baseline: 218, size: 24,
  }, TITLE), "5.2: заголовок");
}

function rewriteTitle(font, fileName, source, rect) {
  return appendOverlay(source, titleOverlay(font, `lisa-edit-${fileName}-title`, rect, TITLE), `${fileName}: заголовок`);
}

function fullReferenceChipOverlay(font) {
  const text = "Показать полную справку";
  const size = 16;
  const width = font.getAdvanceWidth(text, size, { variation: { wght: 400, wdth: 100 } });
  const x = 215 + (226 - width) / 2;
  return overlay("lisa-edit-7-1-full-reference-chip", {
    x: 215,
    y: 400,
    width: 226,
    height: 48,
    rx: 24,
    fill: "rgb(238.345,238.243,244)",
  }, outlinedWords(font, text, {
    x,
    baseline: 430,
    size,
    fill: TITLE_FILL,
  }));
}

function rewritePresentationOrder(font, source) {
  const updated = replaceOverlay(
    rewriteMeetingCard(source, "7.1 — Холдинг.svg"),
    fullReferenceChipOverlay(font),
    "7.1: плашка полной справки",
  );
  return rewriteTitle(font, "7-1", updated, {
    x: 94, y: 540, width: 274, height: 26, fill: "rgb(255,255,255)", text_x: 96, baseline: 558, size: 20,
  });
}

function rewriteMeetingCard(source, fileName) {
  const spec = MEETING_CARD_SPECS[fileName];
  if (!spec) fail(`${fileName}: отсутствует описание карточки встречи`);
  const oldCardRect = `<rect id="Frame 2131330375" width="361.000000" height="${spec.old_height}" x="${spec.x}" y="${spec.y}" rx="${spec.rx}"`;
  const newCardRect = `<rect id="Frame 2131330375" width="361.000000" height="${spec.new_height}" x="${spec.x}" y="${spec.y}" rx="${spec.rx}"`;
  let updated = source;
  if (!updated.includes(newCardRect)) {
    updated = replaceAllExactly(updated, oldCardRect, newCardRect, spec.occurrences, `${fileName}: высота карточки`);
  } else if (updated.includes(oldCardRect)) {
    fail(`${fileName}: одновременно найдены исходная и сокращённая высоты карточки`);
  }

  const clipPattern = new RegExp(
    `(<clipPath id="clipPath_${spec.card_clip_path}">\\s*<rect width="361\\.000000" height=")${spec.old_height}(" x="${spec.x}" y="${spec.y}" rx="${spec.rx}" fill="rgb\\(255,255,255\\)" \\/>)`,
    "u",
  );
  const shortenedClipPattern = new RegExp(
    `<clipPath id="clipPath_${spec.card_clip_path}">\\s*<rect width="361\\.000000" height="${spec.new_height}" x="${spec.x}" y="${spec.y}" rx="${spec.rx}" fill="rgb\\(255,255,255\\)" \\/>`,
    "u",
  );
  if (clipPattern.test(updated)) {
    updated = updated.replace(clipPattern, `$1${spec.new_height}$2`);
  } else if (!shortenedClipPattern.test(updated)) {
    fail(`${fileName}: не найдена геометрия отсечения карточки`);
  }

  return ensureExactly(
    updated,
    `<g id="Frame 2131330376" customFrame="url(#clipPath_${spec.meeting_clip_path})">`,
    `<g id="Frame 2131330376" opacity="0" customFrame="url(#clipPath_${spec.meeting_clip_path})">`,
    `${fileName}: строка регулярной встречи`,
  );
}

function rewriteGenerating(font, source) {
  let updated = rewriteTitle(font, "7-2", source, {
    x: 94, y: 242, width: 274, height: 26, fill: "rgb(255,255,255)", text_x: 96, baseline: 260, size: 20,
  });
  for (const line of [2, 3, 4]) {
    updated = ensureExactly(
      updated,
      `<g id="presentation-status-line-${line}" fill="rgb(144,150,169)" fill-rule="nonzero">`,
      `<g id="presentation-status-line-${line}" opacity="0" fill="rgb(144,150,169)" fill-rule="nonzero">`,
      `7.2: исходная строка статуса ${line}`,
    );
  }
  const text = "Можете переключиться на другие задачи и через 20 минут проверить почту OMEGA и SIGMA: туда будет направлена презентация.";
  const lines = wrapText(font, text, 345, 15);
  if (lines.length !== 3) fail(`7.2: текст должен занимать три строки, получено ${lines.length}`);
  const paths = textLines(font, lines, {
    x: 80,
    baseline: 739,
    size: 15,
    lineHeight: 25,
    fill: BODY_FILL,
  });
  return replaceOverlay(updated, textOverlay("lisa-edit-7-2-email-text", paths), "7.2: текст ожидания");
}

const STATUS_VARIANTS = Object.freeze([
  Object.freeze({
    state_id: "lisa-order-not-accepted",
    file_name: "status-variants/lisa-order-not-accepted.svg",
    message_id: "order_not_accepted",
    message: "Не удалось принять данные для формирования презентации. Вернитесь к диалогу «Справка по клиенту» и уточните данные, либо оформите тикет в сопровождение.",
  }),
  Object.freeze({
    state_id: "lisa-delivery-delayed",
    file_name: "status-variants/lisa-delivery-delayed.svg",
    message_id: "delivery_delayed",
    message: "Презентация формируется дольше 20 минут. Задача передана в сопровождение; сообщу здесь, если отправка на почту будет подтверждена.",
  }),
  Object.freeze({
    state_id: "lisa-delivery-partial",
    file_name: "status-variants/lisa-delivery-partial.svg",
    message_id: "delivery_partial",
    message: "Презентация сформирована и направлена в OMEGA. Отправка в SIGMA пока не подтверждена. Задача передана в сопровождение; сообщу здесь, если отправка будет подтверждена.",
  }),
]);

function statusVariantMarkup(font, variant) {
  const title = "Справка по клиенту";
  const lines = wrapText(font, variant.message, 315, 12.2);
  if (lines.length > 8) fail(`${variant.state_id}: сообщение не помещается в утверждённую область SVG`);
  const titlePath = outlinedText(font, title, { x: 128, baseline: 678, size: 14, fill: TITLE_FILL, weight: 700 });
  const messagePaths = textLines(font, lines, {
    x: 128,
    baseline: 699,
    size: 12.2,
    lineHeight: 15.2,
    fill: "rgb(87,92,112)",
  });
  return `<g id="lisa-status-${variant.message_id}"><rect x="64" y="638" width="393" height="185" fill="rgb(255,255,255)" /><circle cx="96" cy="671" r="7" fill="rgb(87,92,112)" />${titlePath}${messagePaths}</g>`;
}

function writeStatusVariants(root, font, source) {
  for (const variant of STATUS_VARIANTS) {
    const target = path.join(root, SOURCE_PATH, variant.file_name);
    const statusMarkup = statusVariantMarkup(font, variant);
    const withoutOtherStatus = source.replace(/\t<g id="lisa-status-[^"]+">[\s\S]*?<\/g>\n?/gu, "");
    const output = appendOverlay(withoutOtherStatus, statusMarkup, `${variant.state_id}: канонический SVG статуса`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== output) fs.writeFileSync(target, output, "utf8");
  }
}

function sha256File(target) {
  return createHash("sha256").update(fs.readFileSync(target)).digest("hex");
}

function syncSourceRenderCatalog(root) {
  const target = path.join(root, SOURCE_RENDER_CATALOG_PATH);
  if (!fs.existsSync(target)) return;
  const catalog = JSON.parse(fs.readFileSync(target, "utf8"));
  let changed = false;
  for (const source of catalog.sources ?? []) {
    if (typeof source.path !== "string" || !source.path.startsWith("editable-sources/")) continue;
    const sourcePath = path.join(root, PACKAGE_PATH, source.path);
    if (!fs.existsSync(sourcePath)) fail(`${source.id}: не найден исходник для синхронизации каталога`);
    const actualHash = sha256File(sourcePath);
    if (source.sha256 !== actualHash) {
      source.sha256 = actualHash;
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(target, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
}

function rewriteChatList(font, source) {
  const updated = replaceOverlay(source, overlay("lisa-edit-08-client-name", {
    x: 84, y: 476, width: 289, height: 29, fill: "rgb(238,238,244)",
  }, outlinedWords(font, "Справка по клиенту ГК Достовалова", {
    x: 88,
    baseline: 497,
    size: 16,
    fill: CHAT_FILL,
  })), "08: название справки в выбранном чате");
  return removeOverlay(updated, "lisa-edit-08-meeting-title");
}

export function updatePresentationLinkLisaEditableSources({ root = process.cwd() } = {}) {
  const font = loadFont(root);
  const presentationOrderFont = loadFont(root);
  const updates = [
    prepareSvgUpdate(root, "5.2.svg", (source) => rewriteSummary(font, source)),
    prepareSvgUpdate(root, "5.4.svg", (source) => rewriteTitle(font, "5-4", rewriteMeetingCard(source, "5.4.svg"), {
    x: 78, y: 190, width: 292, height: 34, fill: "rgb(255,255,255)", text_x: 80, baseline: 218, size: 24,
    })),
    prepareSvgUpdate(root, "7.1 — Холдинг.svg", (source) => rewritePresentationOrder(presentationOrderFont, source)),
    prepareSvgUpdate(root, "7.2 — Длинное название клиента + холдинг.svg", (source) => rewriteGenerating(font, rewriteMeetingCard(source, "7.2 — Длинное название клиента + холдинг.svg"))),
    prepareSvgUpdate(root, "7.3 — Презентация.svg", (source) => rewriteTitle(font, "7-3", rewriteMeetingCard(source, "7.3 — Презентация.svg"), {
    x: 94, y: 204, width: 274, height: 26, fill: "rgb(255,255,255)", text_x: 96, baseline: 222, size: 20,
    })),
    prepareSvgUpdate(root, "08.svg", (source) => rewriteChatList(font, source)),
  ];
  for (const update of updates) {
    if (update.after !== update.before) fs.writeFileSync(update.filePath, update.after, "utf8");
  }
  const generatedSource = fs.readFileSync(path.join(root, SOURCE_PATH, "7.2 — Длинное название клиента + холдинг.svg"), "utf8");
  writeStatusVariants(root, font, generatedSource);
  syncSourceRenderCatalog(root);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  updatePresentationLinkLisaEditableSources();
}
