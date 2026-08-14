import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { TextDecoder } from "node:util";
import { inflateRawSync } from "node:zlib";

export const DEFAULT_OUTPUT_RELATIVE_PATH =
  "docs/product/analysis/presentation-link-lisa-user-journey/source/components/lisa-external-visual-reference.png";
export const VISUAL_DONOR_USAGE = "reference-only";

const ZIP_LOCAL = 0x04034b50;
const ZIP_CENTRAL = 0x02014b50;
const ZIP_END = 0x06054b50;
const ZIP_DESCRIPTOR = 0x08074b50;
const ZIP_SUPPORTED_FLAGS = 0x0808;
const ZIP_STORED_METHOD = 0;
const ZIP_DEFLATE_METHOD = 8;
const PNG_SIGNATURE = Buffer.from("89504e470d0a1a0a", "hex");
const MAX_ARCHIVE_BYTES = 8 * 1024 * 1024;
const MAX_ARCHIVE_MEMBERS = 64;
const MAX_ARCHIVE_UNCOMPRESSED_BYTES = 24 * 1024 * 1024;
const MAX_SVG_BYTES = 3 * 1024 * 1024;
const MAX_PNG_BYTES = 4 * 1024 * 1024;
const RASTER_WIDTH = 390;
const RASTER_HEIGHT = 844;
const RASTER_TIMEOUT_MS = 15_000;
const strictUtf8Decoder = new TextDecoder("utf-8", {
  fatal: true,
  ignoreBOM: true,
});

const allowedSvgElements = new Set([
  "svg",
  "defs",
  "g",
  "clipPath",
  "linearGradient",
  "radialGradient",
  "stop",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "path",
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

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function requireRange(bytes, offset, length, message) {
  if (
    !Number.isInteger(offset) ||
    !Number.isInteger(length) ||
    offset < 0 ||
    length < 0 ||
    offset + length > bytes.length
  ) {
    fail(message);
  }
}

function decodeUtf8(bytes, message) {
  try {
    const value = strictUtf8Decoder.decode(bytes);
    if (!Buffer.from(value, "utf8").equals(bytes)) fail(message);
    return value;
  } catch {
    fail(message);
  }
}

function assertSafeArchivePath(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.startsWith("/") ||
    value.includes("\\") ||
    /[:\u0000-\u001f\u007f]/u.test(value) ||
    path.posix.normalize(value) !== value ||
    value === ".." ||
    value.startsWith("../") ||
    value.endsWith("/")
  ) {
    fail("ZIP содержит небезопасное имя члена");
  }
}

function assertRequestedMemberName(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 256 ||
    value.includes("/") ||
    value.includes("\\") ||
    value === "." ||
    value === ".." ||
    /[\u0000-\u001f\u007f]/u.test(value) ||
    !value.toLowerCase().endsWith(".svg")
  ) {
    fail("некорректное имя члена ZIP: ожидается одиночный SVG-файл");
  }
}

function findEndOfCentralDirectory(bytes) {
  const minimumOffset = Math.max(0, bytes.length - 65_557);
  for (let offset = bytes.length - 22; offset >= minimumOffset; offset -= 1) {
    if (bytes.readUInt32LE(offset) !== ZIP_END) continue;
    const commentLength = bytes.readUInt16LE(offset + 20);
    if (offset + 22 + commentLength === bytes.length && commentLength === 0) return offset;
  }
  fail("ZIP не содержит канонический центральный каталог");
}

