import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const manifestPath = "artifacts/examples/renderer-regression-manifest.json";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function sha256File(relativePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relativePath))).digest("hex");
}

function fileSize(relativePath) {
  return fs.statSync(path.join(root, relativePath)).size;
}

function writeJson(relativePath, value) {
  fs.mkdirSync(path.dirname(path.join(root, relativePath)), { recursive: true });
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

const renderResult = readJson("artifacts/examples/render-result-minimal.json");
const exportSmoke = readJson("artifacts/examples/export-smoke-manifest.json");
const htmlOutput = renderResult.outputs.find((output) => output.format === "html");
const pdfOutput = exportSmoke.outputs.find((output) => output.format === "pdf");
const pngOutput = exportSmoke.outputs.find((output) => output.format === "png");

if (!htmlOutput || !pdfOutput || !pngOutput) {
  console.error("ERROR: renderer regression requires html, pdf and png outputs");
  process.exit(1);
}

const manifest = {
  version: "0.1.0",
  status: "generated",
  source_paths: [
    "tests/golden/presentation-spec-minimal.json",
    "artifacts/examples/render-result-minimal.json",
    "artifacts/examples/export-smoke-manifest.json"
  ],
  cases: [
    {
      id: "RREG-HTML-001",
      format: "html",
      path: htmlOutput.path,
      sha256: sha256File(htmlOutput.path),
      min_bytes: 500,
      assertions: [
        "starts_with_doctype",
        "contains_data_source_spec_id",
        "contains_slide_id",
        "contains_fact_trace"
      ]
    },
    {
      id: "RREG-PDF-001",
      format: "pdf",
      path: pdfOutput.path,
      sha256: sha256File(pdfOutput.path),
      min_bytes: Math.min(fileSize(pdfOutput.path), 300),
      assertions: [
        "starts_with_pdf_signature",
        "hash_matches_export_smoke_manifest",
        "non_empty_binary"
      ]
    },
    {
      id: "RREG-PNG-001",
      format: "png",
      path: pngOutput.path,
      sha256: sha256File(pngOutput.path),
      min_bytes: Math.min(fileSize(pngOutput.path), 50),
      assertions: [
        "starts_with_png_signature",
        "hash_matches_export_smoke_manifest",
        "non_empty_binary"
      ]
    }
  ],
  required_gates: [
    "npm run validate:visual",
    "npm run validate:export",
    "npm run validate:export-smoke",
    "npm run validate:renderer-regression"
  ],
  known_limitations: [
    "Regression pack проверяет deterministic fixture outputs, а не full browser rendering всех будущих layouts.",
    "PDF/PNG остаются smoke fixtures до подключения полноценного renderer engine.",
    "Real user UAT остается отдельным gate."
  ],
  next_safe_step: "После real UAT расширить renderer regression на exported state и пользовательский сценарий review/export."
};

writeJson(manifestPath, manifest);
console.log(`renderer regression manifest written: ${manifestPath}`);
