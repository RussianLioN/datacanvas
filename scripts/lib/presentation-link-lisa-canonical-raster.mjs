import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

export const CANONICAL_RASTER_VERSION = "2.0.0";
export const CANONICAL_RASTER_CANDIDATE_COUNT = 3;
export const CANONICAL_RASTER_MANIFEST_RELATIVE_PATH =
  "derived/canonical-raster-manifest.json";
export const CANONICAL_RASTER_DIAGNOSTIC_RELATIVE_PATH =
  "test-results/presentation-link-lisa-user-journey/raster-mismatch";
export const CANONICAL_CAPTURE_TOOL_WARNING = Object.freeze({
  classification: "playwright-webkit-screenshot-inline-style",
  message:
    "Refused to apply a stylesheet because its hash, its nonce, or 'unsafe-inline' does not appear in the style-src directive of the Content Security Policy.",
  count: 1,
});
export const CANONICAL_RASTER_VIEWPORTS = Object.freeze([
  Object.freeze({ id: "desktop-1280x720", width: 1280, height: 720 }),
  Object.freeze({ id: "mobile-390x844", width: 390, height: 844 }),
  Object.freeze({ id: "stress-320x568", width: 320, height: 568 }),
]);
export const NATURAL_SOURCE_PARITY_POLICY = Object.freeze({
  comparison: "pixel-exact-outside-slots",
  outside_slots: "must-match",
  mask_coordinate_space: "natural-source-pixels",
  failure_action: "block-release",
});
export const NATURAL_SOURCE_CAPTURE_LAYOUT = Object.freeze({
  mode: "capture-only-zero-origin",
  scene_stage_padding: "0",
  prototype_root_justify_items: "start",
  expected_origin: Object.freeze({ x: 0, y: 0 }),
});

const PNG_SIGNATURE = Buffer.from("89504e470d0a1a0a", "hex");
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const PNG_CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right, "en"))
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

export function stableCanonicalRasterJson(value, indentation = 2) {
  return `${JSON.stringify(stableValue(value), null, indentation)}\n`;
}

export function canonicalRasterSha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export function canonicalRasterPngDimensions(bytes, label = "PNG") {
  if (!Buffer.isBuffer(bytes) || bytes.length < 24 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${label}: неверная сигнатура PNG`);
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function pngCrc32(...parts) {
  let value = 0xffffffff;
  for (const part of parts) {
    for (const byte of part) {
      value = PNG_CRC32_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
    }
  }
  return (value ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBytes.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(pngCrc32(typeBytes, data), 8 + data.length);
  return chunk;
}

function assertPngDimensions(value, label) {
  if (
    !value ||
    !Number.isInteger(value.width) || value.width < 1 ||
    !Number.isInteger(value.height) || value.height < 1
  ) {
    throw new Error(`${label}: нужны положительные целые размеры`);
  }
  return { width: value.width, height: value.height };
}

function assertRgbaPixelData(data, dimensions, label) {
  const expectedLength = dimensions.width * dimensions.height * 4;
  if (!Number.isSafeInteger(expectedLength) || expectedLength < 4) {
    throw new Error(`${label}: размеры PNG выходят за безопасный предел`);
  }
  if (!Buffer.isBuffer(data) || data.length !== expectedLength) {
    throw new Error(`${label}: RGBA-данные имеют неверную длину`);
  }
}

function paethPredictor(left, above, upperLeft) {
  const base = left + above - upperLeft;
  const distanceLeft = Math.abs(base - left);
  const distanceAbove = Math.abs(base - above);
  const distanceUpperLeft = Math.abs(base - upperLeft);
  if (distanceLeft <= distanceAbove && distanceLeft <= distanceUpperLeft) return left;
  if (distanceAbove <= distanceUpperLeft) return above;
  return upperLeft;
}

/**
 * Strictly decodes the only PNG form emitted by the approved raster sources:
 * non-interlaced 8-bit RGBA. The decoder is read-only; it never normalizes
 * pixels or re-encodes published evidence.
 */
export function decodeCanonicalRgbaPng(bytes, label = "PNG") {
  if (!Buffer.isBuffer(bytes) || bytes.length < 45 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${label}: неверная сигнатура PNG`);
  }
  let offset = 8;
  let chunkIndex = 0;
  let dimensions = null;
  let sawImageData = false;
  let sawEnd = false;
  const imageData = [];
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) throw new Error(`${label}: повреждённая структура PNG`);
    const length = bytes.readUInt32BE(offset);
    const typeBytes = bytes.subarray(offset + 4, offset + 8);
    const type = typeBytes.toString("ascii");
    const end = offset + 12 + length;
    if (end > bytes.length) throw new Error(`${label}: повреждённая длина чанка PNG`);
    const data = bytes.subarray(offset + 8, end - 4);
    if (pngCrc32(typeBytes, data) !== bytes.readUInt32BE(end - 4)) {
      throw new Error(`${label}: не совпадает CRC чанка PNG`);
    }
    if (chunkIndex === 0 && (type !== "IHDR" || length !== 13)) {
      throw new Error(`${label}: PNG должен начинаться с IHDR`);
    }
    if (type === "IHDR") {
      if (chunkIndex !== 0) throw new Error(`${label}: PNG содержит повторный IHDR`);
      dimensions = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
      };
      assertPngDimensions(dimensions, label);
      if (data[8] !== 8 || data[9] !== 6 || data[10] !== 0 || data[11] !== 0 || data[12] !== 0) {
        throw new Error(`${label}: поддерживается только неинтерлейсный 8-bit RGBA PNG`);
      }
    } else if (type === "IDAT") {
      sawImageData = true;
      imageData.push(data);
    } else if (type === "IEND") {
      if (length !== 0 || end !== bytes.length) {
        throw new Error(`${label}: PNG содержит данные после IEND`);
      }
      sawEnd = true;
      break;
    }
    offset = end;
    chunkIndex += 1;
  }
  if (!dimensions || !sawImageData || !sawEnd) {
    throw new Error(`${label}: PNG не содержит полноценные данные изображения`);
  }
  const rowLength = dimensions.width * 4;
  const encodedLength = dimensions.height * (rowLength + 1);
  if (!Number.isSafeInteger(encodedLength)) throw new Error(`${label}: PNG слишком велик`);
  let inflated;
  try {
    inflated = zlib.inflateSync(Buffer.concat(imageData));
  } catch (error) {
    throw new Error(`${label}: IDAT не распаковывается: ${error instanceof Error ? error.message : "ошибка"}`);
  }
  if (inflated.length !== encodedLength) {
    throw new Error(`${label}: распакованные данные PNG имеют неверную длину`);
  }
  const data = Buffer.alloc(dimensions.width * dimensions.height * 4);
  let sourceOffset = 0;
  for (let y = 0; y < dimensions.height; y += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    if (![0, 1, 2, 3, 4].includes(filter)) {
      throw new Error(`${label}: PNG содержит неизвестный фильтр строки`);
    }
    const rowOffset = y * rowLength;
    const previousRowOffset = rowOffset - rowLength;
    for (let x = 0; x < rowLength; x += 1) {
      const raw = inflated[sourceOffset + x];
      const left = x >= 4 ? data[rowOffset + x - 4] : 0;
      const above = y > 0 ? data[previousRowOffset + x] : 0;
      const upperLeft = y > 0 && x >= 4 ? data[previousRowOffset + x - 4] : 0;
      let value;
      if (filter === 0) value = raw;
      else if (filter === 1) value = (raw + left) & 0xff;
      else if (filter === 2) value = (raw + above) & 0xff;
      else if (filter === 3) value = (raw + Math.floor((left + above) / 2)) & 0xff;
      else value = (raw + paethPredictor(left, above, upperLeft)) & 0xff;
      data[rowOffset + x] = value;
    }
    sourceOffset += rowLength;
  }
  return { ...dimensions, data };
}