function validateLocalRecord(bytes, entry, centralOffset) {
  const { localOffset, flags, method, nameBytes, compressedSize, uncompressedSize, checksum } = entry;
  requireRange(bytes, localOffset, 30, "локальная запись ZIP повреждена");
  if (bytes.readUInt32LE(localOffset) !== ZIP_LOCAL) fail("локальная запись ZIP отсутствует");
  const localFlags = bytes.readUInt16LE(localOffset + 6);
  const localMethod = bytes.readUInt16LE(localOffset + 8);
  const localChecksum = bytes.readUInt32LE(localOffset + 14);
  const localCompressedSize = bytes.readUInt32LE(localOffset + 18);
  const localUncompressedSize = bytes.readUInt32LE(localOffset + 22);
  const localNameLength = bytes.readUInt16LE(localOffset + 26);
  const localExtraLength = bytes.readUInt16LE(localOffset + 28);
  const nameOffset = localOffset + 30;
  const dataOffset = nameOffset + localNameLength + localExtraLength;

  if (
    localFlags !== flags ||
    localMethod !== method ||
    localNameLength !== nameBytes.length ||
    localExtraLength > 4096
  ) {
    fail("локальная запись ZIP не совпадает с центральным каталогом");
  }
  requireRange(bytes, nameOffset, localNameLength + localExtraLength, "имя локальной записи ZIP повреждено");
  if (!bytes.subarray(nameOffset, nameOffset + localNameLength).equals(nameBytes)) {
    fail("имя локальной записи ZIP не совпадает с центральным каталогом");
  }
  requireRange(bytes, dataOffset, compressedSize, "данные члена ZIP выходят за границы архива");
  if (dataOffset + compressedSize > centralOffset) {
    fail("данные члена ZIP пересекаются с центральным каталогом");
  }

  if ((flags & 0x0008) === 0) {
    if (
      localChecksum !== checksum ||
      localCompressedSize !== compressedSize ||
      localUncompressedSize !== uncompressedSize
    ) {
      fail("локальная запись ZIP содержит неверные размеры");
    }
  } else {
    const descriptorOffset = dataOffset + compressedSize;
    requireRange(bytes, descriptorOffset, 12, "дескриптор данных ZIP повреждён");
    const hasSignature = bytes.readUInt32LE(descriptorOffset) === ZIP_DESCRIPTOR;
    const valueOffset = descriptorOffset + (hasSignature ? 4 : 0);
    requireRange(bytes, valueOffset, 12, "дескриптор данных ZIP повреждён");
    if (
      bytes.readUInt32LE(valueOffset) !== checksum ||
      bytes.readUInt32LE(valueOffset + 4) !== compressedSize ||
      bytes.readUInt32LE(valueOffset + 8) !== uncompressedSize
    ) {
      fail("дескриптор данных ZIP не совпадает с центральным каталогом");
    }
  }

  return bytes.subarray(dataOffset, dataOffset + compressedSize);
}

function parseZip(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > MAX_ARCHIVE_BYTES) {
    fail("размер ZIP выходит за безопасный предел");
  }
  const endOffset = findEndOfCentralDirectory(bytes);
  const diskNumber = bytes.readUInt16LE(endOffset + 4);
  const centralDiskNumber = bytes.readUInt16LE(endOffset + 6);
  const diskEntryCount = bytes.readUInt16LE(endOffset + 8);
  const entryCount = bytes.readUInt16LE(endOffset + 10);
  const centralSize = bytes.readUInt32LE(endOffset + 12);
  const centralOffset = bytes.readUInt32LE(endOffset + 16);
  if (
    diskNumber !== 0 ||
    centralDiskNumber !== 0 ||
    diskEntryCount !== entryCount ||
    entryCount === 0 ||
    entryCount > MAX_ARCHIVE_MEMBERS ||
    centralOffset + centralSize !== endOffset
  ) {
    fail("ZIP имеет неподдерживаемую структуру");
  }

  const entries = [];
  const names = new Set();
  const localOffsets = new Set();
  let offset = centralOffset;
  let totalUncompressedBytes = 0;
  for (let index = 0; index < entryCount; index += 1) {
    requireRange(bytes, offset, 46, "центральный каталог ZIP повреждён");
    if (bytes.readUInt32LE(offset) !== ZIP_CENTRAL) fail("центральный каталог ZIP повреждён");
    const versionNeeded = bytes.readUInt16LE(offset + 6);
    const flags = bytes.readUInt16LE(offset + 8);
    const method = bytes.readUInt16LE(offset + 10);
    const checksum = bytes.readUInt32LE(offset + 16);
    const compressedSize = bytes.readUInt32LE(offset + 20);
    const uncompressedSize = bytes.readUInt32LE(offset + 24);
    const nameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const diskStart = bytes.readUInt16LE(offset + 34);
    const localOffset = bytes.readUInt32LE(offset + 42);
    const nameOffset = offset + 46;
    requireRange(bytes, nameOffset, nameLength + extraLength + commentLength, "имя члена ZIP повреждено");
    if (
      versionNeeded > 45 ||
      (flags & ~ZIP_SUPPORTED_FLAGS) !== 0 ||
      (flags & 0x0001) !== 0 ||
      ![ZIP_STORED_METHOD, ZIP_DEFLATE_METHOD].includes(method) ||
      extraLength > 4096 ||
      commentLength > 0 ||
      diskStart !== 0 ||
      compressedSize > MAX_ARCHIVE_BYTES ||
      uncompressedSize > MAX_SVG_BYTES
    ) {
      fail("ZIP использует неподдерживаемую или небезопасную запись");
    }
    const nameBytes = bytes.subarray(nameOffset, nameOffset + nameLength);
    const name = decodeUtf8(nameBytes, "ZIP содержит имя не в UTF-8");
    assertSafeArchivePath(name);
    if (names.has(name) || localOffsets.has(localOffset)) fail("ZIP содержит дублирующийся член");
    names.add(name);
    localOffsets.add(localOffset);
    totalUncompressedBytes += uncompressedSize;
    if (totalUncompressedBytes > MAX_ARCHIVE_UNCOMPRESSED_BYTES) {
      fail("суммарный размер ZIP выходит за безопасный предел");
    }
    entries.push({
      name,
      nameBytes,
      flags,
      method,
      checksum,
      compressedSize,
      uncompressedSize,
      localOffset,
    });
    offset = nameOffset + nameLength + extraLength + commentLength;
  }
  if (offset !== endOffset) fail("центральный каталог ZIP содержит лишние данные");
  return { entries, centralOffset };
}

