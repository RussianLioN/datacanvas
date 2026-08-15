import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { TextDecoder } from "node:util";
import { inflateRawSync } from "node:zlib";
import { webkit } from "playwright";

export const LISA_PACKAGE_RELATIVE_PATH =
  "docs/product/analysis/presentation-link-lisa-user-journey";
export const SOURCE_CATALOG_RELATIVE_PATH =
  `${LISA_PACKAGE_RELATIVE_PATH}/source/source-render-catalog.json`;
export const VISUAL_BASIS_RELATIVE_PATH =
  `${LISA_PACKAGE_RELATIVE_PATH}/source/visual-basis-contract.json`;

const SOURCE_ARCHIVE_SHA256 =
  "b755549c84e059b8d999fcc12e55f6c3903aafe549935b90f2f1b84bb7852026";
const TRANSIENT_FONT_SHA256 =
  "5dddcdc3eb075d065cfbc317b60db2b6e08e12d970c073b4b48a9a123f9e5136";
const PNG_SIGNATURE = Buffer.from("89504e470d0a1a0a", "hex");
const ZIP_LOCAL = 0x04034b50;
const ZIP_CENTRAL = 0x02014b50;
const ZIP_END = 0x06054b50;
const ZIP_DESCRIPTOR = 0x08074b50;
const ZIP_STORED = 0;
const ZIP_DEFLATE = 8;
const ZIP_ALLOWED_FLAGS = 0x0808;
const MAX_ARCHIVE_BYTES = 8 * 1024 * 1024;
const MAX_MEMBER_BYTES = 3 * 1024 * 1024;
const MAX_TOTAL_MEMBER_BYTES = 24 * 1024 * 1024;
const MAX_FONT_BYTES = 8 * 1024 * 1024;
const MAX_PNG_BYTES = 32 * 1024 * 1024;
const SNAPSHOT_TIMEOUT_MS = 20_000;
const utf8Decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

