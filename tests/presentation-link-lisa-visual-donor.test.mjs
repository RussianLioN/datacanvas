import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { deflateRawSync } from "node:zlib";

import {
  DEFAULT_OUTPUT_RELATIVE_PATH,
  importVisualDonor,
  inspectPng,
  VISUAL_DONOR_USAGE,
} from "../scripts/import-presentation-link-lisa-visual-donor.mjs";

const ZIP_LOCAL = 0x04034b50;
const ZIP_CENTRAL = 0x02014b50;
const ZIP_END = 0x06054b50;
const ZIP_DESCRIPTOR = 0x08074b50;
const ZIP_UTF8_AND_DESCRIPTOR_FLAGS = 0x0808;
const ZIP_DEFLATE_METHOD = 8;

const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function createDeflatedZip(name, content) {
  const nameBytes = Buffer.from(name, "utf8");
  const compressed = deflateRawSync(content);
  const checksum = crc32(content);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(ZIP_LOCAL, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(ZIP_UTF8_AND_DESCRIPTOR_FLAGS, 6);
  local.writeUInt16LE(ZIP_DEFLATE_METHOD, 8);
  local.writeUInt16LE(nameBytes.length, 26);

  const descriptor = Buffer.alloc(16);
  descriptor.writeUInt32LE(ZIP_DESCRIPTOR, 0);
  descriptor.writeUInt32LE(checksum, 4);
  descriptor.writeUInt32LE(compressed.length, 8);
  descriptor.writeUInt32LE(content.length, 12);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(ZIP_CENTRAL, 0);
  central.writeUInt16LE(0x0314, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(ZIP_UTF8_AND_DESCRIPTOR_FLAGS, 8);
  central.writeUInt16LE(ZIP_DEFLATE_METHOD, 10);
  central.writeUInt32LE(checksum, 16);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(content.length, 24);
  central.writeUInt16LE(nameBytes.length, 28);
  central.writeUInt32LE(0o100644 * 0x10000, 38);

  const centralBytes = Buffer.concat([central, nameBytes]);
  const localBytes = Buffer.concat([local, nameBytes, compressed, descriptor]);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(ZIP_END, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(centralBytes.length, 12);
  end.writeUInt32LE(localBytes.length, 16);
  return Buffer.concat([localBytes, centralBytes, end]);
}

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-visual-donor-"));
}

function writeDonorZip(root, name, svg) {
  const archivePath = path.join(root, "donor.zip");
  fs.writeFileSync(archivePath, createDeflatedZip(name, Buffer.from(svg, "utf8")));
  return archivePath;
}

const SAFE_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">',
  '  <defs><linearGradient id="fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ff8a3d"/></linearGradient></defs>',
  '  <rect width="390" height="844" fill="url(#fill)"/>',
  '  <path d="M40 40h310v160H40z" fill="#201f25"/>',
  "</svg>",
].join("\n");

test("импортёр принимает сжатый SVG-донор и публикует только PNG без метаданных", () => {
  const root = makeTempRoot();
  try {
    const archivePath = writeDonorZip(root, "safe.svg", SAFE_SVG);
    const result = importVisualDonor({
      root,
      zipPath: archivePath,
      memberName: "safe.svg",
    });

    const outputPath = path.join(root, DEFAULT_OUTPUT_RELATIVE_PATH);
    const outputBytes = fs.readFileSync(outputPath);
    assert.deepEqual(result, {
      archive_sha256: crypto.createHash("sha256").update(fs.readFileSync(archivePath)).digest("hex"),
      member_name: "safe.svg",
      member_sha256: crypto.createHash("sha256").update(Buffer.from(SAFE_SVG, "utf8")).digest("hex"),
      output_path: DEFAULT_OUTPUT_RELATIVE_PATH,
      png_dimensions: { width: 390, height: 844 },
      png_sha256: crypto.createHash("sha256").update(outputBytes).digest("hex"),
      renderer: "rsvg-convert",
      usage: "reference-only",
    });
    assert.equal(VISUAL_DONOR_USAGE, "reference-only");
    assert.match(result.png_sha256, /^[a-f0-9]{64}$/u);
    assert.equal(JSON.stringify(result).includes(root), false);

    assert.equal(fs.existsSync(outputPath), true);
    assert.equal(fs.lstatSync(outputPath).isSymbolicLink(), false);
    const inspected = inspectPng(outputBytes);
    assert.equal(inspected.width, 390);
    assert.equal(inspected.height, 844);
    assert.deepEqual(inspected.chunkTypes, ["IHDR", "IDAT", "IEND"]);
    assert.equal(fs.existsSync(path.join(root, "safe.svg")), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("импортёр блокирует активный и внешний SVG до растеризации", () => {
  const root = makeTempRoot();
  try {
    const unsafeSvg = [
      '<svg xmlns="http://www.w3.org/2000/svg">',
      '  <foreignObject><iframe src="https://example.test/"></iframe></foreignObject>',
      "</svg>",
    ].join("\n");
    const archivePath = writeDonorZip(root, "unsafe.svg", unsafeSvg);
    assert.throws(
      () =>
        importVisualDonor({
          root,
          zipPath: archivePath,
          memberName: "unsafe.svg",
        }),
      /запрещённый элемент SVG/u,
    );
    assert.equal(fs.existsSync(path.join(root, DEFAULT_OUTPUT_RELATIVE_PATH)), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("импортёр блокирует прямую и закодированную внешнюю ссылку SVG", () => {
  const root = makeTempRoot();
  try {
    const directArchive = writeDonorZip(
      root,
      "external.svg",
      '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="url(https://example.test/asset.png)"/></svg>',
    );
    assert.throws(
      () => importVisualDonor({ root, zipPath: directArchive, memberName: "external.svg" }),
      /внешн/u,
    );

    const encodedArchive = writeDonorZip(
      root,
      "encoded.svg",
      '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="u&#x72;l(f&#x69;le&#x3a;///etc/passwd)"/></svg>',
    );
    assert.throws(
      () => importVisualDonor({ root, zipPath: encodedArchive, memberName: "encoded.svg" }),
      /запрещённое кодирование/u,
    );
    assert.equal(fs.existsSync(path.join(root, DEFAULT_OUTPUT_RELATIVE_PATH)), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("импортёр отклоняет имя члена, которое не является одиночным SVG-файлом", () => {
  const root = makeTempRoot();
  try {
    const archivePath = writeDonorZip(root, "safe.svg", SAFE_SVG);
    assert.throws(
      () =>
        importVisualDonor({
          root,
          zipPath: archivePath,
          memberName: "../safe.svg",
        }),
      /имя члена ZIP/u,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