function extractSvg(bytes, memberName) {
  assertRequestedMemberName(memberName);
  const archive = parseZip(bytes);
  const entry = archive.entries.find((candidate) => candidate.name === memberName);
  if (!entry) fail("запрошенный SVG отсутствует в ZIP");
  const compressed = validateLocalRecord(bytes, entry, archive.centralOffset);
  let svgBytes;
  try {
    svgBytes = entry.method === ZIP_STORED_METHOD
      ? Buffer.from(compressed)
      : inflateRawSync(compressed, { maxOutputLength: MAX_SVG_BYTES });
  } catch {
    fail("не удалось безопасно распаковать SVG из ZIP");
  }
  if (svgBytes.length !== entry.uncompressedSize || crc32(svgBytes) !== entry.checksum) {
    fail("целостность SVG в ZIP не подтверждена");
  }
  return svgBytes;
}

function readSvgTagEnd(svg, start) {
  let quote = null;
  for (let index = start; index < svg.length; index += 1) {
    const character = svg[index];
    if (quote) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === ">") return index;
  }
  fail("SVG содержит незавершённый тег");
}

function validateNamespaces(tag) {
  for (const match of tag.matchAll(/\s+xmlns(?::([A-Za-z][\w.-]*))?\s*=\s*("[^"]*"|'[^']*')/gu)) {
    const namespaceName = match[1] ?? "";
    const namespaceValue = match[2].slice(1, -1);
    const allowed =
      (namespaceName === "" && namespaceValue === "http://www.w3.org/2000/svg") ||
      (namespaceName === "xlink" && namespaceValue === "http://www.w3.org/1999/xlink");
    if (!allowed) fail("SVG содержит неподдерживаемое пространство имён");
  }
  return tag.replace(/\s+xmlns(?::[A-Za-z][\w.-]*)?\s*=\s*("[^"]*"|'[^']*')/gu, " ");
}

function validateSvgTag(tag) {
  const withoutNamespaces = validateNamespaces(tag);
  const lower = withoutNamespaces.toLowerCase();
  if (/\s(?:on[a-z0-9:_-]+|href|xlink:href|src|xml:base|style)\s*=/u.test(lower)) {
    fail("SVG содержит запрещённую ссылку или обработчик события");
  }
  if (/\b(?:https?|file|javascript|data|vbscript):/u.test(lower) || /@import/u.test(lower)) {
    fail("SVG содержит внешний или исполняемый ресурс");
  }
  const urls = [...lower.matchAll(/url\s*\(\s*([^)]*?)\s*\)/gu)];
  if (lower.includes("url(") && urls.length === 0) fail("SVG содержит некорректную ссылку url");
  for (const match of urls) {
    if (!/^#[a-z_][a-z0-9_.:-]*$/u.test(match[1])) {
      fail("SVG содержит внешнюю ссылку url");
    }
  }
}

export function validateExternalSvg(svgBytes) {
  if (!Buffer.isBuffer(svgBytes) || svgBytes.length === 0 || svgBytes.length > MAX_SVG_BYTES) {
    fail("размер SVG выходит за безопасный предел");
  }
  const svg = decodeUtf8(svgBytes, "SVG не является корректным UTF-8");
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(svg)) {
    fail("SVG содержит управляющие символы");
  }
  if (/<!|<\?/u.test(svg)) fail("SVG содержит запрещённую декларацию");
  if (/[&\\]/u.test(svg) || /\/\*|\*\//u.test(svg)) {
    fail("SVG содержит запрещённое кодирование значения");
  }

  const stack = [];
  let rootSeen = false;
  let nodeCount = 0;
  let cursor = 0;
  while (cursor < svg.length) {
    const start = svg.indexOf("<", cursor);
    if (start < 0) {
      if (svg.slice(cursor).trim()) fail("SVG содержит текст вне элементов");
      break;
    }
    if (svg.slice(cursor, start).trim()) fail("SVG содержит текст вне элементов");
    const end = readSvgTagEnd(svg, start + 1);
    const tag = svg.slice(start, end + 1);
    const closing = /^<\s*\/\s*([A-Za-z][\w:-]*)\s*>$/u.exec(tag);
    if (closing) {
      const expected = stack.pop();
      if (expected !== closing[1]) fail("SVG содержит нарушенную вложенность элементов");
      cursor = end + 1;
      continue;
    }
    const opening = /^<\s*([A-Za-z][\w:-]*)\b[\s\S]*>$/u.exec(tag);
    if (!opening) fail("SVG содержит неподдерживаемый тег");
    const name = opening[1];
    if (!allowedSvgElements.has(name)) fail(`SVG содержит запрещённый элемент SVG: ${name}`);
    nodeCount += 1;
    if (nodeCount > 2_000) fail("SVG содержит слишком много элементов");
    validateSvgTag(tag);
    const selfClosing = /\/\s*>$/u.test(tag);
    if (!rootSeen) {
      if (name !== "svg") fail("SVG не содержит корневой элемент svg");
      rootSeen = true;
    } else if (name === "svg") {
      fail("SVG содержит вложенный элемент svg");
    }
    if (!selfClosing) stack.push(name);
    cursor = end + 1;
  }
  if (!rootSeen || stack.length !== 0) fail("SVG имеет некорректную структуру");
  return svg;
}