const PATCH_DEFINITIONS = new Map([
  [
    "lisa-client-answer",
    {
      slot_id: "visible-patch-suggestion",
      path: "source/patches/lisa-client-answer-suggestion.png",
      text: "Показать справку для подготовки к встрече",
      style: "suggestion",
    },
  ],
  [
    "lisa-presentation-order",
    {
      slot_id: "visible-patch-action",
      path: "source/patches/lisa-presentation-order-action.png",
      text: "Создать презентацию и отправить на почту",
      style: "action",
    },
  ],
  [
    "lisa-presentation-generating",
    {
      slot_id: "visible-patch-generating",
      path: "source/patches/lisa-presentation-generating-status.png",
      text: "Презентация придет на почту через 20 минут",
      style: "status",
    },
  ],
  [
    "lisa-presentation-sent",
    {
      slot_id: "visible-patch-sent",
      path: "source/patches/lisa-presentation-sent-status.png",
      text: "Презентация подготовлена. Проверьте почту.",
      style: "status",
    },
  ],
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

function assertSafeZipName(name) {
  if (
    typeof name !== "string" ||
    name.length === 0 ||
    name.length > 256 ||
    name.startsWith("/") ||
    name.includes("\\") ||
    name.includes("/") ||
    name === "." ||
    name === ".." ||
    /[\u0000-\u001f\u007f]/u.test(name) ||
    !name.toLowerCase().endsWith(".svg")
  ) {
    fail("архив содержит небезопасное имя SVG-члена");
  }
}

function findZipEnd(buffer) {
  const minimum = Math.max(0, buffer.length - 65_557);
  for (let offset = buffer.length - 22; offset >= minimum; offset -= 1) {
    if (buffer.readUInt32LE(offset) !== ZIP_END) continue;
    const commentLength = buffer.readUInt16LE(offset + 20);
    if (offset + 22 + commentLength === buffer.length && commentLength === 0) return offset;
  }
  fail("архив не содержит канонический центральный каталог");
}

function readZipEntries(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > MAX_ARCHIVE_BYTES) {
    fail("размер входного архива выходит за безопасный предел");
  }
  const endOffset = findZipEnd(buffer);
  const diskNumber = buffer.readUInt16LE(endOffset + 4);
  const centralDiskNumber = buffer.readUInt16LE(endOffset + 6);
  const diskEntries = buffer.readUInt16LE(endOffset + 8);
  const entriesCount = buffer.readUInt16LE(endOffset + 10);
  const centralSize = buffer.readUInt32LE(endOffset + 12);
  const centralOffset = buffer.readUInt32LE(endOffset + 16);
  if (
    diskNumber !== 0 ||
    centralDiskNumber !== 0 ||
    diskEntries !== entriesCount ||
    entriesCount !== 25 ||
    centralOffset + centralSize !== endOffset
  ) {
    fail("архив имеет неподдерживаемую структуру");
  }

  const entries = new Map();
  let offset = centralOffset;
  let totalUncompressed = 0;
  for (let index = 0; index < entriesCount; index += 1) {
    assertRange(buffer, offset, 46, "центральный каталог архива повреждён");
    if (buffer.readUInt32LE(offset) !== ZIP_CENTRAL) fail("центральный каталог архива повреждён");
    const versionNeeded = buffer.readUInt16LE(offset + 6);
    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const checksum = buffer.readUInt32LE(offset + 16);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const diskStart = buffer.readUInt16LE(offset + 34);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const nameOffset = offset + 46;
    assertRange(buffer, nameOffset, nameLength + extraLength + commentLength, "имя члена архива повреждено");
    if (
      versionNeeded > 45 ||
      (flags & ~ZIP_ALLOWED_FLAGS) !== 0 ||
      (flags & 0x0001) !== 0 ||
      ![ZIP_STORED, ZIP_DEFLATE].includes(method) ||
      extraLength > 4096 ||
      commentLength !== 0 ||
      diskStart !== 0 ||
      compressedSize > MAX_ARCHIVE_BYTES ||
      uncompressedSize > MAX_MEMBER_BYTES
    ) {
      fail("архив содержит неподдерживаемую или небезопасную запись");
    }
    const nameBytes = buffer.subarray(nameOffset, nameOffset + nameLength);
    const name = decodeUtf8(nameBytes, "имя члена архива должно быть UTF-8");
    assertSafeZipName(name);
    if (entries.has(name)) fail("архив содержит повторяющийся SVG-член");
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > MAX_TOTAL_MEMBER_BYTES) fail("архив превышает общий безопасный предел");
    entries.set(name, { name, nameBytes, flags, method, checksum, compressedSize, uncompressedSize, localOffset });
    offset = nameOffset + nameLength + extraLength + commentLength;
  }
  if (offset !== endOffset) fail("центральный каталог содержит лишние данные");
  return entries;
}