/** Deterministic helper for small test fixtures; production evidence is never re-encoded. */
export function encodeCanonicalRgbaPng({ width, height, data }) {
  const dimensions = assertPngDimensions({ width, height }, "RGBA PNG");
  assertRgbaPixelData(data, dimensions, "RGBA PNG");
  const rowLength = dimensions.width * 4;
  const raw = Buffer.alloc(dimensions.height * (rowLength + 1));
  for (let y = 0; y < dimensions.height; y += 1) {
    const sourceOffset = y * rowLength;
    const targetOffset = y * (rowLength + 1);
    raw[targetOffset] = 0;
    data.copy(raw, targetOffset + 1, sourceOffset, sourceOffset + rowLength);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(dimensions.width, 0);
  header.writeUInt32BE(dimensions.height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", header),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function normalizeRect(value, dimensions, label) {
  if (
    !value ||
    !Number.isInteger(value.x) || !Number.isInteger(value.y) ||
    !Number.isInteger(value.width) || !Number.isInteger(value.height) ||
    value.x < 0 || value.y < 0 || value.width < 1 || value.height < 1 ||
    value.x + value.width > dimensions.width ||
    value.y + value.height > dimensions.height
  ) {
    throw new Error(`${label}: прямоугольник выходит за natural-source-pixels`);
  }
  return { x: value.x, y: value.y, width: value.width, height: value.height };
}

function rectanglesIntersect(left, right) {
  return left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y;
}

function sameParityPolicy(value) {
  return stableCanonicalRasterJson(value) === stableCanonicalRasterJson(NATURAL_SOURCE_PARITY_POLICY);
}

export function hasNaturalSourceCaptureLayout(value) {
  return stableCanonicalRasterJson(value) === stableCanonicalRasterJson(NATURAL_SOURCE_CAPTURE_LAYOUT);
}

/**
 * Creates the explicit natural-pixel mask from approved local slots. A value
 * of one permits a local overlay; a value of zero must remain pixel-identical
 * to the approved raster base.
 */
export function buildNaturalSourceMask({ naturalDimensions, slots, protectedRegions = [] }) {
  const dimensions = assertPngDimensions(naturalDimensions, "natural_dimensions");
  if (!Array.isArray(slots) || slots.length === 0) {
    throw new Error("маска source parity требует хотя бы один local_slot");
  }
  if (!Array.isArray(protectedRegions) || protectedRegions.length === 0) {
    throw new Error("маска source parity требует хотя бы один protected_region");
  }
  const normalizedProtected = protectedRegions.map((region, index) => ({
    id: typeof region?.id === "string" ? region.id : `protected-${index}`,
    rect: normalizeRect(region?.rect, dimensions, `protected_region ${String(region?.id ?? index)}`),
  }));
  if (new Set(normalizedProtected.map((region) => region.id)).size !== normalizedProtected.length) {
    throw new Error("маска source parity содержит повторяющийся protected_region");
  }
  const normalizedSlots = slots.map((slot, index) => {
    if (
      typeof slot?.id !== "string" ||
      !["transparent-semantic-slot", "visible-local-overlay"].includes(slot.kind)
    ) {
      throw new Error(`local_slot ${index}: неверный id или kind`);
    }
    return {
      id: slot.id,
      kind: slot.kind,
      rect: normalizeRect(slot.rect, dimensions, `local_slot ${slot.id}`),
    };
  });
  if (new Set(normalizedSlots.map((slot) => slot.id)).size !== normalizedSlots.length) {
    throw new Error("маска source parity содержит повторяющийся local_slot");
  }
  for (const slot of normalizedSlots) {
    for (const protectedRegion of normalizedProtected) {
      if (rectanglesIntersect(slot.rect, protectedRegion.rect)) {
        throw new Error(`local_slot ${slot.id} пересекает protected_region ${protectedRegion.id}`);
      }
    }
  }
  const pixelCount = dimensions.width * dimensions.height;
  if (!Number.isSafeInteger(pixelCount)) throw new Error("маска source parity слишком велика");
  const data = Buffer.alloc(pixelCount);
  const protectedData = Buffer.alloc(pixelCount);
  for (const protectedRegion of normalizedProtected) {
    for (let y = protectedRegion.rect.y; y < protectedRegion.rect.y + protectedRegion.rect.height; y += 1) {
      protectedData.fill(1, y * dimensions.width + protectedRegion.rect.x, y * dimensions.width + protectedRegion.rect.x + protectedRegion.rect.width);
    }
  }
  for (const slot of normalizedSlots) {
    for (let y = slot.rect.y; y < slot.rect.y + slot.rect.height; y += 1) {
      data.fill(1, y * dimensions.width + slot.rect.x, y * dimensions.width + slot.rect.x + slot.rect.width);
    }
  }
  const maskedPixelCount = data.reduce((count, value) => count + value, 0);
  const protectedPixelCount = protectedData.reduce((count, value) => count + value, 0);
  return {
    natural_dimensions: dimensions,
    data,
    slots: normalizedSlots,
    protected_regions: normalizedProtected,
    sha256: canonicalRasterSha256(data),
    masked_pixel_count: maskedPixelCount,
    unmasked_pixel_count: pixelCount - maskedPixelCount,
    protected_pixel_count: protectedPixelCount,
  };
}

/**
 * Compares the actual browser scene with its approved raster base. The only
 * permitted differences are pixels covered by the contract's local-slot mask.
 */
export function inspectRasterSourceParity({
  stateId,
  basePng,
  renderedPng,
  naturalDimensions,
  slots,
  protectedRegions,
  expectedBaseSha256,
}) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(String(stateId ?? ""))) {
    throw new Error("source parity требует безопасный state_id");
  }
  const dimensions = assertPngDimensions(naturalDimensions, `${stateId}: natural_dimensions`);
  const base = decodeCanonicalRgbaPng(basePng, `${stateId}: raster base`);
  const rendered = decodeCanonicalRgbaPng(renderedPng, `${stateId}: rendered scene`);
  if (
    base.width !== dimensions.width || base.height !== dimensions.height ||
    rendered.width !== dimensions.width || rendered.height !== dimensions.height
  ) {
    throw new Error(`${stateId}: source parity требует PNG в natural-source-pixels`);
  }
  const baseSha256 = canonicalRasterSha256(basePng);
  if (expectedBaseSha256 !== undefined && expectedBaseSha256 !== baseSha256) {
    throw new Error(`${stateId}: raster base не совпадает с SHA-256 визуального договора`);
  }
  const mask = buildNaturalSourceMask({ naturalDimensions: dimensions, slots, protectedRegions });
  let differingPixelCount = 0;
  let maxChannelDelta = 0;
  let firstDifference = null;
  const slotResults = mask.slots.map((slot) => ({
    id: slot.id,
    kind: slot.kind,
    rect: { ...slot.rect },
    masked_pixel_count: slot.rect.width * slot.rect.height,
    differing_pixel_count: 0,
  }));
  for (let pixel = 0; pixel < mask.data.length; pixel += 1) {
    const byteOffset = pixel * 4;
    let differs = false;
    let pixelDelta = 0;
    for (let channel = 0; channel < 4; channel += 1) {
      const delta = Math.abs(base.data[byteOffset + channel] - rendered.data[byteOffset + channel]);
      if (delta > 0) differs = true;
      if (delta > pixelDelta) pixelDelta = delta;
    }
    if (!differs) continue;
    const x = pixel % dimensions.width;
    const y = Math.floor(pixel / dimensions.width);
    if (mask.data[pixel] === 1) {
      for (const result of slotResults) {
        const rect = result.rect;
        if (x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height) {
          result.differing_pixel_count += 1;
        }
      }
      continue;
    }
    differingPixelCount += 1;
    if (pixelDelta > maxChannelDelta) maxChannelDelta = pixelDelta;
    if (!firstDifference) firstDifference = { x, y };
  }
  return {
    state_id: stateId,
    policy: { ...NATURAL_SOURCE_PARITY_POLICY },
    base_sha256: baseSha256,
    rendered_sha256: canonicalRasterSha256(rendered.data),
    natural_dimensions: dimensions,
    mask: {
      sha256: mask.sha256,
      masked_pixel_count: mask.masked_pixel_count,
      unmasked_pixel_count: mask.unmasked_pixel_count,
      protected_pixel_count: mask.protected_pixel_count,
    },
    outside_slot_result: {
      compared_pixel_count: mask.unmasked_pixel_count,
      differing_pixel_count: differingPixelCount,
      max_channel_delta: maxChannelDelta,
      first_difference: firstDifference,
    },
    slots: slotResults,
    passed: differingPixelCount === 0,
  };
}

