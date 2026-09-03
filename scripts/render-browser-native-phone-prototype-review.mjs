import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const root = path.resolve(import.meta.dirname, "..");
const packageRoot = path.join(root, "docs/product/analysis/presentation-link-lisa-user-journey");
const sourceRoot = path.join(packageRoot, "source/browser-native-phone-prototype");
const runtimeRoot = path.join(packageRoot, "candidate-evidence/browser-native-phone-prototype");
const contract = JSON.parse(fs.readFileSync(path.join(sourceRoot, "browser-native-phone-prototype-contract.json"), "utf8"));
const requested = process.argv.includes("--state") ? process.argv[process.argv.indexOf("--state") + 1] : contract.draft_review_rendering.first_frame_id;
const check = process.argv.includes("--check");
const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");
const read = (file) => fs.readFileSync(file, "utf8");
const fail = (message) => { throw new Error(`browser-native-phone-prototype review: ${message}`); };
const acceptancePath = path.join(runtimeRoot, "frame-review/acceptance-state.json");
const knownStateIds = new Set([...contract.phone_state_ids, ...contract.external_state_ids]);
function externalAssetPaths(stateId) {
  const paths = contract.external_state_rules[stateId]?.runtime_asset_paths;
  if (!Array.isArray(paths) || paths.length === 0) fail(`${stateId}: договор не задаёт внешние ресурсы`);
  return paths.map((relativePath) => {
    if (typeof relativePath !== "string" || path.isAbsolute(relativePath) || relativePath.includes("\\") || relativePath.split("/").includes("..")) {
      fail(`${stateId}: договор задаёт небезопасный путь внешнего ресурса`);
    }
    const target = path.resolve(runtimeRoot, relativePath);
    if (!target.startsWith(`${runtimeRoot}${path.sep}`)) fail(`${stateId}: внешний ресурс выходит за границу кандидата`);
    return target;
  });
}
const externalAssetBytes = (stateId) => externalAssetPaths(stateId).map((assetPath) => fs.readFileSync(assetPath));
const fingerprintInputs = [
  read(path.join(sourceRoot, "browser-native-phone-prototype-contract.json")),
  read(path.join(sourceRoot, contract.phone_runtime.geometry_provenance_source)),
  read(path.join(runtimeRoot, "index.html")),
  read(path.join(runtimeRoot, "data.js")),
  read(path.join(runtimeRoot, "app.js")),
  read(path.join(runtimeRoot, "styles.css")),
  fs.readFileSync(path.join(runtimeRoot, "assets/NotoSans[wdth,wght].ttf")),
  read(path.join(root, "package-lock.json")),
  read(import.meta.filename),
  read(path.join(sourceRoot, contract.phone_runtime.geometry_source)),
  ...contract.phone_state_ids.map((id) => read(path.join(sourceRoot, "semantic-svgs", `${id}.svg`))),
  ...contract.external_state_ids.flatMap((id) => externalAssetBytes(id)),
];
const fingerprint = sha(Buffer.concat(fingerprintInputs.map((item) => Buffer.isBuffer(item) ? item : Buffer.from(item))));
const reviewRoot = path.join(runtimeRoot, "frame-review", requested, "revisions", fingerprint);
const pngPath = path.join(reviewRoot, "draft-current-resolution.png");
const manifestPath = path.join(reviewRoot, "review-manifest.json");

