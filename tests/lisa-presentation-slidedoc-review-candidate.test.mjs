import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { buildSvg } from "../scripts/prepare-lisa-presentation-slidedoc-review-source.mjs";

const root = path.resolve(import.meta.dirname, "..");
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const reviewDirectory = `${packagePath}/candidate-evidence/frame-review/lisa-presentation-slidedoc`;
const sourcePath = `${reviewDirectory}/source.svg`;
const manifestPath = `${reviewDirectory}/review-source-manifest.json`;
const mapPath = `${packagePath}/source/lisa-presentation-slidedoc-content-map.json`;

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function sha256(relativePath) {
  return createHash("sha256").update(fs.readFileSync(path.join(root, relativePath))).digest("hex");
}

test("черновой SlideDoc — новый SVG из карты данных, а не PDF или исторический PNG", () => {
  assert.equal(fs.existsSync(path.join(root, sourcePath)), true, "для SlideDoc нужен самостоятельный SVG-источник");
  assert.equal(fs.existsSync(path.join(root, manifestPath)), true, "для SlideDoc нужен манифест чернового кадра");

  const source = read(sourcePath);
  const manifest = JSON.parse(read(manifestPath));
  const map = JSON.parse(read(mapPath));

  assert.match(source, /<svg[^>]+viewBox="0 0 960 1620"/u);
  assert.doesNotMatch(source, /<(?:image|foreignObject|script)\b/iu);
  assert.doesNotMatch(source, /(?:vodoley_dense_slidedoc\.pdf|szh-dense-slidedoc-4x\.png|ГК Достовалова|\/Users\/|file:\/\/)/iu);
  assert.match(source, /ООО «Водолей Трейд»/u);
  assert.match(source, /Доставалова Ирина Антоновна/u, "разрешённый факт собственника должен приходить только из модели клиента");
  for (const binding of map.pages.flatMap((page) => page.content_bindings)) {
    assert.match(source, new RegExp(`id="${binding.svg_group_id}"`, "u"));
    assert.match(source, new RegExp(`data-content-path="${binding.data_path}"`, "u"));
  }

  assert.equal(manifest.frame_id, "lisa-presentation-slidedoc");
  assert.equal(manifest.status, "draft_png_rendered_pending_owner_approval");
  assert.equal(manifest.visual_donor_id, "presentation_variant_slidedoc_pdf_donor");
  assert.equal(manifest.visual_reference_only, true);
  assert.equal(manifest.raw_pdf_direct_render_used, false);
  assert.equal(manifest.source_svg_sha256, sha256(sourcePath));
  assert.equal(manifest.content_map_path, "source/lisa-presentation-slidedoc-content-map.json");
  assert.equal(manifest.active_release_mutation_prohibited, true);
  assert.deepEqual(manifest.draft_png_dimensions, { width: 960, height: 1620 });
  assert.deepEqual(manifest.geometry_check.readability_check, {
    minimum_body_font_size_px: 10,
    minimum_table_font_size_px: 10,
    minimum_card_heading_font_size_px: 14,
    minimum_line_height_px: 12,
    below_minimum_font_size_count: 0,
    out_of_card_text_count: 0,
    internal_text_overlap_count: 0,
    page_capacity_violations: 0,
  });
  assert.equal(manifest.draft_page_pngs.length, 3, "для покадровой приёмки нужны три отдельные страницы");
  for (const [index, page] of manifest.draft_page_pngs.entries()) {
    assert.equal(page.page, index + 1);
    assert.deepEqual(page.dimensions, { width: 960, height: 540 });
    assert.equal(fs.existsSync(path.join(root, packagePath, page.path)), true);
  }
  const ordinaryText = [...source.matchAll(/<text\b(?=[^>]*data-text-role="(?:body|table)")[^>]*font-size="([0-9.]+)"/gu)];
  assert.ok(ordinaryText.length > 0, "в SVG должны быть маркированные основной и табличный текст");
  assert.ok(ordinaryText.every((item) => Number(item[1]) >= 10), "основной и табличный текст не может быть мельче 10 px");
  const financeHeading = source.match(/id="slidedoc-page-1-financial-indicators-title"[^>]* y="([0-9.]+)"/u);
  const firstFinanceRow = source.match(/id="slidedoc-page-1-financial-indicators-row-0-1-2"[^>]* y="([0-9.]+)"/u);
  assert.ok(financeHeading && firstFinanceRow, "в SVG должны быть заголовок и первая строка финансовой карточки");
  assert.ok(Number(firstFinanceRow[1]) - Number(financeHeading[1]) >= 20, "первая строка финансовой карточки не должна накладываться на заголовок");
  const client = JSON.parse(read(`${packagePath}/source/client-reference-data.json`));
  for (const group of client.data_groups) {
    for (const fact of group.facts) assert.match(source, new RegExp(fact.value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"), `в SVG отсутствует значение ${fact.label}`);
  }
  assert.equal(manifest.owner_frame_approval, null);
});

test("сохранённый черновой PNG SlideDoc проверяется без доступа к PDF", () => {
  const result = spawnSync(process.execPath, ["scripts/render-lisa-presentation-slidedoc-review-draft.mjs", "--check"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("проверка SVG отклоняет размер основного текста ниже утверждённого минимума", () => {
  const map = JSON.parse(read(mapPath));
  const client = JSON.parse(read(`${packagePath}/source/client-reference-data.json`));
  const stricterMap = structuredClone(map);
  stricterMap.readability_policy.minimum_body_font_size_px = 11;
  const candidate = buildSvg(client, stricterMap);
  assert.ok(candidate.geometry.readability_check.below_minimum_font_size_count > 0);
});
