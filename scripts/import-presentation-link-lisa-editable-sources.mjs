import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { TextDecoder } from "node:util";
import { webkit } from "playwright";

const LISA_PACKAGE_RELATIVE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const EDITABLE_SOURCES_RELATIVE_PATH = `${LISA_PACKAGE_RELATIVE_PATH}/editable-sources`;
const BASES_RELATIVE_PATH = `${LISA_PACKAGE_RELATIVE_PATH}/source/bases`;
const PNG_SIGNATURE = Buffer.from("89504e470d0a1a0a", "hex");
const MAX_SVG_BYTES = 6 * 1024 * 1024;
const MAX_PNG_BYTES = 96 * 1024 * 1024;
const SNAPSHOT_TIMEOUT_MS = 30_000;
const SCALE = 3;
const utf8Decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
let publishRenameHook = null;
const PHONE_SEGMENT_VIEWPORT_RECTS = Object.freeze({
  system_top: Object.freeze({ x: 0, y: 0, width: 393, height: 53 }),
  scroll_content: Object.freeze({ x: 0, y: 53, width: 393, height: 765 }),
  system_bottom: Object.freeze({ x: 0, y: 818, width: 393, height: 34 }),
});
const PHONE_SEGMENT_SUFFIXES = Object.freeze({
  system_top: "status",
  scroll_content: "content",
  system_bottom: "home",
});
const DEFAULT_PHONE_SEGMENT_SOURCE_RECTS = Object.freeze({
  system_top: Object.freeze({ x: 64, y: 48, width: 393, height: 53 }),
  scroll_content: Object.freeze({ x: 64, y: 101, width: 393, height: 765 }),
  system_bottom: Object.freeze({ x: 64, y: 866, width: 393, height: 34 }),
});
const PHONE_SEGMENT_ROLES = Object.freeze(["system_top", "scroll_content", "system_bottom"]);

export const APPROVED_EDITABLE_SOURCE_RASTERS = Object.freeze([
  Object.freeze({
    state_id: "lisa-client-answer",
    source: "1.1.svg",
    legacy_output: "lisa-client-answer-3x.png",
    sha256: "f2b443c4e3141a929d1185147438613ff93cf1eb830f55b2cbbf2e07ba43f5bf",
    dimensions: Object.freeze({ width: 521, height: 1542 }),
    source_rects: Object.freeze({
      system_top: Object.freeze({ x: 64, y: 48, width: 393, height: 53 }),
      scroll_content: Object.freeze({ x: 64, y: 101, width: 393, height: 1327 }),
      system_bottom: Object.freeze({ x: 64, y: 1428, width: 393, height: 34 }),
    }),
  }),
  Object.freeze({
    state_id: "lisa-materials-summary",
    source: "5.2.svg",
    legacy_output: "lisa-materials-summary-3x.png",
    sha256: "5ac62c67c8c567570f9f3e48d475018db257058012590c1d67627211927fc5ea",
    dimensions: Object.freeze({ width: 521, height: 980 }),
    source_rects: DEFAULT_PHONE_SEGMENT_SOURCE_RECTS,
  }),
  Object.freeze({
    state_id: "lisa-materials-full-reference",
    source: "5.4.svg",
    legacy_output: "lisa-materials-full-reference-3x.png",
    sha256: "032b59433428c56232fcfcc0ccc83e753d801e23c1f85963cf6042ae9ff4a01e",
    dimensions: Object.freeze({ width: 521, height: 5194 }),
    source_rects: Object.freeze({
      system_top: Object.freeze({ x: 64, y: 48, width: 393, height: 53 }),
      scroll_content: Object.freeze({ x: 64, y: 101, width: 393, height: 4979 }),
      system_bottom: Object.freeze({ x: 64, y: 5080, width: 393, height: 34 }),
    }),
  }),
  Object.freeze({
    state_id: "lisa-presentation-order",
    source: "7.1 — Холдинг.svg",
    legacy_output: "lisa-presentation-order-3x.png",
    sha256: "a83e313adb0aaaf4c102397fde0b252fae6095cd1cb888bccb3871df445c2903",
    dimensions: Object.freeze({ width: 521, height: 980 }),
    source_rects: DEFAULT_PHONE_SEGMENT_SOURCE_RECTS,
  }),
  Object.freeze({
    state_id: "lisa-presentation-generating",
    source: "7.2 — Длинное название клиента + холдинг.svg",
    legacy_output: "lisa-presentation-generating-3x.png",
    sha256: "76ec08049865b6a2d5aafcb3fc7907889719bd8a0e37fb813eae642034bee894",
    dimensions: Object.freeze({ width: 521, height: 980 }),
    source_rects: DEFAULT_PHONE_SEGMENT_SOURCE_RECTS,
  }),
  Object.freeze({
    state_id: "lisa-presentation-sent",
    source: "7.3 — Презентация.svg",
    legacy_output: "lisa-presentation-sent-3x.png",
    sha256: "7a0ae91bea7a98ef31ea0b4b186ee2482877f2b633868c5e39d2f692c73302a5",
    dimensions: Object.freeze({ width: 521, height: 980 }),
    source_rects: DEFAULT_PHONE_SEGMENT_SOURCE_RECTS,
  }),
]);