function pngSize(file) {
  const png = fs.readFileSync(file);
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

function acceptance() {
  return fs.existsSync(acceptancePath)
    ? JSON.parse(read(acceptancePath))
    : {
        status: "geometry_changed_first_frame_required",
        allowed_next_frame_id: contract.draft_review_rendering.first_frame_id,
        accepted_frame_ids: [],
        invalidated_legacy_review_paths: ["candidate-evidence/frame-review/**"],
      };
}

function verifySelection(state) {
  if (!knownStateIds.has(state)) fail(`неизвестный кадр ${state}`);
  if (acceptance().allowed_next_frame_id !== state) fail(`${state}: следующий разрешённый кадр — ${acceptance().allowed_next_frame_id}`);
}

function verifyStoredRevision() {
  if (!fs.existsSync(pngPath) || !fs.existsSync(manifestPath)) fail("актуальный покадровый PNG не подготовлен");
  const manifest = JSON.parse(read(manifestPath));
  const expected = contract.draft_review_rendering.viewport;
  if (
    manifest.status !== "draft_png_rendered_pending_owner_approval"
    || manifest.frame_id !== requested
    || manifest.input_fingerprint !== fingerprint
    || manifest.png_sha256 !== sha(fs.readFileSync(pngPath))
    || JSON.stringify(manifest.png_dimensions) !== JSON.stringify({ width: expected.width, height: expected.height })
    || JSON.stringify(pngSize(pngPath)) !== JSON.stringify(manifest.png_dimensions)
    || !manifest.proof
  ) fail("покадровый PNG устарел или его доказательство неполно");
}

function validateProof(proof, requests, pageErrors, state) {
  if (requests.some((item) => !item.startsWith("file:")) || pageErrors.length) fail("рендер допустил сеть или ошибку страницы");
  if (proof.kind === "phone") {
    const bezelLimit = proof.assembly.width * contract.phone_runtime.geometry.visible_bezel_logical_units_max / contract.phone_runtime.geometry.body_dimensions_mm.width + 1;
    if (
      Math.min(...proof.edge_gaps_css_px) < 3.5
      || proof.active_display.left < proof.assembly.left
      || proof.active_display.right > proof.assembly.right
      || proof.active_display.top < proof.assembly.top
      || proof.active_display.bottom > proof.assembly.bottom
      || Math.max(...proof.visible_bezel_css_px) > bezelLimit
      || proof.content.some((item) => item.width <= 0 || item.font_size <= 0)
      || proof.scroll.overflow_y !== "auto"
      || proof.side_control_count !== 0
      || proof.viewer_shell.document_title !== contract.viewer_shell.document_title
      || proof.viewer_shell.panel_title !== contract.viewer_shell.panel_title
      || proof.viewer_shell.panel_caption !== contract.viewer_shell.phone_state_captions[state.id]
      || proof.viewer_shell.panel_hidden
      || proof.viewer_shell.panel_inert
    ) fail("не пройдена проверка геометрии, текста, прокрутки или боковых элементов");
    return;
  }
  if (proof.kind === "external") {
    const expectedControls = state.contentType === "presentation" ? 4 : 2;
    if (!proof.panel_hidden || proof.external_overlay.control_count !== expectedControls || !proof.image.complete || proof.image.natural_width <= 0 || proof.image.natural_height <= 0 || proof.page !== 0 || proof.viewer_shell.document_title !== contract.viewer_shell.document_title || proof.viewer_shell.panel_title !== contract.viewer_shell.panel_title || proof.viewer_shell.panel_caption || !proof.viewer_shell.panel_hidden || !proof.viewer_shell.panel_inert) fail("не пройдена проверка внешнего кадра, оверлея или изображения");
    return;
  }
  fail("рендер не вернул доказательство типа кадра");
}

async function captureProof(page) {
  return page.evaluate(() => {
    const panel = document.querySelector("#review-panel");
    const viewerTitle = document.querySelector("#viewer-title");
    const viewerSubtitle = document.querySelector("#viewer-subtitle");
    if (!panel || !viewerTitle || !viewerSubtitle) throw new Error("не найдены DOM-узлы оболочки просмотра");
    const viewerShell = {
      document_title: document.title,
      panel_title: viewerTitle.textContent,
      panel_caption: viewerSubtitle.textContent,
      panel_hidden: panel.hidden,
      panel_inert: panel.inert,
    };
    const phone = document.querySelector("[data-testid='phone-assembly']");
    const stage = document.querySelector(".prototype-stage");
    if (phone && stage) {
      const screen = document.querySelector("[data-testid='phone-screen']");
      const scroll = document.querySelector("[data-testid='phone-scroll-region']");
      if (!screen || !scroll) throw new Error("не найдены DOM-узлы телефона");
      const a = phone.getBoundingClientRect();
      const b = stage.getBoundingClientRect();
      const c = screen.getBoundingClientRect();
      const contents = [...scroll.querySelectorAll("[data-dom-id]")].map((node) => {
        const box = node.getBoundingClientRect();
        return { left: box.left, right: box.right, width: box.width, font_size: Number.parseFloat(getComputedStyle(node).fontSize) };
      });
      return {
        kind: "phone",
        stage: { width: b.width, height: b.height },
        assembly: { left: a.left, right: a.right, top: a.top, bottom: a.bottom, width: a.width, height: a.height },
        active_display: { left: c.left, right: c.right, top: c.top, bottom: c.bottom },
        edge_gaps_css_px: [a.left - b.left, b.right - a.right, a.top - b.top, b.bottom - a.bottom],
        visible_bezel_css_px: [c.left - a.left, a.right - c.right, c.top - a.top, a.bottom - c.bottom],
        side_control_count: phone.querySelectorAll("[id^='phone-side-'], [id='phone-silent-switch'], [id='phone-volume-up'], [id='phone-volume-down']").length,
        content: contents,
        scroll: { overflow_y: getComputedStyle(scroll).overflowY, initial_scroll_top: scroll.scrollTop },
        viewer_shell: viewerShell,
      };
    }
    const external = document.querySelector("[data-testid='external-stage']");
    const overlay = document.querySelector("[data-testid='external-overlay']");
    const image = external?.querySelector("img");
    if (!external || !panel || !overlay || !image) throw new Error("не найдены DOM-узлы внешнего кадра");
    return {
      kind: "external",
      panel_hidden: panel.hidden && panel.inert,
      viewer_shell: viewerShell,
      page: Number(external.dataset.page),
      external_overlay: { control_count: overlay.querySelectorAll("button").length },
      image: { complete: image.complete, natural_width: image.naturalWidth, natural_height: image.naturalHeight },
    };
  });
}

async function main() {
  verifySelection(requested);
  if (check) {
    verifyStoredRevision();
    process.stdout.write(`Черновой PNG ${requested} актуален\n`);
    return;
  }

  const state = contract.external_state_ids.includes(requested)
    ? { id: requested, contentType: contract.external_state_rules[requested].content_type }
    : { id: requested, contentType: "phone" };
  const browser = await chromium.launch({ headless: true });
  let context;
  let stagingRoot;
  try {
    const viewport = contract.draft_review_rendering.viewport;
    context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: viewport.device_scale_factor, locale: "ru-RU", offline: true, serviceWorkers: "block" });
    const page = await context.newPage();
    const requests = [];
    const pageErrors = [];
    page.on("request", (request) => requests.push(request.url()));
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const url = pathToFileURL(path.join(runtimeRoot, "index.html"));
    url.searchParams.set("state", requested);
    await page.goto(url.href, { waitUntil: "load" });
    await page.evaluate(async () => { await document.fonts.ready; await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); });
    const proof = await captureProof(page);
    validateProof(proof, requests, pageErrors, state);

    stagingRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-browser-native-review-"));
    const stagingPngPath = path.join(stagingRoot, "draft-current-resolution.png");
    await page.screenshot({ path: stagingPngPath, type: "png" });
    const manifest = {
      version: contract.version,
      status: "draft_png_rendered_pending_owner_approval",
      frame_id: requested,
      input_fingerprint: fingerprint,
      product_text_source: "semantic_svg",
      geometry_source: contract.phone_runtime.geometry_source,
      renderer: "playwright-chromium-review-only",
      png_dimensions: pngSize(stagingPngPath),
      png_sha256: sha(fs.readFileSync(stagingPngPath)),
      external_asset_sha256: contract.external_state_ids.includes(requested) ? sha(Buffer.concat(externalAssetBytes(requested))) : null,
      proof,
      high_resolution_release_allowed: false,
      active_release_switch_allowed: false,
      owner_frame_approval_required: true,
    };
    fs.writeFileSync(path.join(stagingRoot, "review-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    fs.mkdirSync(path.dirname(reviewRoot), { recursive: true });
    if (fs.existsSync(reviewRoot)) fail("актуальная ревизия уже существует; для перезаписи нужен новый отпечаток входов");
    fs.renameSync(stagingRoot, reviewRoot);
    stagingRoot = null;
  } finally {
    if (context) await context.close();
    await browser.close();
    if (stagingRoot) fs.rmSync(stagingRoot, { recursive: true, force: true });
  }
  if (!fs.existsSync(acceptancePath)) {
    fs.mkdirSync(path.dirname(acceptancePath), { recursive: true });
    fs.writeFileSync(acceptancePath, `${JSON.stringify(acceptance(), null, 2)}\n`);
  }
  process.stdout.write(`Черновой PNG ${requested} подготовлен для покадровой приёмки\n`);
}

await main();