export function canonicalRasterPath(viewportId, stateId) {
  if (!CANONICAL_RASTER_VIEWPORTS.some((viewport) => viewport.id === viewportId)) {
    throw new Error(`неизвестный viewport канонического растра: ${String(viewportId)}`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(String(stateId))) {
    throw new Error(`небезопасный идентификатор состояния канонического растра: ${String(stateId)}`);
  }
  return `evidence/screenshots/webkit/${viewportId}/${stateId}.png`;
}

export function canonicalRasterExpectedPaths(stateIds) {
  if (!Array.isArray(stateIds)) throw new Error("список состояний канонического растра отсутствует");
  return CANONICAL_RASTER_VIEWPORTS.flatMap((viewport) =>
    stateIds.map((stateId) => canonicalRasterPath(viewport.id, stateId)),
  ).sort((left, right) => left.localeCompare(right, "en"));
}

export function canonicalRasterCandidateFingerprint(inputs) {
  const payload = Buffer.from(
    stableCanonicalRasterJson({ version: CANONICAL_RASTER_VERSION, inputs }),
    "utf8",
  );
  return {
    algorithm: "sha256",
    sha256: canonicalRasterSha256(payload),
    inputs: stableValue(inputs),
  };
}

export function canonicalCaptureToolWarnings() {
  return [{ ...CANONICAL_CAPTURE_TOOL_WARNING }];
}

export function hasCanonicalCaptureToolWarnings(value) {
  return stableCanonicalRasterJson(value) ===
    stableCanonicalRasterJson(canonicalCaptureToolWarnings());
}

const SOURCE_PARITY_RESULT_KEYS = Object.freeze([
  "state_id",
  "policy",
  "base_sha256",
  "rendered_sha256",
  "natural_dimensions",
  "mask",
  "outside_slot_result",
  "slots",
  "passed",
]);

function hasExactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    stableCanonicalRasterJson(Object.keys(value).sort((left, right) => left.localeCompare(right, "en"))) ===
      stableCanonicalRasterJson([...keys].sort((left, right) => left.localeCompare(right, "en")));
}