const allowedSvgElements = new Set([
  "svg",
  "defs",
  "g",
  "clipPath",
  "linearGradient",
  "stop",
  "rect",
  "circle",
  "path",
  "mask",
  "filter",
  "effect",
  "feFlood",
  "feColorMatrix",
  "feOffset",
  "feGaussianBlur",
  "feBlend",
  "feComposite",
  "foreignObject",
  "div",
]);

const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function fail(message) {
  throw new Error(message);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function crc32(value) {
  let crc = 0xffffffff;
  for (const byte of value) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function assertRange(buffer, offset, length, message) {
  if (!Number.isInteger(offset) || !Number.isInteger(length) || offset < 0 || length < 0 || offset + length > buffer.length) {
    fail(message);
  }
}

function decodeUtf8(value, message) {
  try {
    const decoded = utf8Decoder.decode(value);
    if (!Buffer.from(decoded, "utf8").equals(value)) fail(message);
    return decoded;
  } catch {
    fail(message);
  }
}

function resolveRoot(root) {
  try {
    return fs.realpathSync(root);
  } catch {
    fail("рабочий корень импортёра недоступен");
  }
}

function resolvePackagePath(root, relativePath, label) {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    path.isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    relativePath.includes("\u0000") ||
    relativePath.split("/").includes("..")
  ) {
    fail(`${label}: небезопасный относительный путь`);
  }
  const target = path.resolve(root, relativePath);
  if (!target.startsWith(`${root}${path.sep}`)) fail(`${label}: путь выходит за рабочий корень`);
  return target;
}

function readRegularFile(filePath, label, maxBytes) {
  let stat;
  try {
    stat = fs.lstatSync(filePath);
  } catch {
    fail(`${label} недоступен`);
  }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size <= 0 || stat.size > maxBytes) {
    fail(`${label} не является безопасным обычным файлом`);
  }
  return fs.readFileSync(filePath);
}

function assertSafeOutputName(output) {
  if (!/^lisa-[a-z0-9-]+-(?:status|content|home)-3x\.png$/u.test(output)) fail(`${output}: небезопасное имя PNG`);
}

function assertSafeLegacyOutputName(output) {
  if (!/^lisa-[a-z0-9-]+-3x\.png$/u.test(output)) fail(`${output}: небезопасное имя устаревшего PNG`);
}

function cloneRect(value) {
  return { x: value.x, y: value.y, width: value.width, height: value.height };
}

function assertRectInsideDimensions(rect, dimensions, label) {
  for (const key of ["x", "y", "width", "height"]) {
    if (!Number.isInteger(rect[key]) || rect[key] < 0 || (["width", "height"].includes(key) && rect[key] < 1)) {
      fail(`${label}: прямоугольник должен содержать положительные целые размеры`);
    }
  }
  if (rect.x + rect.width > dimensions.width || rect.y + rect.height > dimensions.height) {
    fail(`${label}: прямоугольник выходит за логические границы SVG`);
  }
}

