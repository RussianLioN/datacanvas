import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const rejectedReviewDirectory = `${packagePath}/candidate-evidence/frame-review/lisa-presentation-slidedoc`;
const rejectedSourcePath = `${rejectedReviewDirectory}/source.svg`;
const rejectedManifestPath = `${rejectedReviewDirectory}/review-source-manifest.json`;
const mapPath = `${packagePath}/source/lisa-presentation-slidedoc-content-map.json`;
const pipelinePath = `${packagePath}/source/canonical-svg-frame-pipeline-contract.json`;
const pdfContractPath = `${packagePath}/source/presentation-pdf-raster-import-contract.json`;

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

test("отклонённый SVG-кандидат SlideDoc сохранён как RCA-свидетельство, но не является источником выпуска", () => {
  assert.equal(fs.existsSync(path.join(root, rejectedSourcePath)), true, "исходный неудачный SVG нужен для разбора причины");
  assert.equal(fs.existsSync(path.join(root, rejectedManifestPath)), true, "манифест неудачного SVG нужен для разбора причины");

  const map = readJson(mapPath);
  const pipeline = readJson(pipelinePath);
  const pdfContract = readJson(pdfContractPath);

  assert.equal(map.status, "rejected_superseded_by_pdf_to_png_import");
  assert.equal(map.superseded_by_contract_path, "source/presentation-pdf-raster-import-contract.json");
  assert.equal(pdfContract.import_mode, "approved_pdf_to_png");
  assert.equal(pdfContract.source_svg_required, false);
  assert.equal(pipeline.frame_review_session.source_pdf_file_name, "vodoley_dense_slidedoc.pdf");
  assert.equal("source_svg_path" in pipeline.frame_review_session, false);
  assert.equal(pipeline.frame_review_session.draft_png_path.includes("slidedoc-pdf-import"), true);
});

test("новый путь SlideDoc не разрешает подготовку SVG поверх готового PDF", () => {
  const pipeline = readJson(pipelinePath);
  const frame = pipeline.frame_svg_sources.find((item) => item.frame_id === "lisa-presentation-slidedoc");
  assert.deepEqual(frame, {
    frame_id: "lisa-presentation-slidedoc",
    svg_editing_mode: "approved_pdf_to_png",
    canonical_svg_status: "not_applicable",
    approved_text_status: "not_applicable",
    svg_visual_check_status: "not_applicable",
    draft_png_status: "rendered_current_resolution",
    owner_frame_approval_status: "pending",
  });
});
