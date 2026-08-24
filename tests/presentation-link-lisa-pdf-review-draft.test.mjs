import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";

const root = path.resolve(import.meta.dirname, "..");
const rendererPath = path.join(root, "scripts/render-lisa-presentation-pdf-review-draft.mjs");

test("черновой SlideDoc импортируется из утверждённого PDF без SVG-перекомпоновки", async () => {
  assert.equal(
    fs.existsSync(rendererPath),
    true,
    "нужен отдельный штатный рендерёр чернового PNG из PDF ООО «Водолей Трейд»",
  );

  const { PRESENTATION_PDF_REVIEW_SPECS, resolvePresentationPdfReviewSpec } = await import("../scripts/render-lisa-presentation-pdf-review-draft.mjs");
  const source = resolvePresentationPdfReviewSpec("lisa-presentation-slidedoc");

  assert.deepEqual(source, PRESENTATION_PDF_REVIEW_SPECS[0]);
  assert.equal(source.source_file_name, "vodoley_dense_slidedoc.pdf");
  assert.equal(source.source_pdf_sha256, "52f0194ff2f4fd10066925bf4d488e12e8f194cdae465e5075a4ec3a7dd92425");
  assert.equal(source.source_svg_required, false);
  assert.equal(source.import_mode, "approved_pdf_to_png");
  assert.equal(source.draft_scale, 1);
  assert.equal(source.draft_png_path, "candidate-evidence/frame-review/lisa-presentation-slidedoc-pdf-import/draft-current-resolution.png");
});

test("манифест PDF-черновика хранит хэш байтов PNG, а не строку пути", () => {
  const packagePath = path.join(root, "docs/product/analysis/presentation-link-lisa-user-journey");
  const manifestPath = path.join(packagePath, "candidate-evidence/frame-review/lisa-presentation-slidedoc-pdf-import/review-source-manifest.json");
  const pngPath = path.join(packagePath, "candidate-evidence/frame-review/lisa-presentation-slidedoc-pdf-import/draft-current-resolution.png");
  if (!fs.existsSync(manifestPath) || !fs.existsSync(pngPath)) return;

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const actualHash = createHash("sha256").update(fs.readFileSync(pngPath)).digest("hex");
  assert.equal(manifest.draft_png_sha256, actualHash);
});

test("схема манифеста PDF-черновика компилируется в строгом режиме", () => {
  const schemaPath = path.join(root, "docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/lisa-presentation-pdf-review-manifest.schema.json");
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  assert.doesNotThrow(() => new Ajv2020({ allErrors: true, strict: true }).compile(schema));
});