function resolveExecutable(candidates, label) {
  for (const candidate of candidates) {
    try {
      const resolved = fs.realpathSync(candidate);
      const stat = fs.statSync(resolved);
      if (stat.isFile()) return resolved;
    } catch {
      // Следующий известный системный путь может быть доступен.
    }
  }
  fail(`не найден изолированный системный инструмент: ${label}`);
}

function sandboxString(value) {
  if (typeof value !== "string" || /[\u0000-\u001f\u007f]/u.test(value)) {
    fail("некорректный путь для изолированной растеризации");
  }
  return JSON.stringify(value);
}

export function buildSandboxProfile({ inputPath, outputPath }) {
  const input = sandboxString(inputPath);
  const output = sandboxString(outputPath);
  return [
    "(version 1)",
    "(deny default)",
    "(deny network*)",
    "(allow process*)",
    "(allow mach-lookup)",
    "(allow sysctl-read)",
    "(allow file-read* (literal \"/\") (subpath \"/System\") (subpath \"/usr/lib\") (subpath \"/usr/share\") (subpath \"/opt/homebrew\") (subpath \"/private/var/db/timezone\") (literal \"/dev/null\") (literal \"/dev/urandom\") (literal " + input + "))",
    "(allow file-write* (literal " + output + "))",
  ].join("\n");
}

function inspectPngChunk(bytes, offset) {
  requireRange(bytes, offset, 12, "PNG содержит неполный блок");
  const length = bytes.readUInt32BE(offset);
  const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
  const dataOffset = offset + 8;
  requireRange(bytes, dataOffset, length + 4, "PNG содержит неполный блок");
  const data = bytes.subarray(dataOffset, dataOffset + length);
  const expectedCrc = bytes.readUInt32BE(dataOffset + length);
  const actualCrc = crc32(Buffer.concat([Buffer.from(type, "ascii"), data]));
  if (actualCrc !== expectedCrc) fail("PNG содержит повреждённый блок");
  return { type, data, nextOffset: dataOffset + length + 4 };
}

function createPngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(data.length + 12);
  chunk.writeUInt32BE(data.length, 0);
  typeBytes.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), data.length + 8);
  return chunk;
}

function validatePngHeader(data) {
  if (data.length !== 13) fail("PNG не содержит корректный заголовок");
  const width = data.readUInt32BE(0);
  const height = data.readUInt32BE(4);
  if (
    width !== RASTER_WIDTH ||
    height !== RASTER_HEIGHT ||
    data[8] !== 8 ||
    ![2, 6].includes(data[9]) ||
    data[10] !== 0 ||
    data[11] !== 0 ||
    data[12] !== 0
  ) {
    fail("PNG не соответствует параметрам безопасной растеризации");
  }
  return { width, height };
}