/** Validates a serializable source-parity result against its visual binding. */
export function validateRasterSourceParityResult(value, binding = undefined) {
  const label = `${binding?.state_id ?? value?.state_id ?? "source parity"}`;
  if (!hasExactKeys(value, SOURCE_PARITY_RESULT_KEYS)) {
    throw new Error(`${label}: source_parity содержит неверный набор полей`);
  }
  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value.state_id ?? "") ||
    !sameParityPolicy(value.policy) ||
    !SHA256_PATTERN.test(value.base_sha256 ?? "") ||
    !SHA256_PATTERN.test(value.rendered_sha256 ?? "") ||
    value.passed !== true
  ) {
    throw new Error(`${label}: source_parity не подтверждает строгую политику`);
  }
  const dimensions = assertPngDimensions(value.natural_dimensions, `${label}: source_parity natural_dimensions`);
  if (!hasExactKeys(value.mask, ["sha256", "masked_pixel_count", "unmasked_pixel_count", "protected_pixel_count"]) ||
    !SHA256_PATTERN.test(value.mask.sha256 ?? "") ||
    !Number.isInteger(value.mask.masked_pixel_count) || value.mask.masked_pixel_count < 1 ||
    !Number.isInteger(value.mask.unmasked_pixel_count) || value.mask.unmasked_pixel_count < 1 ||
    !Number.isInteger(value.mask.protected_pixel_count) || value.mask.protected_pixel_count < 1 ||
    value.mask.masked_pixel_count + value.mask.unmasked_pixel_count !== dimensions.width * dimensions.height
  ) {
    throw new Error(`${label}: source_parity содержит неверную маску`);
  }
  if (!hasExactKeys(value.outside_slot_result, ["compared_pixel_count", "differing_pixel_count", "max_channel_delta", "first_difference"]) ||
    value.outside_slot_result.compared_pixel_count !== value.mask.unmasked_pixel_count ||
    !Number.isInteger(value.outside_slot_result.differing_pixel_count) ||
    value.outside_slot_result.differing_pixel_count !== 0 ||
    !Number.isInteger(value.outside_slot_result.max_channel_delta) ||
    value.outside_slot_result.max_channel_delta !== 0 ||
    value.outside_slot_result.first_difference !== null
  ) {
    throw new Error(`${label}: source_parity обнаруживает различие вне local_slots`);
  }
  if (!Array.isArray(value.slots) || value.slots.length === 0) {
    throw new Error(`${label}: source_parity не содержит local_slots`);
  }
  const expectedMask = binding
    ? buildNaturalSourceMask({
      naturalDimensions: binding.natural_dimensions,
      slots: binding.slots,
      protectedRegions: binding.protected_regions,
    })
    : null;
  if (binding) {
    if (value.state_id !== binding.state_id ||
      canonicalRasterSha256(Buffer.from(stableCanonicalRasterJson(dimensions))) !==
        canonicalRasterSha256(Buffer.from(stableCanonicalRasterJson(binding.natural_dimensions))) ||
      value.base_sha256 !== binding.base_sha256 ||
      value.mask.sha256 !== expectedMask.sha256 ||
      value.mask.masked_pixel_count !== expectedMask.masked_pixel_count ||
      value.mask.unmasked_pixel_count !== expectedMask.unmasked_pixel_count ||
      value.mask.protected_pixel_count !== expectedMask.protected_pixel_count
    ) {
      throw new Error(`${label}: source_parity не связан с утверждённой растровой основой`);
    }
  }
  const expectedSlots = expectedMask?.slots ?? null;
  const seen = new Set();
  for (const result of value.slots) {
    if (!hasExactKeys(result, ["id", "kind", "rect", "masked_pixel_count", "differing_pixel_count"]) ||
      typeof result.id !== "string" ||
      !["transparent-semantic-slot", "visible-local-overlay"].includes(result.kind) ||
      !Number.isInteger(result.masked_pixel_count) || result.masked_pixel_count < 1 ||
      !Number.isInteger(result.differing_pixel_count) || result.differing_pixel_count < 0 ||
      seen.has(result.id)
    ) {
      throw new Error(`${label}: source_parity содержит неверный local_slot`);
    }
    seen.add(result.id);
    const rect = normalizeRect(result.rect, dimensions, `${label}: local_slot ${result.id}`);
    if (result.masked_pixel_count !== rect.width * rect.height) {
      throw new Error(`${label}: source_parity содержит неверный размер local_slot`);
    }
    const expected = expectedSlots?.find((slot) => slot.id === result.id);
    if (expected && (
      result.kind !== expected.kind ||
      stableCanonicalRasterJson(rect) !== stableCanonicalRasterJson(expected.rect)
    )) {
      throw new Error(`${label}: source_parity local_slot не совпадает с визуальным договором`);
    }
    if (expectedSlots && !expected) {
      throw new Error(`${label}: source_parity содержит незарегистрированный local_slot`);
    }
  }
  if (expectedSlots && (seen.size !== expectedSlots.length || expectedSlots.some((slot) => !seen.has(slot.id)))) {
    throw new Error(`${label}: source_parity не покрывает local_slots визуального договора`);
  }
  return true;
}