function outputForLayer(stateId, role) {
  if (!/^lisa-[a-z0-9-]+$/u.test(stateId)) fail(`${stateId}: небезопасный state_id`);
  return `${stateId}-${PHONE_SEGMENT_SUFFIXES[role]}-3x.png`;
}

function renameManagedPath(from, to, context) {
  if (publishRenameHook) publishRenameHook({ from, to, ...context });
  fs.renameSync(from, to);
}

function matchForeignObjects(svg, label) {
  const allOpen = [...svg.matchAll(/<foreignObject\b[^>]*>/giu)];
  const exact = [...svg.matchAll(/<foreignObject\b([^>]*)>\s*<div\b([^>]*)\/\s*>\s*<\/foreignObject>/giu)];
  if (allOpen.length !== exact.length) fail(`${label}: foreignObject допускается только как пустой XHTML div`);
  for (const [, foreignAttributes, divAttributes] of exact) {
    const foreignNames = [...foreignAttributes.matchAll(/\s([A-Za-z][\w:-]*)\s*=/gu)].map((match) => match[1]);
    if (foreignNames.some((name) => !["width", "height", "x", "y"].includes(name))) {
      fail(`${label}: foreignObject содержит неразрешённый атрибут`);
    }
    const divNames = [...divAttributes.matchAll(/\s([A-Za-z][\w:-]*)\s*=/gu)].map((match) => match[1]);
    if (divNames.some((name) => !["xmlns", "style"].includes(name))) {
      fail(`${label}: XHTML div в foreignObject содержит неразрешённый атрибут`);
    }
    const xmlns = divAttributes.match(/\bxmlns\s*=\s*(["'])\s*([^"']+)\s*\1/iu)?.[2];
    if (xmlns !== "http://www.w3.org/1999/xhtml") fail(`${label}: foreignObject не содержит ожидаемое XHTML пространство имён`);
    const style = divAttributes.match(/\bstyle\s*=\s*(["'])([\s\S]*?)\1/iu)?.[2];
    if (!style || /(?:https?:|file:|data:|javascript:|vbscript:|@import|expression\s*\()/iu.test(style)) {
      fail(`${label}: foreignObject содержит внешний или исполнимый стиль`);
    }
    for (const reference of style.matchAll(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/giu)) {
      if (!/^#[A-Za-z][\w.-]*$/u.test(reference[2])) fail(`${label}: foreignObject содержит внешний URL`);
    }
  }
  return svg.replace(
    /<foreignObject\b([^>]*)>\s*<div\b([^>]*)\/\s*>\s*<\/foreignObject>/giu,
    "<foreignObject$1><div$2></div></foreignObject>",
  );
}

function validateApprovedSvg(bytes, dimensions, label) {
  const svg = decodeUtf8(bytes, `${label}: SVG не является точным UTF-8`);
  if (svg.length === 0 || bytes.length > MAX_SVG_BYTES || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(svg)) {
    fail(`${label}: SVG содержит недопустимые управляющие данные`);
  }
  if (/<!|&#(?:x[0-9a-f]+|[0-9]+);/iu.test(svg)) fail(`${label}: SVG содержит декларацию или закодированную сущность`);
  const protocolProbe = svg.replace(
    /\bxmlns(?::[A-Za-z][\w.-]*)?\s*=\s*(["'])https?:\/\/www\.w3\.org\/[^"']+\1/giu,
    "",
  );
  if (/(?:https?:|file:|data:|javascript:|vbscript:|mailto:)/iu.test(protocolProbe)) fail(`${label}: SVG содержит внешний протокол`);
  if (/\bon[a-z]+\s*=/iu.test(svg) || /\b(?:href|xlink:href|src)\s*=/iu.test(svg)) {
    fail(`${label}: SVG содержит обработчик или внешний ресурс`);
  }
  if (/<\/?\s*(?:script|image|iframe|embed|object|use|style|animate(?:[A-Za-z]*)?|set|audio|video|link)\b/iu.test(svg)) {
    fail(`${label}: SVG содержит запрещённый активный или внешний элемент`);
  }
  for (const match of svg.matchAll(/<\/?\s*([A-Za-z][A-Za-z0-9:-]*)\b/gu)) {
    const name = match[1];
    if (!allowedSvgElements.has(name)) fail(`${label}: SVG содержит неразрешённый элемент ${name}`);
  }
  for (const reference of svg.matchAll(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/giu)) {
    if (!/^#[A-Za-z][\w.-]*$/u.test(reference[2])) fail(`${label}: SVG содержит внешний URL`);
  }
  const viewBox = svg.match(/\bviewBox\s*=\s*(["'])\s*0(?:\.0+)?\s+0(?:\.0+)?\s+([0-9.]+)\s+([0-9.]+)\s*\1/iu);
  if (!viewBox || Number(viewBox[2]) !== dimensions.width || Number(viewBox[3]) !== dimensions.height) {
    fail(`${label}: SVG не совпадает с зафиксированными логическими размерами`);
  }
  const width = svg.match(/\bwidth\s*=\s*(["'])\s*([0-9.]+)\s*\1/iu);
  const height = svg.match(/\bheight\s*=\s*(["'])\s*([0-9.]+)\s*\1/iu);
  if (!width || !height || Number(width[2]) !== dimensions.width || Number(height[2]) !== dimensions.height) {
    fail(`${label}: SVG не содержит зафиксированные width/height`);
  }
  return matchForeignObjects(svg, label);
}

function createPngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return chunk;
}

function inspectSafePng(png, label = "PNG", { allowCanonicalizationMetadata = false } = {}) {
  if (!Buffer.isBuffer(png) || png.length < 45 || png.length > MAX_PNG_BYTES || !png.subarray(0, 8).equals(PNG_SIGNATURE)) {
    fail(`${label} не является безопасным PNG`);
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  const idat = [];
  const chunks = [];
  let seenIhdr = false;
  let seenIend = false;
  while (offset < png.length) {
    assertRange(png, offset, 12, `${label} повреждён`);
    const length = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString("ascii");
    const dataStart = offset + 8;
    const crcOffset = dataStart + length;
    assertRange(png, dataStart, length + 4, `${label} повреждён`);
    const data = png.subarray(dataStart, crcOffset);
    if (png.readUInt32BE(crcOffset) !== crc32(Buffer.concat([Buffer.from(type, "ascii"), data]))) {
      fail(`${label} имеет неверную контрольную сумму`);
    }
    if (!seenIhdr) {
      if (type !== "IHDR" || length !== 13) fail(`${label} не содержит корректный IHDR`);
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (
        width < 1 ||
        height < 1 ||
        data[8] !== 8 ||
        ![2, 6].includes(data[9]) ||
        data[10] !== 0 ||
        data[11] !== 0 ||
        data[12] !== 0
      ) {
        fail(`${label} имеет неподдерживаемый формат`);
      }
      seenIhdr = true;
      chunks.push(type);
    } else if (type === "IDAT" && !seenIend) {
      idat.push(Buffer.from(data));
      chunks.push(type);
    } else if (type === "IEND" && !seenIend && length === 0 && idat.length > 0) {
      seenIend = true;
      chunks.push(type);
    } else if (allowCanonicalizationMetadata && ["sRGB", "gAMA", "pHYs", "bKGD", "eXIf", "caBX"].includes(type) && !seenIend) {
      // Служебные PNG-блоки снимка принимаются только до канонизации.
    } else {
      fail(`${label} содержит неразрешённый PNG-член ${type}`);
    }
    offset = crcOffset + 4;
  }
  if (!seenIend || offset !== png.length) fail(`${label} не завершён`);
  return { width, height, idat, chunks };
}

function sanitizePng(png, dimensions, label) {
  const inspected = inspectSafePng(png, label, { allowCanonicalizationMetadata: true });
  if (inspected.width !== dimensions.width || inspected.height !== dimensions.height) {
    fail(`${label} имеет неверные 3x размеры`);
  }
  const ihdr = png.subarray(8, 8 + 25);
  const result = Buffer.concat([PNG_SIGNATURE, ihdr, createPngChunk("IDAT", Buffer.concat(inspected.idat)), createPngChunk("IEND", Buffer.alloc(0))]);
  inspectSafePng(result, label);
  return result;
}

export function canonicalizeApprovedPng(bytes, dimensions, label = "утверждённый PNG") {
  if (!Buffer.isBuffer(bytes)) fail(`${label} должен быть передан как Buffer`);
  if (
    !dimensions ||
    !Number.isInteger(dimensions.width) ||
    !Number.isInteger(dimensions.height) ||
    dimensions.width < 1 ||
    dimensions.height < 1
  ) {
    fail(`${label}: не заданы положительные целые размеры`);
  }
  return sanitizePng(bytes, dimensions, label);
}

async function rasterizeSvgLayers(svg, dimensions, layers, label) {
  const browser = await webkit.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: dimensions,
      deviceScaleFactor: SCALE,
      javaScriptEnabled: false,
      colorScheme: "light",
      locale: "ru-RU",
      timezoneId: "UTC",
    });
    let routedRequest = false;
    await context.route("**/*", async (route) => {
      routedRequest = true;
      await route.abort();
    });
    const page = await context.newPage();
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"></head><body style="margin:0;overflow:hidden"><img id="snapshot" src="${dataUrl}" width="${dimensions.width}" height="${dimensions.height}" style="display:block;width:${dimensions.width}px;height:${dimensions.height}px"></body></html>`, {
      waitUntil: "domcontentloaded",
      timeout: SNAPSHOT_TIMEOUT_MS,
    });
    const natural = await page.locator("#snapshot").evaluate((image) => ({
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      width: image.getBoundingClientRect().width,
      height: image.getBoundingClientRect().height,
    }));
    if (
      !natural.complete ||
      natural.naturalWidth !== dimensions.width ||
      natural.naturalHeight !== dimensions.height ||
      Math.round(natural.width) !== dimensions.width ||
      Math.round(natural.height) !== dimensions.height
    ) {
      fail(`${label}: WebKit не подтвердил натуральные размеры SVG`);
    }
    const outputs = [];
    for (const layer of layers) {
      const output = await page.screenshot({ type: "png", clip: layer.source_rect, timeout: SNAPSHOT_TIMEOUT_MS });
      outputs.push({
        ...layer,
        bytes: sanitizePng(output, {
          width: layer.source_rect.width * SCALE,
          height: layer.source_rect.height * SCALE,
        }, `${label}: ${layer.role}`),
      });
    }
    await context.close();
    if (routedRequest) fail(`${label}: снимочный процесс попытался обратиться к сети`);
    return outputs;
  } finally {
    await browser.close();
  }
}

function verifyPublished(root, result) {
  const target = resolvePackagePath(root, result.path, `${result.output}: опубликованный PNG`);
  const actual = readRegularFile(target, `${result.output}: опубликованный PNG`, MAX_PNG_BYTES);
  if (!actual.equals(result.bytes)) fail(`${result.output}: опубликованный PNG не совпадает с пересозданным 3x снимком`);
  const inspected = inspectSafePng(actual, `${result.output}: опубликованный PNG`);
  if (inspected.width !== result.dimensions.width || inspected.height !== result.dimensions.height) {
    fail(`${result.output}: опубликованный PNG имеет неверные размеры`);
  }
}

function verifyExistingPng(filePath, dimensions, label) {
  const bytes = readRegularFile(filePath, label, MAX_PNG_BYTES);
  const inspected = inspectSafePng(bytes, label);
  if (dimensions && (inspected.width !== dimensions.width || inspected.height !== dimensions.height)) {
    fail(`${label}: существующий PNG имеет неверные размеры`);
  }
}

async function buildOne(root, spec) {
  const svgPath = resolvePackagePath(root, `${EDITABLE_SOURCES_RELATIVE_PATH}/${spec.source}`, spec.source);
  const svgBytes = readRegularFile(svgPath, `${spec.source}: исходный SVG`, MAX_SVG_BYTES);
  const actualSvgSha256 = sha256(svgBytes);
  if (actualSvgSha256 !== spec.sha256) fail(`${spec.source}: SHA-256 исходного SVG не совпадает с allowlist`);
  const svg = validateApprovedSvg(svgBytes, spec.dimensions, spec.source);
  const layerRequests = PHONE_SEGMENT_ROLES.map((role) => {
    const sourceRect = cloneRect(spec.source_rects[role]);
    const viewportRect = cloneRect(PHONE_SEGMENT_VIEWPORT_RECTS[role]);
    assertRectInsideDimensions(sourceRect, spec.dimensions, `${spec.state_id}: ${role}: исходная область`);
    return { role, source_rect: sourceRect, viewport_rect: viewportRect };
  });
  const rasterizedLayers = await rasterizeSvgLayers(svg, spec.dimensions, layerRequests, spec.source);
  return rasterizedLayers.map((layer) => {
    const output = outputForLayer(spec.state_id, layer.role);
    const outputPath = `${BASES_RELATIVE_PATH}/${output}`;
    return {
      state_id: spec.state_id,
      source: spec.source,
      role: layer.role,
      output,
      path: outputPath,
      bytes: layer.bytes,
      hash: sha256(layer.bytes),
      sha256: sha256(layer.bytes),
      logicalDimensions: { ...spec.dimensions },
      source_rect: cloneRect(layer.source_rect),
      viewport_rect: cloneRect(layer.viewport_rect),
      dimensions: {
        width: layer.source_rect.width * SCALE,
        height: layer.source_rect.height * SCALE,
      },
      scale: SCALE,
    };
  });
}

function assertUniqueOutputSet(results) {
  const outputs = results.map((result) => result.output);
  if (outputs.length !== 18 || new Set(outputs).size !== 18) fail("кандидат должен содержать ровно 18 уникальных PNG-сегментов");
}

function publishPngSet(root, results) {
  assertUniqueOutputSet(results);
  const baseDirectory = resolvePackagePath(root, BASES_RELATIVE_PATH, "source/bases");
  fs.mkdirSync(baseDirectory, { recursive: true });
  const baseStat = fs.lstatSync(baseDirectory);
  if (!baseStat.isDirectory() || baseStat.isSymbolicLink()) fail("source/bases: целевой каталог небезопасен");

  const stagingDirectory = fs.mkdtempSync(path.join(baseDirectory, ".lisa-editable-source-raster-set-"));
  const backupDirectory = fs.mkdtempSync(path.join(baseDirectory, ".lisa-editable-source-raster-backup-"));
  const backupEntries = [];
  const stagedActiveNames = new Set();
  try {
    for (const result of results) {
      assertSafeOutputName(result.output);
      const staged = path.join(stagingDirectory, result.output);
      fs.writeFileSync(staged, result.bytes, { flag: "wx", mode: 0o644 });
      const stagedBytes = readRegularFile(staged, `${result.output}: временный PNG`, MAX_PNG_BYTES);
      if (!stagedBytes.equals(result.bytes)) fail(`${result.output}: временный PNG не совпадает с кандидатом`);
      const inspected = inspectSafePng(stagedBytes, `${result.output}: временный PNG`);
      if (inspected.width !== result.dimensions.width || inspected.height !== result.dimensions.height) {
        fail(`${result.output}: временный PNG имеет неверные размеры`);
      }
    }
    const stagedOutputs = fs.readdirSync(stagingDirectory).filter((name) => name.endsWith(".png")).sort();
    if (JSON.stringify(stagedOutputs) !== JSON.stringify(results.map((result) => result.output).sort())) {
      fail("временный набор PNG-сегментов не совпадает с кандидатом");
    }

    for (const result of results) {
      const target = path.join(baseDirectory, result.output);
      if (fs.existsSync(target)) {
        verifyExistingPng(target, result.dimensions, `${result.output}: существующий PNG`);
        backupEntries.push({ output: result.output, target, backup: path.join(backupDirectory, result.output) });
      }
    }
    for (const spec of APPROVED_EDITABLE_SOURCE_RASTERS) {
      assertSafeLegacyOutputName(spec.legacy_output);
      const legacyTarget = path.join(baseDirectory, spec.legacy_output);
      if (!fs.existsSync(legacyTarget)) continue;
      verifyExistingPng(legacyTarget, null, `${spec.legacy_output}: устаревший PNG`);
      backupEntries.push({ output: spec.legacy_output, target: legacyTarget, backup: path.join(backupDirectory, spec.legacy_output) });
    }

    try {
      for (const entry of backupEntries) {
        renameManagedPath(entry.target, entry.backup, { phase: "backup", output: entry.output });
      }
      for (const result of results) {
        renameManagedPath(path.join(stagingDirectory, result.output), path.join(baseDirectory, result.output), {
          phase: "activate",
          output: result.output,
        });
        stagedActiveNames.add(result.output);
      }
      for (const result of results) verifyPublished(root, result);
    } catch (error) {
      for (const output of stagedActiveNames) {
        fs.rmSync(path.join(baseDirectory, output), { force: true });
      }
      for (const entry of backupEntries) {
        if (fs.existsSync(entry.backup)) {
          if (fs.existsSync(entry.target)) fs.rmSync(entry.target, { force: true });
          renameManagedPath(entry.backup, entry.target, { phase: "rollback", output: entry.output });
        }
      }
      throw error;
    }
    fs.rmSync(backupDirectory, { recursive: true, force: true, maxRetries: 2 });
  } finally {
    fs.rmSync(stagingDirectory, { recursive: true, force: true, maxRetries: 2 });
    fs.rmSync(backupDirectory, { recursive: true, force: true, maxRetries: 2 });
  }
}

export async function buildApprovedEditableSourceRasters({ root = process.cwd(), write = false } = {}) {
  if (typeof write !== "boolean") fail("write должен быть логическим значением");
  const resolvedRoot = resolveRoot(root);
  const results = [];
  for (const spec of APPROVED_EDITABLE_SOURCE_RASTERS) {
    results.push(...await buildOne(resolvedRoot, spec));
  }
  assertUniqueOutputSet(results);
  if (write) publishPngSet(resolvedRoot, results);
  else for (const result of results) verifyPublished(resolvedRoot, result);
  return results;
}

function parseCliArguments(args) {
  if (args.length === 0) return { write: true };
  if (args.length === 1 && args[0] === "--check") return { write: false };
  fail("использование: node scripts/import-presentation-link-lisa-editable-sources.mjs [--check]");
}

function isEntrypoint() {
  if (!process.argv[1]) return false;
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(import.meta.filename);
  } catch {
    return false;
  }
}

export const __test = Object.freeze({
  inspectSafePng,
  validateApprovedSvg,
  outputForLayer,
  async withPublishRenameHook(hook, callback) {
    const previous = publishRenameHook;
    publishRenameHook = hook;
    try {
      return await callback();
    } finally {
      publishRenameHook = previous;
    }
  },
});

if (isEntrypoint()) {
  try {
    const result = await buildApprovedEditableSourceRasters(parseCliArguments(process.argv.slice(2)));
    const printable = result.map(({ bytes, ...item }) => ({ ...item, bytes: bytes.length }));
    process.stdout.write(`${JSON.stringify({ mode: process.argv.includes("--check") ? "check" : "write", rasters: printable }, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "импорт не выполнен"}\n`);
    process.exitCode = 1;
  }
}