export function inspectPng(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 45 || bytes.length > MAX_PNG_BYTES) {
    fail("размер PNG выходит за безопасный предел");
  }
  if (!bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    fail("результат растеризации не является PNG");
  }
  const chunkTypes = [];
  let offset = PNG_SIGNATURE.length;
  let width;
  let height;
  let sawIdat = false;
  let sawIend = false;
  while (offset < bytes.length) {
    const { type, data, nextOffset } = inspectPngChunk(bytes, offset);
    chunkTypes.push(type);
    if (chunkTypes.length === 1) {
      if (type !== "IHDR") fail("PNG не содержит корректный заголовок");
      ({ width, height } = validatePngHeader(data));
    } else if (type === "IDAT") {
      if (sawIend) fail("PNG содержит данные после конца изображения");
      sawIdat = true;
    } else if (type === "IEND") {
      if (!sawIdat || data.length !== 0 || sawIend) fail("PNG содержит некорректный конец изображения");
      sawIend = true;
    } else {
      fail(`PNG содержит запрещённые метаданные: ${type}`);
    }
    offset = nextOffset;
  }
  if (!sawIend || offset !== bytes.length) fail("PNG не завершён");
  return { width, height, chunkTypes };
}

function sanitizeRasterizedPng(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 45 || bytes.length > MAX_PNG_BYTES) {
    fail("размер PNG выходит за безопасный предел");
  }
  if (!bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    fail("результат растеризации не является PNG");
  }

  let headerChunk;
  let endChunk;
  const idatParts = [];
  let offset = PNG_SIGNATURE.length;
  let chunkCount = 0;
  let sawBackground = false;
  let sawIdat = false;
  let sawIend = false;
  while (offset < bytes.length) {
    const chunkOffset = offset;
    const { type, data, nextOffset } = inspectPngChunk(bytes, offset);
    chunkCount += 1;
    if (chunkCount === 1) {
      if (type !== "IHDR") fail("PNG не содержит корректный заголовок");
      validatePngHeader(data);
      headerChunk = bytes.subarray(chunkOffset, nextOffset);
    } else if (type === "bKGD") {
      if (sawBackground || sawIdat || sawIend || data.length !== 6) {
        fail("PNG содержит некорректный служебный блок");
      }
      sawBackground = true;
    } else if (type === "IDAT") {
      if (sawIend) fail("PNG содержит данные после конца изображения");
      sawIdat = true;
      idatParts.push(data);
    } else if (type === "IEND") {
      if (!sawIdat || data.length !== 0 || sawIend) fail("PNG содержит некорректный конец изображения");
      sawIend = true;
      endChunk = bytes.subarray(chunkOffset, nextOffset);
    } else {
      fail(`PNG содержит запрещённые метаданные: ${type}`);
    }
    offset = nextOffset;
  }
  if (!sawIend || offset !== bytes.length) fail("PNG не завершён");
  const sanitized = Buffer.concat([
    PNG_SIGNATURE,
    headerChunk,
    createPngChunk("IDAT", Buffer.concat(idatParts)),
    endChunk,
  ]);
  inspectPng(sanitized);
  return sanitized;
}

function readInputZip(zipPath) {
  try {
    const stat = fs.lstatSync(zipPath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_ARCHIVE_BYTES) {
      fail("входной ZIP не является безопасным обычным файлом");
    }
    return fs.readFileSync(zipPath);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("входной ZIP")) throw error;
    fail("не удалось прочитать входной ZIP");
  }
}

function resolveOutputTarget(root) {
  let resolvedRoot;
  try {
    resolvedRoot = fs.realpathSync(root);
  } catch {
    fail("рабочий корень импорта недоступен");
  }
  const target = path.resolve(resolvedRoot, DEFAULT_OUTPUT_RELATIVE_PATH);
  if (!target.startsWith(`${resolvedRoot}${path.sep}`)) {
    fail("целевой путь импорта выходит за рабочий корень");
  }
  const targetDirectory = path.dirname(target);
  fs.mkdirSync(targetDirectory, { recursive: true });
  let resolvedDirectory;
  try {
    resolvedDirectory = fs.realpathSync(targetDirectory);
  } catch {
    fail("целевой каталог импорта недоступен");
  }
  if (!resolvedDirectory.startsWith(`${resolvedRoot}${path.sep}`)) {
    fail("целевой каталог импорта выходит за рабочий корень");
  }
  if (fs.existsSync(target)) {
    const stat = fs.lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink()) fail("целевой PNG не является обычным файлом");
  }
  return { target, targetDirectory };
}