function aggregateSourceParity(records) {
  const byState = new Map();
  for (const record of records) {
    const value = record?.source_parity;
    validateRasterSourceParityResult(value);
    const existing = byState.get(value.state_id);
    if (existing && stableCanonicalRasterJson(existing) !== stableCanonicalRasterJson(value)) {
      throw new Error(`${value.state_id}: source_parity различается между viewport`);
    }
    byState.set(value.state_id, value);
  }
  return {
    policy: { ...NATURAL_SOURCE_PARITY_POLICY },
    records: [...byState.values()]
      .sort((left, right) => left.state_id.localeCompare(right.state_id, "en"))
      .map((record) => stableValue(record)),
  };
}

function assertRun(run, index, recordLabel) {
  if (
    !run ||
    run.run !== index + 1 ||
    !SHA256_PATTERN.test(run.sha256 ?? "") ||
    !Number.isInteger(run.bytes) ||
    run.bytes < 1
  ) {
    throw new Error(`${recordLabel}: неверная запись запуска ${index + 1}`);
  }
}

export function buildCanonicalRasterManifest({ candidateFingerprint, rendererProfile, records }) {
  if (!SHA256_PATTERN.test(candidateFingerprint?.sha256 ?? "")) {
    throw new Error("канонический растр не содержит SHA-256 кандидата");
  }
  if (!rendererProfile || typeof rendererProfile !== "object") {
    throw new Error("канонический растр не содержит профиль рендерера");
  }
  if (!hasCanonicalCaptureToolWarnings(rendererProfile.capture_tool_warnings)) {
    throw new Error("канонический растр не фиксирует единственное ожидаемое предупреждение Playwright CSP");
  }
  if (!hasNaturalSourceCaptureLayout(rendererProfile.source_parity_capture_layout)) {
    throw new Error("канонический растр не фиксирует capture-only layout natural source parity");
  }
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error("канонический растр не содержит записей");
  }
  const stateIds = [...new Set(records.map((record) => record?.state_id))].sort((left, right) =>
      String(left).localeCompare(String(right), "en"),
    );
  const expectedPaths = canonicalRasterExpectedPaths(stateIds);
  if (records.length !== expectedPaths.length) {
    throw new Error(`канонический растр должен содержать ${expectedPaths.length} записей`);
  }
  const actualPaths = records.map((record) => record?.path).sort((left, right) =>
    String(left).localeCompare(String(right), "en"),
  );
  if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
    throw new Error("канонический растр содержит неверный состав путей");
  }
  for (const record of records) {
    const label = `${record?.viewport ?? "неизвестный viewport"}/${record?.state_id ?? "неизвестное состояние"}`;
    if (
      record?.browser !== "webkit" ||
      !CANONICAL_RASTER_VIEWPORTS.some((viewport) => viewport.id === record?.viewport) ||
      !SHA256_PATTERN.test(record?.sha256 ?? "") ||
      !Number.isInteger(record?.bytes) ||
      record.bytes < 1 ||
      !record?.png_dimensions ||
      !Number.isInteger(record.png_dimensions.width) ||
      !Number.isInteger(record.png_dimensions.height) ||
      !Array.isArray(record.runs) ||
      record.runs.length !== CANONICAL_RASTER_CANDIDATE_COUNT ||
      !record.source_parity
    ) {
      throw new Error(`${label}: неверная запись канонического растра`);
    }
    for (const [index, run] of record.runs.entries()) {
      assertRun(run, index, label);
      if (run.sha256 !== record.sha256 || run.bytes !== record.bytes) {
        throw new Error(`${label}: запуск ${index + 1} не совпадает с опубликованным PNG`);
      }
    }
  }
  const sourceParity = aggregateSourceParity(records);
  if (sourceParity.records.length !== stateIds.length) {
    throw new Error("канонический растр не подтверждает source parity для каждого состояния");
  }
  return {
    version: CANONICAL_RASTER_VERSION,
    status: "generated",
    candidate_fingerprint: candidateFingerprint,
    renderer_profile: stableValue(rendererProfile),
    source_parity: sourceParity,
    records: [...records]
      .sort((left, right) => left.path.localeCompare(right.path, "en"))
      .map((record) => stableValue(record)),
  };
}

export function readCanonicalRasterManifest(filePath) {
  const stat = fs.lstatSync(filePath);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error("манифест канонического растра должен быть обычным файлом");
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeCanonicalRasterManifest(filePath, manifest) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, stableCanonicalRasterJson(manifest), { flag: "wx" });
}

function resolveWithin(root, relativePath, label) {
  const absoluteRoot = path.resolve(root);
  const target = path.resolve(absoluteRoot, relativePath);
  if (target !== absoluteRoot && !target.startsWith(`${absoluteRoot}${path.sep}`)) {
    throw new Error(`${label} выходит за границы корня`);
  }
  return target;
}

function resolveDiagnosticRoot(root) {
  if (typeof root !== "string" || !path.isAbsolute(root)) {
    throw new Error("корень диагностики канонического растра должен быть абсолютным путём");
  }
  const resolved = path.resolve(root);
  const stat = fs.lstatSync(resolved);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error("корень диагностики канонического растра должен быть обычным каталогом");
  }
  return resolved;
}

