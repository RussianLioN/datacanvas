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
  assert.deepEqual(contract.draft_prototype_integration, {
    rendering_mode: "isolated_current_prototype_copy_with_frame_asset_substitution",
    runtime_shell_source_path: "demo",
    allowed_runtime_differences: ["data.js", "app.js", "assets/**"],
    candidate_runtime_extension: {
      id: "data_driven_initial_phone_scroll",
      target_file: "app.js",
      state_property: "initial_scroll_position",
      allowed_values: ["top", "bottom"],
      bottom_frame_ids: [
        "lisa-presentation-generating",
        "lisa-presentation-sent",
        "lisa-order-not-accepted",
        "lisa-delivery-delayed",
        "lisa-delivery-partial",
      ],
      effect: "standard_phone_scroller_initial_position_only",
    },
    presentation_viewport: { width: 960, height: 540 },
    draft_source_raster_scale: 1,
    historical_display_raster_scale: 4,
    active_release_mutation_prohibited: true,
  });
  assert.equal(contract.variants.length, 3);
  assert.deepEqual(
    contract.variants.map((variant) => variant.source_file_name),
    ["vodoley_dense_slidedoc.pdf", "vodoley_dense_sber2025.pdf", "vodoley_dense_mag.pdf"],
  );
  assert.ok(contract.variants.every((variant) => variant.page_count === 3 && variant.output_file.startsWith("vodoley-dense-")));
});

test("предварительное согласование владельца разрешает сразу подготовить все три PNG-черновика", () => {
  const contract = JSON.parse(fs.readFileSync(path.join(root, contractPath), "utf8"));
  assert.equal(contract.status, "all_presentation_drafts_authorized");
  assert.equal(contract.per_frame_review.batch_draft_preparation_authorized_by_owner, true);
  assert.equal(contract.per_frame_review.next_variant_blocked_until_owner_approval, false);
  assert.deepEqual(
    contract.variants.map((variant) => variant.review_status),
    [
      "draft_png_rendered_pending_owner_approval",
      "draft_png_rendered_pending_owner_approval",
      "draft_png_rendered_pending_owner_approval",
    ],
  );
});
