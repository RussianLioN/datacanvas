import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const contractPath = `${packagePath}/source/presentation-pdf-raster-import-contract.json`;
const schemaPath = `${packagePath}/source/schemas/presentation-pdf-raster-import-contract.schema.json`;

test("договор импорта презентаций отделяет утверждённый PDF от мобильного SVG-контура", () => {
  assert.equal(fs.existsSync(path.join(root, contractPath)), true, "нужен отдельный договор контролируемого импорта PDF-презентаций");
  assert.equal(fs.existsSync(path.join(root, schemaPath)), true, "для договора PDF-презентаций нужна JSON Schema");

  const contract = JSON.parse(fs.readFileSync(path.join(root, contractPath), "utf8"));
  assert.equal(contract.import_mode, "approved_pdf_to_png");
  assert.equal(contract.source_svg_required, false);
  assert.equal(contract.raw_pdf_committed_to_git, false);
  assert.equal(contract.raw_pdf_served_by_demo, false);
  assert.deepEqual(contract.render_scales, { draft: 1, final: 4 });
  assert.equal(contract.variants.length, 3);
  assert.deepEqual(
    contract.variants.map((variant) => variant.source_file_name),
    ["vodoley_dense_slidedoc.pdf", "vodoley_dense_sber2025.pdf", "vodoley_dense_mag.pdf"],
  );
  assert.ok(contract.variants.every((variant) => variant.page_count === 3 && variant.output_file.startsWith("vodoley-dense-")));
});
