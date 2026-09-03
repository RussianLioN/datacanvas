import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { SaxesParser } from "saxes";
import Ajv2020 from "ajv/dist/2020.js";

const root = path.resolve(import.meta.dirname, "..");
const packageRoot = path.join(root, "docs/product/analysis/presentation-link-lisa-user-journey");
const sourceRoot = path.join(packageRoot, "source/browser-native-phone-prototype");
const candidateRoot = path.join(packageRoot, "candidate-evidence/browser-native-phone-prototype");
const check = process.argv.includes("--check");
const read = (file) => fs.readFileSync(file, "utf8");
const json = (file) => JSON.parse(read(file));
const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");
const fail = (message) => { throw new Error(`browser-native-phone-prototype: ${message}`); };

const blocked = /<(?:script|foreignObject|image|use)\b|<!DOCTYPE|<!ENTITY|\s(?:href|src)\s*=|\son[a-z]+\s*=|url\s*\(/iu;
const semanticTags = new Set(["svg", "g", "text", "tspan"]);
const geometryTags = new Set(["svg", "g", "rect", "path"]);
const permitted = new Set(["id", "xmlns", "viewBox", "aria-label", "data-device-model", "data-dom-state-id", "data-phone-time", "data-initial-scroll-position", "data-button-state", "data-dom-id", "data-dom-role", "data-section-id", "data-dom-order", "data-font-size", "data-font-weight", "data-fill", "data-tone", "data-copy-id", "data-action", "data-layout-x", "data-layout-y", "data-layout-width", "data-layout-height", "x", "y", "dy", "width", "height", "rx", "fill", "d"]);

function parseSvg(file, kind) {
  const source = read(file);
  if (blocked.test(source)) fail(`${path.basename(file)}: запрещённый SVG-узел или ссылка`);
  const tags = kind === "geometry" ? geometryTags : semanticTags;
  const elements = [], nodes = [], stack = [];
  let parserError = null;
  const parser = new SaxesParser({ xmlns: false });
  parser.on("opentag", (tag) => {
    if (!tags.has(tag.name)) parserError ||= `недопустимый SVG-тег ${tag.name}`;
    const attributes = Object.fromEntries(Object.entries(tag.attributes).map(([key, value]) => [key, String(value)]));
    for (const key of Object.keys(attributes)) if (!permitted.has(key)) parserError ||= `недопустимый SVG-атрибут ${key}`;
    const element = { tag: tag.name, attributes, text: "", children: [] };
    if (stack.length) stack.at(-1).children.push(element);
    stack.push(element); elements.push(element);
  });
  parser.on("text", (text) => { if (stack.length) stack.at(-1).text += text; });
  parser.on("closetag", () => {
    const element = stack.pop();
    if (kind === "semantic" && element?.tag === "text") {
      const attr = element.attributes;
      if (!attr["data-dom-id"] || !attr["data-dom-role"]) parserError ||= "текст без семантического идентификатора";
      const children = element.children.filter((candidate) => candidate.tag === "tspan");
      const content = children.map((child) => child.text.trim()).filter(Boolean).join("\n") || element.text.trim();
      if (!content) parserError ||= "пустой текстовый узел";
      nodes.push({ id: attr["data-dom-id"], role: attr["data-dom-role"], sectionId: attr["data-section-id"] || "chrome", order: Number(attr["data-dom-order"]), text: content, copyId: attr["data-copy-id"] || null, action: attr["data-action"] || null, tone: attr["data-tone"] || "default", layout: { x: Number(attr["data-layout-x"] || attr.x || 0), y: Number(attr["data-layout-y"] || attr.y || 0), width: Number(attr["data-layout-width"] || 0), height: Number(attr["data-layout-height"] || 0) }, style: { fontSize: Number(attr["data-font-size"]), fontWeight: Number(attr["data-font-weight"]), fill: attr["data-fill"] } });
    }
  });
  parser.on("error", (error) => { parserError ||= error.message; });
  parser.write(source).close();
  if (parserError) fail(`${path.basename(file)}: ${parserError}`);
  return { source, elements, nodes: nodes.sort((a, b) => a.order - b.order) };
}

function writeOrCheck(file, content) {
  if (check) { if (!fs.existsSync(file) || read(file) !== content) fail(`устарел ${path.relative(root, file)}`); return; }
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content);
}
function copyOrCheck(from, to) {
  if (check) { if (!fs.existsSync(to) || !fs.readFileSync(from).equals(fs.readFileSync(to))) fail(`устарел ${path.relative(root, to)}`); return; }
  fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to);
}
function validateContract(contract) {
  const schema = json(path.join(sourceRoot, "../schemas/browser-native-phone-prototype-contract.schema.json"));
  const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
  if (!validate(contract)) fail(`договор не соответствует схеме: ${validate.errors.map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ")}`);
}
function finalApproval(contract) {
  const approvalPath = contract.release_boundary.final_approval_path;
  if (typeof approvalPath !== "string" || path.isAbsolute(approvalPath) || approvalPath.includes("\\") || approvalPath.split("/").includes("..")) fail("небезопасный путь итогового решения владельца");
  const approval = json(path.join(sourceRoot, approvalPath));
  if (
    approval.change_order_id !== contract.change_order_id ||
    approval.decision !== "approved" ||
    approval.authorizations?.high_resolution_release_allowed !== true ||
    approval.authorizations?.active_release_switch_allowed !== true ||
    approval.authorizations?.delivery_archive_allowed !== true
  ) fail("итоговое решение владельца не разрешает чистовой браузерный прототип");
  return approval;
}
function validateExternalSeries(contract, externalStates) {
  const seriesPath = path.join(candidateRoot, "external-4k-series-review/series-manifest.json");
  if (!fs.existsSync(seriesPath)) fail("не подготовлен манифест внешней 4K-серии");
  const series = json(seriesPath);
  const review = contract.external_asset_profile.series_review;
  const approvalPath = review.owner_approval_path;
  if (typeof approvalPath !== "string" || path.isAbsolute(approvalPath) || approvalPath.includes("\\") || approvalPath.split("/").includes("..")) fail("небезопасный путь решения по внешней 4K-серии");
  const approval = json(path.join(sourceRoot, approvalPath));
  if (approval.decision !== "approved" || JSON.stringify(approval.approved_scope) !== JSON.stringify(contract.external_state_ids)) fail("решение владельца не подтверждает все внешние 4K-экраны");
  if (series.status !== review.status || series.owner_decision !== "approved" || series.source_paths_stored !== false || series.raw_pdf_served_by_demo !== false || series.active_release_mutation_prohibited !== true) {
    fail("внешняя 4K-серия нарушает договорную границу чистового выпуска");
  }
  if (!Array.isArray(series.assets) || series.assets.length !== externalStates.length) fail("манифест внешней 4K-серии неполон");
  for (const state of externalStates) {
    const asset = series.assets.find((candidate) => candidate.state_id === state.id);
    if (!asset || asset.asset_format !== state.assetFormat || JSON.stringify(asset.runtime_asset_paths) !== JSON.stringify(state.assetPaths) || JSON.stringify(asset.intrinsic_page) !== JSON.stringify(state.intrinsicPage)) {
      fail(`${state.id}: внешняя 4K-серия расходится с договором`);
    }
    for (const [index, assetPath] of state.assetPaths.entries()) {
      if (path.isAbsolute(assetPath) || assetPath.includes("\\") || assetPath.split("/").includes("..")) fail(`${state.id}: небезопасный путь внешнего ресурса`);
      const file = path.join(candidateRoot, assetPath);
      if (!fs.existsSync(file) || sha(fs.readFileSync(file)) !== asset.runtime_asset_sha256[index]) fail(`${state.id}: внешний ресурс отсутствует или повреждён`);
    }
  }
  if (JSON.stringify(series).includes("/Users/") || JSON.stringify(series).includes("file://")) fail("манифест внешней 4K-серии содержит локальный путь");
  return { series, seriesSha256: sha(read(seriesPath)) };
}
function main() {
  const contract = json(path.join(sourceRoot, "browser-native-phone-prototype-contract.json")); validateContract(contract);
  const ownerApproval = finalApproval(contract);
  const geometryPath = path.join(sourceRoot, contract.phone_runtime.geometry_source);
  const provenancePath = path.join(sourceRoot, contract.phone_runtime.geometry_provenance_source);
  const geometry = parseSvg(geometryPath, "geometry"); const provenance = json(provenancePath);
  const states = contract.phone_state_ids.map((id) => {
    const state = contract.state_rules[id]; if (!state) fail(`нет правила состояния ${id}`);
    const parsed = parseSvg(path.join(sourceRoot, "semantic-svgs", `${id}.svg`), "semantic");
    return { id, kind: "phone", phoneTime: state.phone_time, initialScrollPosition: state.initial_scroll_position, buttonState: state.button_state, nodes: parsed.nodes, sourceSha256: sha(parsed.source) };
  });
  const externalStates = contract.external_state_ids.map((id) => {
    const rule = contract.external_state_rules[id];
    if (!rule) fail(`нет правила внешнего экрана ${id}`);
    return {
      id,
      kind: "external",
      contentType: rule.content_type,
      pageCount: rule.page_count,
      assetFormat: rule.asset_format,
      assetPaths: rule.runtime_asset_paths,
      intrinsicPage: rule.intrinsic_page,
    };
  });
  const externalSeries = validateExternalSeries(contract, externalStates);
  const assets = [[path.join(packageRoot, "source/fonts/NotoSans[wdth,wght].ttf"), path.join(candidateRoot, "assets/NotoSans[wdth,wght].ttf")]];
  for (const [from, to] of assets) copyOrCheck(from, to);
  const phoneGeometry = {
    viewBox: geometry.elements.find((element) => element.tag === "svg")?.attributes.viewBox,
    elements: geometry.elements.filter((element) => ["rect", "path"].includes(element.tag)).map(({ tag, attributes }) => ({ tag, attributes })),
    hasSideControls: geometry.elements.some((element) => element.attributes.id === "phone-side-controls"),
    visibleBezelLogicalUnitsMax: contract.phone_runtime.geometry.visible_bezel_logical_units_max,
  };
  const viewerNavigation = {
    frameSequence: contract.viewer_navigation.frame_sequence,
    phonePanel: contract.viewer_navigation.phone_panel,
    externalOverlay: contract.viewer_navigation.external_overlay,
    chatList: {
      openFromStateIds: contract.viewer_navigation.chat_list.open_from_state_ids,
      returnToOrigin: contract.viewer_navigation.chat_list.return_to_origin,
      restoreScrollPosition: contract.viewer_navigation.chat_list.restore_scroll_position,
      directUrlFallbackStateId: contract.viewer_navigation.chat_list.direct_url_fallback_state_id,
    },
    presentationPages: contract.viewer_navigation.presentation_pages,
  };
  const viewerShell = {
    documentTitle: contract.viewer_shell.document_title,
    panelTitle: contract.viewer_shell.panel_title,
    phoneStateCaptions: contract.viewer_shell.phone_state_captions,
    externalPanelHidden: contract.viewer_shell.external_panel_hidden,
  };
  const data = { version: contract.version, status: contract.status, initialStateId: contract.draft_review_rendering.first_frame_id, logicalScreen: contract.phone_runtime.logical_screen, phoneGeometry, phoneStateIds: contract.phone_state_ids, externalStateIds: contract.external_state_ids, transitions: contract.scenario_transitions, viewerShell, viewerNavigation, states, externalStates };
  writeOrCheck(path.join(candidateRoot, "data.js"), `window.LISA_BROWSER_NATIVE_PHONE_DATA = ${JSON.stringify(data, null, 2)};\n`);
  const externalHashes = Object.fromEntries(externalStates.map((state) => [state.id, Object.fromEntries(state.assetPaths.map((assetPath) => [assetPath, sha(fs.readFileSync(path.join(candidateRoot, assetPath)))]))]));
  const fingerprintInputs = {
    contract_sha256: sha(read(path.join(sourceRoot, "browser-native-phone-prototype-contract.json"))),
    geometry_sha256: sha(geometry.source),
    geometry_provenance_sha256: sha(read(provenancePath)),
    semantic_svg_sha256: Object.fromEntries(states.map((state) => [state.id, state.sourceSha256])),
    external_asset_series_sha256: externalSeries.seriesSha256,
    external_asset_sha256: externalHashes,
  };
  const manifest = { $schema: "../../source/browser-native-phone-prototype/browser-native-phone-prototype-contract.json", version: contract.version, status: contract.status, runtime_mode: "browser_native_dom_phone", phone_state_ids: contract.phone_state_ids, external_state_ids: contract.external_state_ids, product_text_source: "semantic_svg", phone_raster_content_forbidden: true, viewer_shell: contract.viewer_shell, geometry_source_sha256: sha(geometry.source), geometry_provenance_sha256: sha(read(provenancePath)), source_sha256: fingerprintInputs.semantic_svg_sha256, external_asset_series_sha256: externalSeries.seriesSha256, external_asset_sha256: externalHashes, candidate_fingerprint: { algorithm: "sha256", sha256: sha(JSON.stringify(fingerprintInputs)) }, final_owner_approval: { decision: ownerApproval.decision, approved_on: ownerApproval.approved_on }, release_boundary: contract.release_boundary };
  writeOrCheck(path.join(candidateRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(check ? "Браузерный кандидат телефона актуален\n" : "Браузерный кандидат телефона сформирован\n");
}
main();