function validateCaptureStates(states) {
  if (!Array.isArray(states) || states.length === 0) {
    throw new Error("канонический захват должен получить активные состояния из реестра");
  }
  const ids = [];
  for (const state of states) {
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(state?.id ?? "") ||
      !SHA256_PATTERN.test(state?.projection_sha256 ?? "")
    ) {
      throw new Error(`канонический захват получил неверное состояние: ${String(state?.id)}`);
    }
    ids.push(state.id);
  }
  if (new Set(ids).size !== ids.length) {
    throw new Error("канонический захват получил повторяющиеся активные состояния");
  }
}

function safeContractRelativePath(value) {
  return typeof value === "string" &&
    value.length > 0 &&
    !value.includes("\\") &&
    !path.posix.isAbsolute(value) &&
    !value.includes("\0") &&
    !value.split("/").includes("..") &&
    path.posix.normalize(value) === value;
}

function readVisualCaptureStates({ sourceRoot, packageRelativePath, states }) {
  if (!safeContractRelativePath(packageRelativePath)) {
    throw new Error("канонический захват получил небезопасный путь пакета");
  }
  const basisPath = resolveWithin(
    sourceRoot,
    path.posix.join(packageRelativePath, "source/visual-basis-contract.json"),
    "визуальный договор канонического захвата",
  );
  const stat = fs.lstatSync(basisPath);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error("визуальный договор канонического захвата должен быть обычным файлом");
  }
  let basis;
  try {
    basis = JSON.parse(fs.readFileSync(basisPath, "utf8"));
  } catch (error) {
    throw new Error(`визуальный договор канонического захвата повреждён: ${error instanceof Error ? error.message : "не прочитан"}`);
  }
  if (basis?.rendering_pipeline !== "raster-base-local-overlay" || !sameParityPolicy(basis.source_parity)) {
    throw new Error("визуальный договор не закрепляет source parity raster-base-local-overlay");
  }
  const bindings = Array.isArray(basis.state_bindings) ? basis.state_bindings : [];
  if (JSON.stringify(bindings.map((binding) => binding?.state_id)) !== JSON.stringify(states.map((state) => state.id))) {
    throw new Error("визуальный договор не покрывает активные состояния канонического захвата");
  }
  return states.map((state, index) => {
    const binding = bindings[index];
    if (
      !safeContractRelativePath(binding?.base_path) ||
      !binding.base_path.startsWith("source/bases/") ||
      !SHA256_PATTERN.test(binding?.base_sha256 ?? "")
    ) {
      throw new Error(`${state.id}: визуальный договор не содержит безопасную PNG-основу`);
    }
    const dimensions = assertPngDimensions(binding.natural_dimensions, `${state.id}: natural_dimensions`);
    const basePath = resolveWithin(
      sourceRoot,
      path.posix.join(packageRelativePath, binding.base_path),
      `${state.id}: raster base`,
    );
    const baseStat = fs.lstatSync(basePath);
    if (!baseStat.isFile() || baseStat.isSymbolicLink()) {
      throw new Error(`${state.id}: raster base должен быть обычным PNG`);
    }
    const baseBytes = fs.readFileSync(basePath);
    if (canonicalRasterSha256(baseBytes) !== binding.base_sha256) {
      throw new Error(`${state.id}: raster base не совпадает с SHA-256 визуального договора`);
    }
    const decoded = decodeCanonicalRgbaPng(baseBytes, `${state.id}: raster base`);
    if (decoded.width !== dimensions.width || decoded.height !== dimensions.height) {
      throw new Error(`${state.id}: raster base не совпадает с natural_dimensions`);
    }
    buildNaturalSourceMask({
      naturalDimensions: dimensions,
      slots: binding.slots,
      protectedRegions: binding.protected_regions,
    });
    return {
      id: state.id,
      projection_sha256: state.projection_sha256,
      visual_binding: {
        state_id: state.id,
        base_path: binding.base_path,
        base_sha256: binding.base_sha256,
        natural_dimensions: dimensions,
        slots: binding.slots.map((slot) => ({
          id: slot.id,
          kind: slot.kind,
          semantic_control_id: slot.semantic_control_id,
          rect: { ...slot.rect },
        })),
        protected_regions: binding.protected_regions.map((region) => ({
          id: region.id,
          rect: { ...region.rect },
        })),
      },
    };
  });
}

function clearDiagnosticBundle(root, diagnosticRelativePath) {
  const target = resolveWithin(root, diagnosticRelativePath, "диагностический каталог");
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true, maxRetries: 3 });
  return target;
}

function writeDiagnosticBundle({
  root,
  diagnosticRelativePath,
  captureRoot,
  candidateFingerprint,
  captureRecords,
  reason,
}) {
  const target = clearDiagnosticBundle(root, diagnosticRelativePath);
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(
    path.join(target, "candidate-fingerprint.json"),
    stableCanonicalRasterJson(candidateFingerprint),
    { flag: "wx" },
  );
  for (let run = 1; run <= CANONICAL_RASTER_CANDIDATE_COUNT; run += 1) {
    const source = path.join(captureRoot, `run-${run}`);
    if (fs.existsSync(source)) fs.cpSync(source, path.join(target, `run-${run}`), { recursive: true });
  }
  fs.writeFileSync(
    path.join(target, "sha256.json"),
    stableCanonicalRasterJson({
      version: CANONICAL_RASTER_VERSION,
      reason,
      candidate_fingerprint: candidateFingerprint,
      captures: captureRecords,
    }),
    { flag: "wx" },
  );
}

