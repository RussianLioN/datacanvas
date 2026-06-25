import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import zlib from "node:zlib";

const root = process.cwd();
const sourceHtmlPath = "artifacts/examples/presentation-minimal.html";
const pdfPath = "artifacts/examples/presentation-smoke.pdf";
const pngPath = "artifacts/examples/presentation-smoke.png";
const manifestPath = "artifacts/examples/export-smoke-manifest.json";

function ensureDir(relativePath) {
  fs.mkdirSync(path.dirname(path.join(root, relativePath)), { recursive: true });
}

function sha256File(relativePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relativePath))).digest("hex");
}

function writeFile(relativePath, content) {
  ensureDir(relativePath);
  fs.writeFileSync(path.join(root, relativePath), content);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([length, typeBytes, data, crc]);
}

function buildRgbaPng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const row = Buffer.from([0, ...rgba]);
  const idat = zlib.deflateSync(row);
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

if (!fs.existsSync(path.join(root, sourceHtmlPath))) {
  console.error(`ERROR: source HTML does not exist: ${sourceHtmlPath}`);
  process.exit(1);
}

const sourceHash = sha256File(sourceHtmlPath);
const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 97 >>
stream
BT
/F1 12 Tf
72 720 Td
(DataCanvas PDF smoke fixture from HTML ${sourceHash.slice(0, 12)}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000204 00000 n
trailer
<< /Root 1 0 R /Size 5 >>
startxref
351
%%EOF
`;

const pngBytes = buildRgbaPng(1, 1, [37, 99, 235, 255]);

writeFile(pdfPath, pdf);
writeFile(pngPath, pngBytes);

const manifest = {
  version: "0.1.0",
  status: "generated",
  source_html_path: sourceHtmlPath,
  outputs: [
    {
      artifact_id: "ART-export-smoke-pdf",
      format: "pdf",
      path: pdfPath,
      sha256: sha256File(pdfPath),
      signature: "%PDF-",
    },
    {
      artifact_id: "ART-export-smoke-png",
      format: "png",
      path: pngPath,
      sha256: sha256File(pngPath),
      signature: "89504e470d0a1a0a",
    },
  ],
  required_gates: [
    "npm run validate:export",
    "npm run validate:visual",
    "npm run validate:export-smoke",
    "npm run validate:export-png-pixel-smoke",
  ],
};

writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`PDF smoke fixture written: ${pdfPath}`);
console.log(`PNG smoke fixture written: ${pngPath}`);
console.log(`export smoke manifest written: ${manifestPath}`);
