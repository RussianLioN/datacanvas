import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const mapPath = `${packagePath}/source/lisa-presentation-slidedoc-content-map.json`;
const pipelinePath = `${packagePath}/source/canonical-svg-frame-pipeline-contract.json`;

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

test("SlideDoc получает явную карту разрешённых данных до создания SVG", () => {
  assert.equal(fs.existsSync(path.join(root, mapPath)), true, "до SVG SlideDoc нужна карта разрешённого содержания");
  const map = readJson(mapPath);

  assert.equal(map.frame_id, "lisa-presentation-slidedoc");
  assert.equal(map.visual_donor_id, "presentation_variant_slidedoc_pdf_donor");
  assert.equal(map.visual_reference_only, true);
  assert.equal(map.raw_pdf_direct_render_prohibited, true);
  assert.equal(map.content_source.path, "source/client-reference-data.json");
  assert.deepEqual(map.pages.map((page) => page.covered_group_ids), [
    ["general_information", "business_owners", "financial_indicators"],
    ["cooperation", "sber_share", "active_deals", "potential", "preapproved_offers"],
    ["insights", "meeting_agreements", "dynamic_suggestions", "actions"],
  ]);
  assert.deepEqual(map.readability_policy, {
    draft_page_dimensions: { width: 960, height: 540 },
    minimum_body_font_size_px: 10,
    minimum_table_font_size_px: 10,
    minimum_card_heading_font_size_px: 14,
    minimum_line_height_px: 12,
    all_model_facts_must_remain_visible: true,
    individual_page_pngs_required_for_owner_review: true,
  });
  assert.equal(map.pages.flatMap((page) => page.content_bindings).every((binding) => binding.data_path.startsWith("/data_groups/")), true);
  assert.equal(map.forbidden_donor_content.includes("ГК Достовалова"), true);
  assert.equal(map.allowed_model_fact_exception, "Доставалова Ирина Антоновна");
});

test("договор фиксирует подготовленный SVG-кандидат SlideDoc до покадровой приёмки", () => {
  const contract = readJson(pipelinePath);
  const frame = contract.frame_svg_sources.find((item) => item.frame_id === "lisa-presentation-slidedoc");

  assert.deepEqual(frame, {
    frame_id: "lisa-presentation-slidedoc",
    svg_editing_mode: "new_canonical_svg_composition_from_pdf_visual_reference",
    canonical_svg_status: "prepared_new_canonical_svg_composition",
    approved_text_status: "approved_for_demo_model",
    svg_visual_check_status: "passed",
    draft_png_status: "rendered_current_resolution",
    owner_frame_approval_status: "pending",
  });
  assert.equal(contract.presentation_variant_initial_svg_creation.content_map_path, "source/lisa-presentation-slidedoc-content-map.json");
  assert.equal(contract.presentation_variant_initial_svg_creation.frame_id, "lisa-presentation-slidedoc");
  assert.equal(contract.presentation_variant_initial_svg_creation.initial_svg_editing_mode, "new_canonical_svg_composition_from_pdf_visual_reference");
  assert.equal(contract.presentation_variant_initial_svg_creation.active_release_mutation_prohibited, true);
});

test("проверка карты отклоняет подмену источника данных до SVG и PNG", () => {
  const result = spawnSync(process.execPath, ["scripts/validate-lisa-presentation-slidedoc-content-map.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
