import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
const MAP_PATH = `${PACKAGE_PATH}/source/lisa-presentation-slidedoc-content-map.json`;
const CLIENT_PATH = `${PACKAGE_PATH}/source/client-reference-data.json`;
const DONOR_PATH = `${PACKAGE_PATH}/source/presentation-pdf-donor-register.json`;
const FORBIDDEN_TRACE = /(?:\/Users\/|file:\/\/|<image\b|raw_source_content)/iu;

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function validateMap({ root = process.cwd() } = {}) {
  const map = readJson(root, MAP_PATH);
  const client = readJson(root, CLIENT_PATH);
  const donors = readJson(root, DONOR_PATH);
  const variant = client.coverage.presentation_variants.find((item) => item.variant_id === "slidedoc");
  const donor = donors.donors.find((item) => item.donor_id === "presentation_variant_slidedoc_pdf_donor");

  if (!variant || !donor) throw new Error("не найдена согласованная модель SlideDoc или его визуальный донор");
  if (FORBIDDEN_TRACE.test(JSON.stringify(map))) throw new Error("карта SlideDoc содержит запрещённый исходный след или растровую основу");
  if (
    map.frame_id !== "lisa-presentation-slidedoc" ||
    map.status !== "prepared_for_initial_canonical_svg_composition" ||
    map.visual_donor_id !== donor.donor_id ||
    donor.use !== "visual_reference_only" ||
    map.visual_reference_only !== true ||
    map.raw_pdf_direct_render_prohibited !== true ||
    map.content_source.path !== "source/client-reference-data.json" ||
    map.content_source.status !== client.status ||
    map.content_source.data_mutation_allowed !== false ||
    map.active_release_mutation_prohibited !== true ||
    map.initial_svg_creation_rule !== "new_vector_composition_from_visual_tokens_then_existing_groups_only"
  ) {
    throw new Error("карта SlideDoc должна отделять PDF-оформление от утверждённых данных клиента");
  }
  const policy = map.readability_policy;
  if (
    !policy ||
    policy.draft_page_dimensions?.width !== 960 ||
    policy.draft_page_dimensions?.height !== 540 ||
    policy.minimum_body_font_size_px !== 10 ||
    policy.minimum_table_font_size_px !== 10 ||
    policy.minimum_card_heading_font_size_px !== 14 ||
    policy.minimum_line_height_px !== 12 ||
    policy.all_model_facts_must_remain_visible !== true ||
    policy.individual_page_pngs_required_for_owner_review !== true
  ) {
    throw new Error("карта SlideDoc должна фиксировать проверяемую читаемость и отдельный просмотр трёх страниц");
  }
  if (
    !map.forbidden_donor_content.includes("ГК Достовалова") ||
    !map.forbidden_donor_content.includes("szh-dense-slidedoc-4x.png") ||
    map.allowed_model_fact_exception !== "Доставалова Ирина Антоновна"
  ) {
    throw new Error("карта SlideDoc должна запретить исторический выпуск, не запрещая допустимый факт собственника из модели");
  }

  assert.deepEqual(map.pages.map((page) => page.page), [1, 2, 3], "страницы SlideDoc должны сохранять порядок 1–3");
  assert.deepEqual(map.pages.map((page) => page.covered_group_ids), variant.pages.map((page) => page.covered_group_ids), "группы SlideDoc должны совпадать с моделью клиента");
  for (const page of map.pages) {
    if (page.content_bindings.length !== page.covered_group_ids.length) {
      throw new Error("каждая группа страницы SlideDoc должна иметь явную привязку к модели");
    }
    for (const [index, binding] of page.content_bindings.entries()) {
      const match = /^\/data_groups\/(\d+)$/u.exec(binding.data_path);
      if (!match) throw new Error("привязка SlideDoc должна ссылаться на конкретную группу модели");
      const groupIndex = Number(match[1]);
      const sourceGroup = client.data_groups[groupIndex];
      if (!sourceGroup || sourceGroup.group_id !== binding.group_id || page.covered_group_ids[index] !== binding.group_id) {
        throw new Error("привязка группы SlideDoc не соответствует модели клиента или порядку страницы");
      }
      assert.deepEqual(binding.fact_indexes, sourceGroup.facts.map((_, factIndex) => factIndex), "SlideDoc должен сохранять все факты разрешённой группы без донорских замен");
      if (!binding.svg_group_id.startsWith(`slidedoc-page-${page.page}-`)) {
        throw new Error("идентификатор SVG-группы SlideDoc не соответствует странице");
      }
    }
  }
  return map;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  try {
    if (process.argv.length !== 2) throw new Error("использование: node scripts/validate-lisa-presentation-slidedoc-content-map.mjs");
    validateMap();
    process.stdout.write("Карта разрешённого содержания SlideDoc проверена.\n");
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "карта SlideDoc не прошла проверку"}\n`);
    process.exitCode = 1;
  }
}

export { validateMap };