function extractZipMember(archiveBytes, entry) {
  assertRange(archiveBytes, entry.localOffset, 30, "локальная запись архива повреждена");
  if (archiveBytes.readUInt32LE(entry.localOffset) !== ZIP_LOCAL) fail("локальная запись архива отсутствует");
  const flags = archiveBytes.readUInt16LE(entry.localOffset + 6);
  const method = archiveBytes.readUInt16LE(entry.localOffset + 8);
  const localChecksum = archiveBytes.readUInt32LE(entry.localOffset + 14);
  const localCompressedSize = archiveBytes.readUInt32LE(entry.localOffset + 18);
  const localUncompressedSize = archiveBytes.readUInt32LE(entry.localOffset + 22);
  const nameLength = archiveBytes.readUInt16LE(entry.localOffset + 26);
  const extraLength = archiveBytes.readUInt16LE(entry.localOffset + 28);
  const nameOffset = entry.localOffset + 30;
  const dataOffset = nameOffset + nameLength + extraLength;
  if (flags !== entry.flags || method !== entry.method || nameLength !== entry.nameBytes.length || extraLength > 4096) {
    fail("локальная запись не совпадает с центральным каталогом");
  }
  assertRange(archiveBytes, nameOffset, nameLength + extraLength, "локальное имя архива повреждено");
  if (!archiveBytes.subarray(nameOffset, nameOffset + nameLength).equals(entry.nameBytes)) {
    fail("локальное имя не совпадает с центральным каталогом");
  }
  assertRange(archiveBytes, dataOffset, entry.compressedSize, "данные SVG выходят за границы архива");
  if ((flags & 0x0008) === 0 && (localChecksum !== entry.checksum || localCompressedSize !== entry.compressedSize || localUncompressedSize !== entry.uncompressedSize)) {
    fail("локальная запись содержит неверные размеры");
  }
  const compressed = archiveBytes.subarray(dataOffset, dataOffset + entry.compressedSize);
  let result;
  try {
    result = entry.method === ZIP_STORED ? Buffer.from(compressed) : inflateRawSync(compressed, { maxOutputLength: MAX_MEMBER_BYTES });
  } catch {
    fail("не удалось безопасно распаковать SVG-член");
  }
  if (result.length !== entry.uncompressedSize || crc32(result) !== entry.checksum) {
    fail("контрольная сумма SVG-члена не совпадает");
  }
  return result;
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

function readJson(root, relativePath, label) {
  const content = readRegularFile(resolvePackagePath(root, relativePath, label), label, 2 * 1024 * 1024);
  try {
    return JSON.parse(content.toString("utf8"));
  } catch {
    fail(`${label} содержит некорректный JSON`);
  }
}

function assertPngTargetPath(value, prefix, label) {
  if (
    typeof value !== "string" ||
    !value.startsWith(prefix) ||
    !/^source\/(?:bases|patches)\/lisa-[a-z0-9-]+\.png$/u.test(value)
  ) {
    fail(`${label} должен быть относительным PNG в ${prefix}`);
  }
}

function matchForeignObjects(svg) {
  const allOpen = [...svg.matchAll(/<foreignObject\b[^>]*>/giu)];
  const exact = [...svg.matchAll(/<foreignObject\b([^>]*)>\s*<div\b([^>]*)\/\s*>\s*<\/foreignObject>/giu)];
  if (allOpen.length !== exact.length) fail("foreignObject допускается только как пустой XHTML div-снимок");
  for (const [, foreignAttributes, divAttributes] of exact) {
    const foreignNames = [...foreignAttributes.matchAll(/\s([A-Za-z][\w:-]*)\s*=/gu)].map((match) => match[1]);
    if (foreignNames.some((name) => !["width", "height", "x", "y"].includes(name))) {
      fail("foreignObject содержит неразрешённый атрибут");
    }
    const divNames = [...divAttributes.matchAll(/\s([A-Za-z][\w:-]*)\s*=/gu)].map((match) => match[1]);
    if (divNames.some((name) => !["xmlns", "style"].includes(name))) {
      fail("XHTML div в foreignObject содержит неразрешённый атрибут");
    }
    const xmlns = divAttributes.match(/\bxmlns\s*=\s*(["'])\s*([^"']+)\s*\1/iu)?.[2];
    if (xmlns !== "http://www.w3.org/1999/xhtml") fail("foreignObject не содержит ожидаемое XHTML пространство имён");
    const style = divAttributes.match(/\bstyle\s*=\s*(["'])([\s\S]*?)\1/iu)?.[2];
    if (!style || /(?:https?:|file:|data:|javascript:|@import|expression\s*\()/iu.test(style)) {
      fail("foreignObject содержит внешний или исполнимый стиль");
    }
    for (const reference of style.matchAll(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/giu)) {
      if (!/^#[A-Za-z][\w.-]*$/u.test(reference[2])) fail("foreignObject содержит внешний URL");
    }
  }
  return svg.replace(
    /<foreignObject\b([^>]*)>\s*<div\b([^>]*)\/\s*>\s*<\/foreignObject>/giu,
    "<foreignObject$1><div$2></div></foreignObject>",
  );
}

function validateSnapshotSvg(bytes, dimensions, label) {
  const svg = decodeUtf8(bytes, `${label}: SVG не является точным UTF-8`);
  if (svg.length === 0 || bytes.length > MAX_MEMBER_BYTES || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(svg)) {
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
    fail(`${label}: SVG не совпадает с зафиксированными натуральными размерами`);
  }
  return matchForeignObjects(svg);
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

export function inspectSafePng(png, label = "PNG", { allowCanonicalizationMetadata = false } = {}) {
  if (!Buffer.isBuffer(png) || png.length < 45 || png.length > MAX_PNG_BYTES || !png.subarray(0, 8).equals(PNG_SIGNATURE)) {
    fail(`${label} не является безопасным PNG`);
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  const idat = [];
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
      if (width < 1 || height < 1 || data[8] !== 8 || data[9] !== 6 || data[10] !== 0 || data[11] !== 0 || data[12] !== 0) {
        fail(`${label} имеет неподдерживаемый формат`);
      }
      seenIhdr = true;
    } else if (type === "IDAT" && !seenIend) {
      idat.push(Buffer.from(data));
    } else if (type === "IEND" && !seenIend && length === 0 && idat.length > 0) {
      seenIend = true;
    } else if (allowCanonicalizationMetadata && ["sRGB", "gAMA", "pHYs", "bKGD", "eXIf"].includes(type) && !seenIend) {
      // Принимаем только стандартные служебные блоки снимка и отбрасываем их при канонизации.
    } else {
      fail(`${label} содержит неразрешённый PNG-член ${type}`);
    }
    offset = crcOffset + 4;
  }
  if (!seenIend || offset !== png.length) fail(`${label} не завершён`);
  return { width, height, idat };
}

function sanitizePng(png, dimensions, label) {
  const inspected = inspectSafePng(png, label, { allowCanonicalizationMetadata: true });
  if (inspected.width !== dimensions.width || inspected.height !== dimensions.height) {
    fail(`${label} имеет неверные размеры`);
  }
  const ihdr = png.subarray(8, 8 + 25);
  const result = Buffer.concat([PNG_SIGNATURE, ihdr, createPngChunk("IDAT", Buffer.concat(inspected.idat)), createPngChunk("IEND", Buffer.alloc(0))]);
  inspectSafePng(result, label);
  return result;
}

function htmlDocument(body, csp) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"></head><body style="margin:0;overflow:hidden">${body}</body></html>`;
}

async function captureElement({ width, height, html, transparent, label }) {
  const browser = await webkit.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
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
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: SNAPSHOT_TIMEOUT_MS });
    const box = await page.locator("#snapshot").boundingBox();
    if (!box || Math.round(box.width) !== width || Math.round(box.height) !== height) {
      fail(`${label}: снимок не сохранил натуральный размер`);
    }
    const output = await page.locator("#snapshot").screenshot({ type: "png", omitBackground: transparent, timeout: SNAPSHOT_TIMEOUT_MS });
    await context.close();
    if (routedRequest) fail(`${label}: снимочный процесс попытался обратиться к сети`);
    return sanitizePng(output, { width, height }, label);
  } finally {
    await browser.close();
  }
}

async function captureBase(svg, dimensions, label) {
  const body = `<div id="snapshot" style="width:${dimensions.width}px;height:${dimensions.height}px;overflow:hidden">${svg}</div>`;
  return captureElement({
    width: dimensions.width,
    height: dimensions.height,
    html: htmlDocument(body, "default-src 'none'; img-src 'none'; style-src 'unsafe-inline'"),
    transparent: false,
    label,
  });
}

function patchCss(style) {
  if (style === "action") {
    return "background:#1b1b23;border-radius:24px;color:#ffffff;font-size:22px;font-weight:600;justify-content:center;line-height:28px;padding:18px 24px;text-align:center";
  }
  if (style === "suggestion") {
    return "background:rgba(255,255,255,.98);border-radius:22px;box-shadow:0 4px 18px rgba(27,27,35,.12);color:#1b1b23;font-size:20px;font-weight:400;justify-content:flex-start;line-height:26px;padding:16px 20px;text-align:left";
  }
  return "background:rgba(255,255,255,.98);border-radius:20px;box-shadow:0 3px 14px rgba(27,27,35,.10);color:#1b1b23;font-size:20px;font-weight:400;justify-content:flex-start;line-height:26px;padding:16px 20px;text-align:left";
}

async function capturePatch({ definition, rect, fontBytes, label }) {
  const fontData = fontBytes.toString("base64");
  const body = `<style>@font-face{font-family:TransientSBSansDisplay;src:url(data:font/otf;base64,${fontData}) format('opentype');font-display:block}#snapshot{align-items:center;box-sizing:border-box;display:flex;font-family:TransientSBSansDisplay,'Arial',sans-serif;overflow:hidden;${patchCss(definition.style)}}#snapshot span{display:block;max-width:100%;overflow-wrap:anywhere}</style><div id="snapshot" style="width:${rect.width}px;height:${rect.height}px"><span>${definition.text}</span></div>`;
  return captureElement({
    width: rect.width,
    height: rect.height,
    html: htmlDocument(body, "default-src 'none'; img-src 'none'; font-src data:; style-src 'unsafe-inline'"),
    transparent: true,
    label,
  });
}

function ensureTarget(root, relativePath, label) {
  const target = resolvePackagePath(root, `${LISA_PACKAGE_RELATIVE_PATH}/${relativePath}`, label);
  const directory = path.dirname(target);
  fs.mkdirSync(directory, { recursive: true });
  const directoryStat = fs.lstatSync(directory);
  if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) fail(`${label}: целевой каталог небезопасен`);
  if (fs.existsSync(target)) {
    const stat = fs.lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label}: существующий PNG небезопасен`);
  }
  return { target, directory };
}

function publishPng(root, relativePath, bytes, label) {
  const { target, directory } = ensureTarget(root, relativePath, label);
  const stagingDirectory = fs.mkdtempSync(path.join(directory, ".lisa-source-raster-"));
  const staged = path.join(stagingDirectory, "asset.png");
  try {
    fs.writeFileSync(staged, bytes, { flag: "wx", mode: 0o644 });
    const stat = fs.lstatSync(staged);
    if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label}: временный PNG небезопасен`);
    fs.renameSync(staged, target);
  } finally {
    fs.rmSync(stagingDirectory, { recursive: true, force: true, maxRetries: 2 });
  }
}

function assertBindingShape(binding, catalog) {
  if (!binding || typeof binding !== "object") fail("visual basis содержит повреждённую привязку состояния");
  if (typeof binding.state_id !== "string" || !/^lisa-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(binding.state_id)) {
    fail("visual basis содержит недопустимый state_id");
  }
  assertPngTargetPath(binding.base_path, "source/bases/", `${binding.state_id}: base_path`);
  const source = catalog.get(binding.base_id);
  if (!source || !["active-basis", "active-variant", "optional-branch"].includes(source.classification)) {
    fail(`${binding.state_id}: base_id не является разрешённой активной основой`);
  }
  if (
    !binding.natural_dimensions ||
    binding.natural_dimensions.width !== source.natural_dimensions.width ||
    binding.natural_dimensions.height !== source.natural_dimensions.height
  ) {
    fail(`${binding.state_id}: натуральные размеры расходятся с source catalog`);
  }
  if (!Array.isArray(binding.slots) || !Array.isArray(binding.protected_regions)) {
    fail(`${binding.state_id}: slots или protected regions отсутствуют`);
  }
  return source;
}

function slotForPatch(binding, definition) {
  const slot = binding.slots.find((candidate) => candidate?.id === definition.slot_id);
  if (!slot || !slot.rect || !Number.isInteger(slot.rect.width) || !Number.isInteger(slot.rect.height)) {
    fail(`${binding.state_id}: отсутствует утверждённый слот локальной заплаты`);
  }
  return slot;
}

function createExpectedAssets({ root, archivePath, fontPath, check }) {
  const archive = readRegularFile(archivePath, "входной архив", MAX_ARCHIVE_BYTES);
  if (sha256(archive) !== SOURCE_ARCHIVE_SHA256) fail("SHA-256 входного архива не совпадает с договором");
  const catalogValue = readJson(root, SOURCE_CATALOG_RELATIVE_PATH, "source render catalog");
  if (catalogValue?.archive?.sha256 !== SOURCE_ARCHIVE_SHA256 || !Array.isArray(catalogValue.members) || catalogValue.members.length !== 25) {
    fail("source render catalog не подтверждает полный утверждённый архив");
  }
  const catalog = new Map();
  const memberNames = new Set();
  for (const member of catalogValue.members) {
    if (!member || typeof member.id !== "string" || typeof member.member_name !== "string" || typeof member.sha256 !== "string") {
      fail("source render catalog содержит повреждённый член");
    }
    if (catalog.has(member.id) || memberNames.has(member.member_name)) fail("source render catalog содержит повтор");
    catalog.set(member.id, member);
    memberNames.add(member.member_name);
  }
  const zipEntries = readZipEntries(archive);
  if (zipEntries.size !== memberNames.size || [...memberNames].some((name) => !zipEntries.has(name))) {
    fail("архив не совпадает с allowlist source render catalog");
  }
  const basis = readJson(root, VISUAL_BASIS_RELATIVE_PATH, "visual basis contract");
  if (basis?.rendering_pipeline !== "raster-base-local-overlay" || !Array.isArray(basis.state_bindings) || basis.state_bindings.length === 0) {
    fail("visual basis contract не задаёт raster-base-local-overlay");
  }
  const stateIds = new Set();
  const bindings = [];
  for (const binding of basis.state_bindings) {
    if (stateIds.has(binding?.state_id)) fail("visual basis содержит повтор состояния");
    stateIds.add(binding.state_id);
    bindings.push({ binding, source: assertBindingShape(binding, catalog) });
  }
  const fontBytes = readRegularFile(fontPath, "шрифт для локальных растровых вставок", MAX_FONT_BYTES);
  if (sha256(fontBytes) !== TRANSIENT_FONT_SHA256) fail("SHA-256 временного шрифта не совпадает с договором");
  if (check && basis.asset_generation_state !== "ready") {
    fail("проверка import profile требует готовый набор растровых основ");
  }
  return { archive, catalog, zipEntries, basis, bindings, fontBytes };
}

async function buildAssets(input) {
  const assets = [];
  for (const { binding, source } of input.bindings) {
    const entry = input.zipEntries.get(source.member_name);
    const svgBytes = extractZipMember(input.archive, entry);
    if (sha256(svgBytes) !== source.sha256) fail(`${binding.state_id}: SHA исходного SVG не совпадает с catalog`);
    const svg = validateSnapshotSvg(svgBytes, source.natural_dimensions, binding.state_id);
    const png = await captureBase(svg, source.natural_dimensions, `${binding.state_id}: растровая основа`);
    assets.push({ kind: "base", state_id: binding.state_id, path: binding.base_path, bytes: png, sha256: sha256(png), dimensions: source.natural_dimensions });
    const patchDefinition = PATCH_DEFINITIONS.get(binding.state_id);
    if (patchDefinition) {
      const slot = slotForPatch(binding, patchDefinition);
      assertPngTargetPath(patchDefinition.path, "source/patches/", `${binding.state_id}: patch`);
      const patch = await capturePatch({ definition: patchDefinition, rect: slot.rect, fontBytes: input.fontBytes, label: `${binding.state_id}: локальная заплата` });
      assets.push({ kind: "patch", state_id: binding.state_id, slot_id: patchDefinition.slot_id, path: patchDefinition.path, bytes: patch, sha256: sha256(patch), dimensions: { width: slot.rect.width, height: slot.rect.height } });
    }
  }
  if (assets.filter((asset) => asset.kind === "base").length !== input.bindings.length || assets.filter((asset) => asset.kind === "patch").length !== PATCH_DEFINITIONS.size) {
    fail("снимочный импортёр создал неполный набор PNG");
  }
  return assets;
}

function verifyReadyContract(root, basis, assets) {
  const bases = new Map(assets.filter((asset) => asset.kind === "base").map((asset) => [asset.state_id, asset]));
  const patches = new Map(assets.filter((asset) => asset.kind === "patch").map((asset) => [asset.state_id, asset]));
  for (const binding of basis.state_bindings) {
    const base = bases.get(binding.state_id);
    if (!base || binding.base_sha256 !== base.sha256) fail(`${binding.state_id}: SHA базы не совпадает с пересозданным снимком`);
    const actualBase = readRegularFile(resolvePackagePath(root, `${LISA_PACKAGE_RELATIVE_PATH}/${binding.base_path}`, "PNG-основа"), "PNG-основа", MAX_PNG_BYTES);
    if (sha256(actualBase) !== base.sha256) fail(`${binding.state_id}: опубликованная PNG-основа не совпадает со снимком`);
    inspectSafePng(actualBase, `${binding.state_id}: опубликованная PNG-основа`);
    const definition = PATCH_DEFINITIONS.get(binding.state_id);
    if (!definition) continue;
    const patch = patches.get(binding.state_id);
    const slot = slotForPatch(binding, definition);
    if (!patch || slot.visible_patch_path !== patch.path || slot.visible_patch_sha256 !== patch.sha256) {
      fail(`${binding.state_id}: договор локальной заплаты не совпадает с пересозданным снимком`);
    }
    const actualPatch = readRegularFile(resolvePackagePath(root, `${LISA_PACKAGE_RELATIVE_PATH}/${patch.path}`, "локальная PNG-заплата"), "локальная PNG-заплата", MAX_PNG_BYTES);
    if (sha256(actualPatch) !== patch.sha256) fail(`${binding.state_id}: опубликованная локальная PNG-заплата не совпадает со снимком`);
    inspectSafePng(actualPatch, `${binding.state_id}: опубликованная локальная PNG-заплата`);
  }
}

/**
 * Однонаправленно превращает allowlist SVG архива в PNG-основы и PNG-заплаты.
 * Исходные SVG, ZIP и шрифт существуют только во входных буферах процесса.
 */
export async function importLisaSourceBases({ root = process.cwd(), archivePath, fontPath, check = false } = {}) {
  if (typeof archivePath !== "string" || archivePath.length === 0) fail("не указан --archive");
  if (typeof fontPath !== "string" || fontPath.length === 0) fail("не указан --font");
  if (typeof check !== "boolean") fail("check должен быть логическим значением");
  const resolvedRoot = resolveRoot(root);
  const input = createExpectedAssets({ root: resolvedRoot, archivePath, fontPath, check });
  const assets = await buildAssets(input);
  if (check) {
    verifyReadyContract(resolvedRoot, input.basis, assets);
  } else {
    for (const asset of assets) publishPng(resolvedRoot, asset.path, asset.bytes, `${asset.state_id}: ${asset.kind}`);
  }
  return {
    mode: check ? "check" : "import",
    archive_sha256: SOURCE_ARCHIVE_SHA256,
    font: { family: "SB Sans Display", sha256: TRANSIENT_FONT_SHA256, copied_to_package: false },
    bases: assets.filter((asset) => asset.kind === "base").map(({ bytes, ...asset }) => asset),
    patches: assets.filter((asset) => asset.kind === "patch").map(({ bytes, ...asset }) => asset),
  };
}

function parseCliArguments(args) {
  let archivePath;
  let fontPath;
  let check = false;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--archive") {
      archivePath = args[++index];
    } else if (value === "--font") {
      fontPath = args[++index];
    } else if (value === "--check") {
      check = true;
    } else {
      fail("использование: node scripts/import-presentation-link-lisa-source-bases.mjs --archive <ZIP> --font <OTF> [--check]");
    }
  }
  if (!archivePath || !fontPath) fail("использование: node scripts/import-presentation-link-lisa-source-bases.mjs --archive <ZIP> --font <OTF> [--check]");
  return { archivePath, fontPath, check };
}

function isEntrypoint() {
  if (!process.argv[1]) return false;
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(import.meta.filename);
  } catch {
    return false;
  }
}

if (isEntrypoint()) {
  try {
    const result = await importLisaSourceBases(parseCliArguments(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "импорт не выполнен"}\n`);
    process.exitCode = 1;
  }
}