function sanitizeDiagnosticText(value) {
  return String(value ?? "")
    .replace(/file:\/\/[^\s"']+/gu, "[локальный-путь]")
    .replace(/\/(?:Users|home)\/[^\s"']+/gu, "[локальный-путь]")
    .replace(/[A-Za-z]:\\(?:Users|Documents and Settings)\\[^\s"']+/gu, "[локальный-путь]")
    .slice(0, 2000);
}

function failedChildCaptureSummary(reportPath) {
  try {
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    const failure = report?.status === "failed" ? report.failure : null;
    if (!failure || typeof failure !== "object") return null;
    const safeTextArray = (value) => Array.isArray(value)
      ? value.slice(0, 20).map(sanitizeDiagnosticText)
      : [];
    return {
      state_id: typeof failure.state_id === "string" ? failure.state_id : null,
      message: sanitizeDiagnosticText(failure.message),
      console_errors: safeTextArray(failure.console_errors),
      page_errors: safeTextArray(failure.page_errors),
      network_attempts: safeTextArray(failure.network_attempts),
    };
  } catch {
    return null;
  }
}

function validateChildReport(report, { candidateFingerprint, viewport, states, run }) {
  if (
    report?.version !== CANONICAL_RASTER_VERSION ||
    report?.capture_engine !== "webkit" ||
    report?.candidate_fingerprint?.sha256 !== candidateFingerprint.sha256 ||
    report?.run !== run ||
    report?.viewport?.id !== viewport.id ||
    report?.viewport?.width !== viewport.width ||
    report?.viewport?.height !== viewport.height ||
    !report?.renderer_profile ||
    !hasCanonicalCaptureToolWarnings(report.renderer_profile.capture_tool_warnings) ||
    !hasNaturalSourceCaptureLayout(report.renderer_profile.source_parity_capture_layout) ||
    !Array.isArray(report.records)
  ) {
    throw new Error(`${viewport.id}: дочерний захват вернул неполный отчёт`);
  }
  if (JSON.stringify(report.records.map((record) => record?.state_id)) !== JSON.stringify(states.map((state) => state.id))) {
    throw new Error(`${viewport.id}: дочерний захват вернул неверный порядок состояний`);
  }
  for (const [index, record] of report.records.entries()) {
    const state = states[index];
    if (
      record?.projection_sha256 !== state.projection_sha256 ||
      record?.frame_path !== `${state.id}.png` ||
      !SHA256_PATTERN.test(record?.sha256 ?? "") ||
      !Number.isInteger(record?.bytes) ||
      record.bytes < 1 ||
      record?.png_dimensions?.width !== viewport.width ||
      record?.png_dimensions?.height !== viewport.height ||
      record?.network_requests !== 0 ||
      !Array.isArray(record?.console_errors) ||
      record.console_errors.length !== 0 ||
      !Array.isArray(record?.page_errors) ||
      record.page_errors.length !== 0
    ) {
      throw new Error(`${viewport.id}/${state.id}: дочерний захват не подтвердил канонический PNG`);
    }
    if (viewport.id === "desktop-1280x720") {
      try {
        validateRasterSourceParityResult(record.source_parity, state.visual_binding);
      } catch (error) {
        throw new Error(`${viewport.id}/${state.id}: ${error instanceof Error ? error.message : "source parity не подтверждён"}`);
      }
    } else if (record.source_parity !== null) {
      throw new Error(`${viewport.id}/${state.id}: source parity должен фиксироваться только в natural desktop capture`);
    }
  }
}

function writeCanonicalPng(outputRoot, packageRelativePath, record, bytes) {
  const target = resolveWithin(
    outputRoot,
    path.posix.join(packageRelativePath, record.path),
    "канонический PNG",
  );
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, bytes, { flag: "wx" });
}

export function captureCanonicalRasterSet({
  sourceRoot,
  diagnosticRoot = sourceRoot,
  outputRoot,
  packageRelativePath,
  captureScriptPath,
  demoPath,
  states,
  captureStabilization,
  rendererProfilePolicy,
  captureTransport,
  candidateFingerprint,
  diagnosticRelativePath = CANONICAL_RASTER_DIAGNOSTIC_RELATIVE_PATH,
}) {
  validateCaptureStates(states);
  if (!SHA256_PATTERN.test(candidateFingerprint?.sha256 ?? "")) {
    throw new Error("канонический захват не получил SHA-256 кандидата");
  }
  if (!hasCanonicalCaptureToolWarnings(rendererProfilePolicy?.capture_tool_warnings)) {
    throw new Error("канонический захват не получил договорное предупреждение Playwright CSP");
  }
  if (!path.isAbsolute(captureScriptPath) || !path.isAbsolute(demoPath)) {
    throw new Error("канонический захват требует абсолютные пути внутреннего вызова");
  }
  const captureStates = readVisualCaptureStates({ sourceRoot, packageRelativePath, states });
  const resolvedDiagnosticRoot = resolveDiagnosticRoot(diagnosticRoot);
  const captureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-canonical-raster-"));
  const captureRecords = [];
  const profileRecords = [];
  const childReports = new Map();
  try {
    for (const viewport of CANONICAL_RASTER_VIEWPORTS) {
      for (let run = 1; run <= CANONICAL_RASTER_CANDIDATE_COUNT; run += 1) {
        const runRoot = path.join(captureRoot, `run-${run}`, viewport.id);
        const requestPath = path.join(runRoot, "request.json");
        const reportPath = path.join(runRoot, "report.json");
        const frameDirectory = path.join(runRoot, "frames");
        fs.mkdirSync(runRoot, { recursive: true });
        const request = {
          version: CANONICAL_RASTER_VERSION,
          run,
          capture_engine: "webkit",
          candidate_fingerprint: candidateFingerprint,
          demo_path: demoPath,
          output_directory: frameDirectory,
          viewport,
          capture_stabilization: captureStabilization,
          renderer_profile_policy: rendererProfilePolicy,
          capture_transport: captureTransport,
          active_state_ids: captureStates.map((state) => state.id),
          states: captureStates,
          source_parity_required: viewport.id === "desktop-1280x720",
        };
        fs.writeFileSync(requestPath, stableCanonicalRasterJson(request), { flag: "wx" });
        const result = spawnSync(process.execPath, [captureScriptPath, requestPath, reportPath], {
          encoding: "utf8",
          timeout: 120_000,
          maxBuffer: 2 * 1024 * 1024,
        });
        if (result.error || result.status !== 0 || result.signal || !fs.existsSync(reportPath)) {
          const failure = fs.existsSync(reportPath)
            ? failedChildCaptureSummary(reportPath)
            : null;
          captureRecords.push({
            run,
            viewport: viewport.id,
            status: "failed",
            error: result.stderr || result.stdout || result.error?.message || result.signal || "отчёт отсутствует",
            ...(failure ? { failure } : {}),
          });
          writeDiagnosticBundle({
            root: resolvedDiagnosticRoot,
            diagnosticRelativePath,
            captureRoot,
            candidateFingerprint,
            captureRecords,
            reason: `${viewport.id}: дочерний захват не выполнен`,
          });
          throw new Error(`${viewport.id}: канонический дочерний захват не выполнен`);
        }
        const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
        validateChildReport(report, { candidateFingerprint, viewport, states: captureStates, run });
        childReports.set(`${run}\u0000${viewport.id}`, report);
        profileRecords.push(report.renderer_profile);
        captureRecords.push({
          run,
          viewport: viewport.id,
          status: "captured",
          records: report.records.map((record) => ({
            state_id: record.state_id,
            sha256: record.sha256,
            bytes: record.bytes,
          })),
        });
      }
    }
    const firstProfile = stableCanonicalRasterJson(profileRecords[0]);
    if (profileRecords.some((profile) => stableCanonicalRasterJson(profile) !== firstProfile)) {
      writeDiagnosticBundle({
        root: resolvedDiagnosticRoot,
        diagnosticRelativePath,
        captureRoot,
        candidateFingerprint,
        captureRecords,
        reason: "профиль рендерера различается между независимыми запусками",
      });
      throw new Error("канонический захват получил разные профили рендерера");
    }

    const publishedRecords = [];
    const frames = new Map();
    for (const viewport of CANONICAL_RASTER_VIEWPORTS) {
      for (const state of captureStates) {
        const runs = [];
        const buffers = [];
        for (let run = 1; run <= CANONICAL_RASTER_CANDIDATE_COUNT; run += 1) {
          const framePath = path.join(captureRoot, `run-${run}`, viewport.id, "frames", `${state.id}.png`);
          const bytes = fs.readFileSync(framePath);
          const dimensions = canonicalRasterPngDimensions(bytes, `${viewport.id}/${state.id}`);
          if (dimensions.width !== viewport.width || dimensions.height !== viewport.height) {
            throw new Error(`${viewport.id}/${state.id}: PNG имеет неверный размер`);
          }
          const sha256 = canonicalRasterSha256(bytes);
          runs.push({ run, sha256, bytes: bytes.length });
          buffers.push(bytes);
        }
        if (!buffers.every((bytes) => bytes.equals(buffers[0]))) {
          writeDiagnosticBundle({
            root: resolvedDiagnosticRoot,
            diagnosticRelativePath,
            captureRoot,
            candidateFingerprint,
            captureRecords,
            reason: `${viewport.id}/${state.id}: три независимых PNG не совпадают побайтно`,
          });
          throw new Error(`${viewport.id}/${state.id}: три независимых PNG не совпадают побайтно`);
        }
        const parityReports = viewport.id === "desktop-1280x720"
          ? Array.from({ length: CANONICAL_RASTER_CANDIDATE_COUNT }, (_, index) =>
            childReports.get(`${index + 1}\u0000${viewport.id}`)?.records.find((record) => record.state_id === state.id)?.source_parity,
          )
          : null;
        const sourceParity = parityReports
          ? parityReports[0]
          : childReports.get(`1\u0000desktop-1280x720`)?.records.find((record) => record.state_id === state.id)?.source_parity;
        if (!sourceParity) {
          throw new Error(`${viewport.id}/${state.id}: отсутствует source parity natural desktop capture`);
        }
        if (parityReports && parityReports.some((value) => stableCanonicalRasterJson(value) !== stableCanonicalRasterJson(sourceParity))) {
          writeDiagnosticBundle({
            root: resolvedDiagnosticRoot,
            diagnosticRelativePath,
            captureRoot,
            candidateFingerprint,
            captureRecords,
            reason: `${viewport.id}/${state.id}: source parity различается между независимыми запусками`,
          });
          throw new Error(`${viewport.id}/${state.id}: source parity различается между независимыми запусками`);
        }
        validateRasterSourceParityResult(sourceParity, state.visual_binding);
        const pathName = canonicalRasterPath(viewport.id, state.id);
        const record = {
          browser: "webkit",
          viewport: viewport.id,
          state_id: state.id,
          path: pathName,
          sha256: runs[0].sha256,
          bytes: runs[0].bytes,
          png_dimensions: { width: viewport.width, height: viewport.height },
          runs,
          source_parity: sourceParity,
        };
        publishedRecords.push(record);
        frames.set(pathName, buffers[0]);
      }
    }
    const manifest = buildCanonicalRasterManifest({
      candidateFingerprint,
      rendererProfile: profileRecords[0],
      records: publishedRecords,
    });
    for (const record of manifest.records) writeCanonicalPng(outputRoot, packageRelativePath, record, frames.get(record.path));
    clearDiagnosticBundle(resolvedDiagnosticRoot, diagnosticRelativePath);
    return { manifest, frames, records: manifest.records };
  } finally {
    fs.rmSync(captureRoot, { recursive: true, force: true, maxRetries: 3 });
  }
}
