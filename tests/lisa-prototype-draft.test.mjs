import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const draftRoot = `${packagePath}/candidate-evidence/prototype-draft`;

test("черновой прототип сохраняет оболочку и навигацию действующего прототипа при замене только кадров", () => {
  const manifestPath = path.join(root, draftRoot, "manifest.json");
  const htmlPath = path.join(root, draftRoot, "index.html");
  const appPath = path.join(root, draftRoot, "app.js");
  const dataPath = path.join(root, draftRoot, "data.js");
  const stylesPath = path.join(root, draftRoot, "styles.css");
  const activeDemoRoot = path.join(root, packagePath, "demo");
  assert.equal(fs.existsSync(manifestPath), true, "нужен манифест изолированного чернового прототипа");
  assert.equal(fs.existsSync(htmlPath), true, "нужна открываемая страница чернового прототипа");
  assert.equal(fs.existsSync(appPath), true, "нужен сценарий прежней оболочки прототипа");
  assert.equal(fs.existsSync(dataPath), true, "нужны данные заменённых кадров");
  assert.equal(fs.existsSync(stylesPath), true, "нужны стили прежней оболочки прототипа");

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.$schema, "../../source/schemas/lisa-prototype-draft-manifest.schema.json");
  assert.equal(manifest.rendering_mode, "isolated_current_prototype_copy_with_frame_asset_substitution");
  assert.deepEqual(manifest.shell_parity, {
    index_html_source: "demo/index.html",
    app_js_source: "demo/app.js",
    styles_css_source: "demo/styles.css",
    navigation_model: "previous_prototype_state_and_document_navigation",
  });
  assert.equal(manifest.active_release_mutation_prohibited, true);
  assert.equal(manifest.raw_pdf_included, false);
  assert.deepEqual(manifest.frame_ids, [
    "lisa-materials-full-reference",
    "lisa-presentation-generating",
    "lisa-presentation-chat-list",
    "lisa-presentation-sent",
    "lisa-presentation-email",
    "lisa-presentation-slidedoc",
    "lisa-presentation-sber2025",
    "lisa-presentation-mag",
    "lisa-order-not-accepted",
    "lisa-delivery-delayed",
    "lisa-delivery-partial",
  ]);
  assert.equal(manifest.frames.length, 11);
  assert.ok(manifest.frames.every((frame) => typeof frame.asset_sha256 === "string" && /^[a-f0-9]{64}$/u.test(frame.asset_sha256)));
  assert.ok(manifest.frames.every((frame) => frame.asset_paths.every((assetPath) => fs.existsSync(path.join(root, draftRoot, assetPath)))));

  const html = fs.readFileSync(htmlPath, "utf8");
  const activeApp = fs.readFileSync(path.join(activeDemoRoot, "app.js"), "utf8");
  const activeStyles = fs.readFileSync(path.join(activeDemoRoot, "styles.css"), "utf8");
  assert.equal(fs.readFileSync(appPath, "utf8"), activeApp, "сценарий навигации должен быть точной копией действующего прототипа");
  assert.equal(fs.readFileSync(stylesPath, "utf8"), activeStyles, "оформление должно быть точной копией действующего прототипа");
  assert.match(html, /data-testid="service-panel"/u);
  assert.match(html, /data-testid="previous-state"/u);
  assert.match(html, /data-testid="next-state"/u);
  assert.match(html, /id="slide-navigation"/u);
  assert.match(html, /data-testid="prototype-root"/u);
  assert.doesNotMatch(html, /draft-shell|draft-viewer|previous-frame|next-frame/u);
  assert.equal(html, fs.readFileSync(path.join(activeDemoRoot, "index.html"), "utf8"), "страница должна быть точной копией действующего прототипа");
  assert.doesNotMatch(html, /(?:\/Users\/|file:\/\/|\.pdf\b|demo\/)/iu);
  const data = fs.readFileSync(dataPath, "utf8");
  for (const frameId of manifest.frame_ids) assert.match(data, new RegExp(frameId, "u"));
});
