import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import zlib from "node:zlib";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const REVIEW_DIRECTORY = `${PACKAGE_PATH}/candidate-evidence/frame-review/lisa-materials-full-reference`;
const SOURCE_PATH = `${REVIEW_DIRECTORY}/source.svg`;
const MANIFEST_PATH = `${REVIEW_DIRECTORY}/review-source-manifest.json`;
const DRAFT_PATH = `${REVIEW_DIRECTORY}/draft-current-resolution.png`;
const PNG_SIGNATURE = Buffer.from("89504e470d0a1a0a", "hex");

function fail(message) {
  throw new Error(message);
}

function sha256(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function regularFile(filePath, label) {
  const stat = fs.lstatSync(filePath);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label} должен быть обычным файлом`);
}

function svgDimensions(svg) {
  const width = svg.match(/<svg\b[^>]*\bwidth="(\d+)\.000000"/u);
  const height = svg.match(/<svg\b[^>]*\bheight="(\d+)\.000000"/u);
  if (!width || !height) fail("SVG-источник не содержит целые размеры холста");
  return { width: Number(width[1]), height: Number(height[1]) };
}

function rendererCommand() {
  const candidates = ["/opt/homebrew/bin/rsvg-convert", "/usr/local/bin/rsvg-convert", "/usr/bin/rsvg-convert", "rsvg-convert"];
  for (const candidate of candidates) {
    const result = spawnSync(candidate, ["--version"], { encoding: "utf8" });
    if (result.status === 0) return candidate;
  }
  fail("не найден rsvg-convert для изолированного чернового PNG");
}

function unfilter(bytes, width, height, bytesPerPixel) {
  const stride = width * bytesPerPixel;
  const expected = height * (stride + 1);
  if (bytes.length !== expected) fail("PNG содержит неверный размер несжатых строк");
  const output = Buffer.alloc(height * stride);
  for (let row = 0; row < height; row += 1) {
    const filter = bytes[row * (stride + 1)];
    const rowStart = row * (stride + 1) + 1;
    const targetStart = row * stride;
    for (let column = 0; column < stride; column += 1) {
      const value = bytes[rowStart + column];
      const left = column >= bytesPerPixel ? output[targetStart + column - bytesPerPixel] : 0;
      const up = row > 0 ? output[targetStart - stride + column] : 0;
      const upLeft = row > 0 && column >= bytesPerPixel ? output[targetStart - stride + column - bytesPerPixel] : 0;
      let restored;
      if (filter === 0) restored = value;
      else if (filter === 1) restored = (value + left) & 0xff;
      else if (filter === 2) restored = (value + up) & 0xff;
      else if (filter === 3) restored = (value + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) {
        const predictor = left + up - upLeft;
        const leftDistance = Math.abs(predictor - left);
        const upDistance = Math.abs(predictor - up);
        const upLeftDistance = Math.abs(predictor - upLeft);
        const nearest = leftDistance <= upDistance && leftDistance <= upLeftDistance ? left : upDistance <= upLeftDistance ? up : upLeft;
        restored = (value + nearest) & 0xff;
      } else fail("PNG использует неподдерживаемый фильтр строки");
      output[targetStart + column] = restored;
    }
  }
  return output;
}

function inspectPng(filePath, expectedDimensions) {
  regularFile(filePath, "Черновой PNG");
  const png = fs.readFileSync(filePath);
  if (!png.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) fail("Черновой файл не является PNG");
  let offset = PNG_SIGNATURE.length;
  let width = 0;
  let height = 0;
  let colorType = -1;
  const idat = [];
  while (offset < png.length) {
    if (offset + 12 > png.length) fail("PNG обрезан");
    const length = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString("ascii");
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > png.length) fail("PNG содержит повреждённый блок");
    const data = png.subarray(dataStart, dataEnd);
    if (type === "IHDR") {
      if (length !== 13 || width || height) fail("PNG содержит некорректный заголовок");
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || ![2, 6].includes(data[9]) || data[10] !== 0 || data[11] !== 0 || data[12] !== 0) {
        fail("PNG использует неподдерживаемый формат");
      }
      colorType = data[9];
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    offset = dataEnd + 4;
  }
  if (width !== expectedDimensions.width || height !== expectedDimensions.height) {
    fail(`Черновой PNG имеет неверные размеры ${width}×${height}; ожидается ${expectedDimensions.width}×${expectedDimensions.height}`);
  }
  if (!idat.length) fail("PNG не содержит растровых данных");
  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const pixels = unfilter(zlib.inflateSync(Buffer.concat(idat)), width, height, bytesPerPixel);
  let nonWhitePixels = 0;
  for (let offset = 0; offset < pixels.length; offset += bytesPerPixel) {
    if (pixels[offset] < 248 || pixels[offset + 1] < 248 || pixels[offset + 2] < 248) nonWhitePixels += 1;
  }
  if (nonWhitePixels < 1_000) fail("Черновой PNG почти пустой: недостаточно видимых пикселей");
  return { width, height, non_white_pixel_count: nonWhitePixels };
}

function verifySource(source) {
  if (/id="lisa-edit-/u.test(source)) fail("SVG-источник содержит запрещённую историческую накладку");
  if (/<text\b/u.test(source)) fail("SVG-источник содержит самостоятельный текстовый слой вместо контуров");
  if (!source.includes('id="Group 2131328969"') || !source.includes('id="button_footer_2.0"')) {
    fail("SVG-источник не сохранил существующие группы справки и нижней кнопки");
  }
}

function renderDraft({ root = process.cwd(), check = false } = {}) {
  const sourcePath = path.join(root, SOURCE_PATH);
  const manifestPath = path.join(root, MANIFEST_PATH);
  const draftPath = path.join(root, DRAFT_PATH);
  regularFile(sourcePath, "SVG-источник");
  regularFile(manifestPath, "Манифест проверочного кадра");
  const source = fs.readFileSync(sourcePath, "utf8");
  verifySource(source);
  const dimensions = svgDimensions(source);
  const manifest = readJson(manifestPath);
  if (manifest.source_svg_sha256 !== sha256(sourcePath)) fail("Манифест не соответствует текущему SVG-источнику");

  if (check) {
    if (manifest.status !== "draft_png_rendered_pending_owner_approval" || manifest.draft_png_rendered !== true) {
      fail("черновой PNG ещё не подготовлен для приёмки владельцем");
    }
    const inspected = inspectPng(draftPath, dimensions);
    if (
      manifest.draft_png_sha256 !== sha256(draftPath) ||
      JSON.stringify(manifest.draft_png_dimensions) !== JSON.stringify({ width: inspected.width, height: inspected.height }) ||
      manifest.draft_png_non_white_pixel_count !== inspected.non_white_pixel_count
    ) {
      fail("манифест не соответствует сохранённому черновому PNG");
    }
    return manifest;
  }

  if (manifest.status !== "svg_source_prepared_pending_visual_check" || manifest.draft_png_rendered !== false) {
    fail("подготовка черновика допускается только после отдельной проверки SVG и до приёмки владельцем");
  }
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "lisa-full-reference-draft-"));
  const temporaryPng = path.join(tempDirectory, "draft.png");
  try {
    const result = spawnSync(rendererCommand(), [sourcePath, "--output", temporaryPng], { encoding: "utf8" });
    if (result.status !== 0) fail(`rsvg-convert не создал черновой PNG: ${(result.stderr || result.stdout || "неизвестная ошибка").trim()}`);
    const inspected = inspectPng(temporaryPng, dimensions);
    fs.renameSync(temporaryPng, draftPath);
    const updated = {
      ...manifest,
      status: "draft_png_rendered_pending_owner_approval",
      draft_png_rendered: true,
      draft_png_path: "candidate-evidence/frame-review/lisa-materials-full-reference/draft-current-resolution.png",
      draft_png_sha256: sha256(draftPath),
      draft_png_dimensions: { width: inspected.width, height: inspected.height },
      draft_png_non_white_pixel_count: inspected.non_white_pixel_count,
    };
    writeJson(manifestPath, updated);
    return updated;
  } finally {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  try {
    const check = process.argv.slice(2).includes("--check");
    if (process.argv.slice(2).some((argument) => argument !== "--check")) fail("использование: node scripts/render-lisa-full-reference-review-draft.mjs [--check]");
    const manifest = renderDraft({ check });
    process.stdout.write(check
      ? `Черновой PNG проверочного кадра актуален: ${manifest.draft_png_path}\n`
      : `Черновой PNG проверочного кадра подготовлен: ${manifest.draft_png_path}\n`);
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "черновой PNG не подготовлен"}\n`);
    process.exitCode = 1;
  }
}

export { inspectPng, renderDraft };