function rasterizeSvgIsolated(svgBytes) {
  if (process.platform !== "darwin") {
    fail("изолированная растеризация SVG поддержана только в macOS");
  }
  const sandboxExecutable = resolveExecutable(["/usr/bin/sandbox-exec"], "sandbox-exec");
  const rendererExecutable = resolveExecutable(
    [
      "/opt/homebrew/bin/rsvg-convert",
      "/usr/local/bin/rsvg-convert",
      "/usr/bin/rsvg-convert",
    ],
    "rsvg-convert",
  );
  const temporaryDirectory = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-visual-donor-")),
  );
  const inputPath = path.join(temporaryDirectory, "donor.svg");
  const outputPath = path.join(temporaryDirectory, "reference.png");
  try {
    fs.writeFileSync(inputPath, svgBytes, { flag: "wx" });
    const result = spawnSync(
      sandboxExecutable,
      [
        "-p",
        buildSandboxProfile({ inputPath, outputPath }),
        rendererExecutable,
        "-w",
        String(RASTER_WIDTH),
        "-h",
        String(RASTER_HEIGHT),
        "-f",
        "png",
        inputPath,
        "-o",
        outputPath,
      ],
      {
        encoding: "utf8",
        timeout: RASTER_TIMEOUT_MS,
        maxBuffer: 64 * 1024,
        env: {
          HOME: temporaryDirectory,
          LANG: "C.UTF-8",
          LC_ALL: "C.UTF-8",
          PATH: "/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin",
          SOURCE_DATE_EPOCH: "0",
          TZ: "UTC",
        },
      },
    );
    if (result.error || result.status !== 0 || result.signal) {
      fail("изолированная растеризация SVG не выполнена");
    }
    const outputStat = fs.lstatSync(outputPath);
    if (!outputStat.isFile() || outputStat.isSymbolicLink()) {
      fail("изолированная растеризация не создала обычный PNG");
    }
    return sanitizeRasterizedPng(fs.readFileSync(outputPath));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("изолированная растеризация")) {
      throw error;
    }
    fail("изолированная растеризация SVG не выполнена");
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true, maxRetries: 3 });
  }
}

function publishPngAtomically(targetDirectory, targetPath, pngBytes) {
  const stagingDirectory = fs.mkdtempSync(path.join(targetDirectory, ".lisa-visual-donor-"));
  const stagedPath = path.join(stagingDirectory, "reference.png");
  try {
    fs.writeFileSync(stagedPath, pngBytes, { flag: "wx" });
    const stat = fs.lstatSync(stagedPath);
    if (!stat.isFile() || stat.isSymbolicLink()) fail("временный PNG не является обычным файлом");
    fs.renameSync(stagedPath, targetPath);
  } finally {
    fs.rmSync(stagingDirectory, { recursive: true, force: true, maxRetries: 3 });
  }
}

export function importVisualDonor({ root = process.cwd(), zipPath, memberName }) {
  if (typeof zipPath !== "string" || zipPath.length === 0) fail("не указан входной ZIP");
  const { target, targetDirectory } = resolveOutputTarget(root);
  const archiveBytes = readInputZip(zipPath);
  const svgBytes = extractSvg(archiveBytes, memberName);
  validateExternalSvg(svgBytes);
  const pngBytes = rasterizeSvgIsolated(svgBytes);
  publishPngAtomically(targetDirectory, target, pngBytes);
  return {
    archive_sha256: sha256(archiveBytes),
    member_name: memberName,
    member_sha256: sha256(svgBytes),
    output_path: DEFAULT_OUTPUT_RELATIVE_PATH,
    png_dimensions: { width: RASTER_WIDTH, height: RASTER_HEIGHT },
    png_sha256: sha256(pngBytes),
    renderer: "rsvg-convert",
    usage: VISUAL_DONOR_USAGE,
  };
}

function parseCliArguments(args) {
  if (args.length !== 4 || args[0] !== "--zip" || args[2] !== "--member") {
    fail("использование: node scripts/import-presentation-link-lisa-visual-donor.mjs --zip <ZIP> --member <SVG>");
  }
  return { zipPath: args[1], memberName: args[3] };
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
    const result = importVisualDonor(parseCliArguments(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "импорт не выполнен"}\n`);
    process.exitCode = 1;
  }
}
