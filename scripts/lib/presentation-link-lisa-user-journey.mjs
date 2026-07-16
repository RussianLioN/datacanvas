import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { inflateSync } from "node:zlib";
import Ajv2020 from "ajv/dist/2020.js";
import opentype from "opentype.js";
import {
  renderLisaDemoApp,
  renderLisaDemoStyles,
} from "./presentation-link-lisa-html-runtime.mjs";

export const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
export const CONTRACT_PATHS = {
  journey: `${PACKAGE_PATH}/source/journey-contract.json`,
  fixture: `${PACKAGE_PATH}/source/source-fixture-manifest.json`,
  preview: `${PACKAGE_PATH}/source/presentation-preview-contract.json`,
  visual: `${PACKAGE_PATH}/source/visual-components-contract.json`,
  frames: `${PACKAGE_PATH}/source/frame-contract.json`,
  package: `${PACKAGE_PATH}/source/prototype-package-contract.json`,
};
export const SCHEMA_PATHS = {
  journey: `${PACKAGE_PATH}/source/schemas/journey-contract.schema.json`,
  fixture: `${PACKAGE_PATH}/source/schemas/source-fixture-manifest.schema.json`,
  preview: `${PACKAGE_PATH}/source/schemas/presentation-preview-contract.schema.json`,
  visual: `${PACKAGE_PATH}/source/schemas/visual-components-contract.schema.json`,
  frames: `${PACKAGE_PATH}/source/schemas/frame-contract.schema.json`,
  package: `${PACKAGE_PATH}/source/schemas/prototype-package-contract.schema.json`,
};
export const STATE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
export const FIXED_EPOCH = "2026-07-16T00:00:00Z";
export const FONT_RELATIVE_PATH = `${PACKAGE_PATH}/source/fonts/NotoSans[wdth,wght].ttf`;
export const FONT_LICENSE_RELATIVE_PATH = `${PACKAGE_PATH}/source/fonts/OFL.txt`;
export const EXPECTED_FONT_SHA256 =
  "bfb7bb691513f12e734dc346c03a03f784912432d7e3fa8e56efcf906fe86b3d";
const PINNED_EXTERNAL_SOURCE_ORIGINS = new Map([
  [
    "source/components/lisa-phone-shell.svg",
    {
      origin_repository: "RussianLioN/AI-agent-platform",
      origin_commit: "b5ad803b8826ec6487534c4c88d59a3c93f8be4b",
      origin_path:
        "presentation-output/agent-factory-design-package-v1/exports/svg/figma-ready/lisa-home-screen-clean-v1.svg",
      origin_sha256:
        "39d86d4d49c08137865ba88eda52f305e6fb132094c40af85da6577def73c7b7",
    },
  ],
  [
    "source/fonts/NotoSans[wdth,wght].ttf",
    {
      origin_repository: "google/fonts",
      origin_commit: "26c5c976d82d50c24a8f0a7ac455e0a7c639c226",
      origin_path: "ofl/notosans/NotoSans[wdth,wght].ttf",
      origin_sha256:
        "bfb7bb691513f12e734dc346c03a03f784912432d7e3fa8e56efcf906fe86b3d",
    },
  ],
  [
    "source/fonts/OFL.txt",
    {
      origin_repository: "google/fonts",
      origin_commit: "26c5c976d82d50c24a8f0a7ac455e0a7c639c226",
      origin_path: "ofl/notosans/OFL.txt",
      origin_sha256:
        "cee9892f9f0cc8fe882c9e9537ee6a89621d86ee7ceaf70b02e2b2b1c25c061a",
    },
  ],
]);
export const WEBKIT_EVIDENCE_STATE_IDS = [
  "lisa-materials-ready",
  "lisa-presentation-generating",
  "lisa-presentation-ready-unread",
  "lisa-notifications-list-empty",
  "lisa-notifications-list-unread",
  "lisa-notification-detail-unread",
  "lisa-notification-detail-read",
  "lisa-result-view-from-notification",
  "lisa-returned-to-chat",
  "lisa-presentation-email-sent",
];

const generatedBasePaths = [
  `${PACKAGE_PATH}/demo/index.html`,
  `${PACKAGE_PATH}/demo/app.js`,
  `${PACKAGE_PATH}/demo/styles.css`,
  `${PACKAGE_PATH}/demo/data.js`,
  `${PACKAGE_PATH}/derived/projection-map.json`,
];

function absolute(root, relativePath) {
  return path.join(root, relativePath);
}

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeFile(root, relativePath, bytes) {
  const target = absolute(root, relativePath);
  ensureParent(target);
  fs.writeFileSync(target, bytes);
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(absolute(root, relativePath), "utf8"));
}

export function sha256Bytes(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export function sha256File(filePath) {
  return sha256Bytes(fs.readFileSync(filePath));
}

export function stableStringify(value, indentation = 2) {
  const normalize = (item) => {
    if (Array.isArray(item)) {
      return item.map(normalize);
    }
    if (item && typeof item === "object") {
      return Object.fromEntries(
        Object.keys(item)
          .sort((left, right) => left.localeCompare(right, "en"))
          .map((key) => [key, normalize(item[key])]),
      );
    }
    return item;
  };
  return `${JSON.stringify(normalize(value), null, indentation)}\n`;
}

export async function stabilizeBrowserCapture(page, policy) {
  await page.evaluate(async (capturePolicy) => {
    if (capturePolicy.wait_for_document_fonts) {
      await document.fonts.ready;
    }
    if (capturePolicy.scroll_policy === "restore-marked-end-after-fonts") {
      const content = document.querySelector(
        '.phone-content[data-capture-scroll-anchor="end"]',
      );
      if (content) content.scrollTop = content.scrollHeight;
    }
    if (
      capturePolicy.focus_policy ===
        "capture-mode-suppress-then-blur-active-element" &&
      document.activeElement instanceof HTMLElement
    ) {
      document.activeElement.blur();
    }
    await new Promise((resolve) => {
      let remaining = capturePolicy.settle_animation_frames;
      const settle = () => {
        remaining -= 1;
        if (remaining <= 0) {
          resolve();
          return;
        }
        window.requestAnimationFrame(settle);
      };
      window.requestAnimationFrame(settle);
    });
  }, policy);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeXml(value) {
  return escapeHtml(value);
}

function formatAjvErrors(errors) {
  return (errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ");
}

export function loadContracts(root = process.cwd()) {
  return Object.fromEntries(
    Object.entries(CONTRACT_PATHS).map(([name, relativePath]) => [
      name,
      readJson(root, relativePath),
    ]),
  );
}

export function validateContracts(root = process.cwd(), contracts = loadContracts(root)) {
  const issues = [];
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    strictRequired: false,
  });
  for (const name of Object.keys(CONTRACT_PATHS)) {
    const schema = readJson(root, SCHEMA_PATHS[name]);
    const validate = ajv.compile(schema);
    if (!validate(contracts[name])) {
      issues.push(`${CONTRACT_PATHS[name]}: ${formatAjvErrors(validate.errors)}`);
    }
  }

  const packageSourceRoot = path.resolve(root, PACKAGE_PATH, "source");
  for (const asset of contracts.package.source_assets) {
    const relativeAssetPath = asset.path;
    const assetPath = path.resolve(root, PACKAGE_PATH, relativeAssetPath);
    if (
      !isSafePackageOutputPath(relativeAssetPath) ||
      !relativeAssetPath.startsWith("source/") ||
      !assetPath.startsWith(`${packageSourceRoot}${path.sep}`)
    ) {
      issues.push(`source asset path escapes package source: ${relativeAssetPath}`);
      continue;
    }
    let stat;
    try {
      stat = fs.lstatSync(assetPath);
    } catch {
      issues.push(`source asset is missing: ${relativeAssetPath}`);
      continue;
    }
    if (!stat.isFile() || stat.isSymbolicLink()) {
      issues.push(`source asset must be a regular file: ${relativeAssetPath}`);
      continue;
    }
    const actualSha256 = sha256File(assetPath);
    if (actualSha256 !== asset.sha256) {
      issues.push(
        `source asset hash mismatch: ${relativeAssetPath}; expected ${asset.sha256}, got ${actualSha256}`,
      );
    }
    const pinnedOrigin = PINNED_EXTERNAL_SOURCE_ORIGINS.get(relativeAssetPath);
    if (asset.origin_commit !== null && !pinnedOrigin) {
      issues.push(`source asset origin is not independently pinned: ${relativeAssetPath}`);
    } else if (
      pinnedOrigin &&
      Object.entries(pinnedOrigin).some(
        ([key, expected]) => asset[key] !== expected,
      )
    ) {
      issues.push(`source asset pinned origin mismatch: ${relativeAssetPath}`);
    }
    const adapted = asset.kind.startsWith("adapted-");
    if (asset.origin_commit !== null && asset.origin_sha256 === null) {
      issues.push(`source asset origin hash is missing: ${relativeAssetPath}`);
    } else if (asset.origin_sha256 !== null) {
      if (adapted && actualSha256 === asset.origin_sha256) {
        issues.push(
          `adapted source asset must differ from its origin: ${relativeAssetPath}`,
        );
      } else if (!adapted && actualSha256 !== asset.origin_sha256) {
        issues.push(
          `source asset origin hash mismatch: ${relativeAssetPath}; expected ${asset.origin_sha256}, got ${actualSha256}`,
        );
      }
    }
  }

  const stateIds = contracts.journey.states.map((state) => state.id);
  const stateIdSet = new Set(stateIds);
  const actionIds = contracts.journey.actions.map((action) => action.id);
  const actionIdSet = new Set(actionIds);
  const frameStateIds = contracts.frames.frames.map((frame) => frame.state_id);

  if (stateIdSet.size !== stateIds.length) {
    issues.push("journey contract contains duplicate state ids");
  }
  if (actionIdSet.size !== actionIds.length) {
    issues.push("journey contract contains duplicate action ids");
  }
  if (!stateIdSet.has(contracts.journey.initial_state_id)) {
    issues.push(`initial state is unknown: ${contracts.journey.initial_state_id}`);
  }
  if (frameStateIds.length !== stateIds.length || frameStateIds.some((id, index) => id !== stateIds[index])) {
    issues.push("frame contract state order must exactly match journey contract");
  }

  for (const state of contracts.journey.states) {
    for (const actionId of state.action_ids) {
      if (!actionIdSet.has(actionId)) {
        issues.push(`state ${state.id} references unknown action ${actionId}`);
      }
    }
    for (const historyStateId of state.history_state_ids ?? []) {
      if (!stateIdSet.has(historyStateId)) {
        issues.push(`state ${state.id} references unknown history state ${historyStateId}`);
      }
      if (historyStateId === state.id) {
        issues.push(`state ${state.id} cannot include itself in chat history`);
      }
    }
  }
  for (const action of contracts.journey.actions) {
    if (action.target_state_id && !stateIdSet.has(action.target_state_id)) {
      issues.push(`action ${action.id} references unknown state ${action.target_state_id}`);
    }
    for (const step of action.prototype_sequence ?? []) {
      if (!stateIdSet.has(step.state_id)) {
        issues.push(`action ${action.id} sequence references unknown state ${step.state_id}`);
      }
    }
  }
  for (const frame of contracts.frames.frames) {
    const state = contracts.journey.states.find((item) => item.id === frame.state_id);
    if (state && JSON.stringify(state.action_ids) !== JSON.stringify(frame.action_ids)) {
      issues.push(`frame actions differ from journey state ${frame.state_id}`);
    }
  }

  const componentIds = new Set(contracts.visual.components.map((component) => component.id));
  if (componentIds.size !== contracts.visual.components.length) {
    issues.push("visual contract contains duplicate component ids");
  }
  const componentUsage = new Map(
    contracts.visual.components.map((component) => [
      component.id,
      component.usage,
    ]),
  );
  for (const componentId of ["lisa-phone-shell", "lisa-notification-bell"]) {
    if (componentUsage.get(componentId) !== "rendered-in-html") {
      issues.push(`${componentId} must be rendered by the approved HTML`);
    }
  }
  if (componentUsage.get("lisa-presentation-card") !== "reference-only") {
    issues.push("lisa-presentation-card must be explicitly reference-only");
  }

  const statesById = new Map(contracts.journey.states.map((state) => [state.id, state]));
  const actionsById = new Map(contracts.journey.actions.map((action) => [action.id, action]));
  const resultProjectionStateIds = [
    "lisa-presentation-ready-unread",
    "lisa-notifications-list-unread",
    "lisa-notification-detail-unread",
    "lisa-notifications-list-read",
    "lisa-notification-detail-read",
    "lisa-result-view-from-chat",
    "lisa-result-view-from-notification",
    "lisa-returned-to-chat",
    "lisa-presentation-email-submitting",
    "lisa-presentation-email-sent",
    "lisa-presentation-email-partial-failure",
    "lisa-presentation-email-failed",
  ];
  for (const stateId of resultProjectionStateIds) {
    const state = statesById.get(stateId);
    if (state && state.result_ref !== contracts.journey.result_ref) {
      issues.push(
        `chat and notification must reference the same result: ${stateId} uses ${state.result_ref}`,
      );
    }
  }
  if (contracts.journey.notification.push_supported !== false) {
    issues.push("push notifications are outside this prototype");
  }
  if (contracts.journey.notification.kind !== "lisa_notification_center_item") {
    issues.push("notification surface must be the Lisa notification center");
  }
  if (
    statesById.get("lisa-notification-failed-chat-available")?.result_ref !==
    undefined
  ) {
    issues.push(
      "failed notification delivery cannot create a notification result reference",
    );
  }
  if (
    actionsById.get("open-result-from-notification")?.target_state_id !==
    "lisa-result-view-from-notification"
  ) {
    issues.push("notification result action must open notification viewer");
  }
  if (
    actionsById.get("close-result")?.target_state_id !==
      "lisa-returned-to-chat" ||
    statesById.get("lisa-result-view-from-notification")?.return_anchor !==
      "presentation-ready-card"
  ) {
    issues.push("closing either viewer must return to the current Lisa chat");
  }
  if (
    actionsById.get("open-result-from-chat")?.target_state_id !==
    "lisa-result-view-from-chat"
  ) {
    issues.push("chat result action must open chat viewer");
  }
  if (
    contracts.journey.email_delivery.message_count !== 1 ||
    JSON.stringify(contracts.journey.email_delivery.required_attachments) !==
      JSON.stringify(["pdf", "pptx"]) ||
    contracts.journey.email_delivery.success_requires_all_attachments !== true
  ) {
    issues.push("email prototype must send one message with PDF and PPTX before success");
  }
  const requiredPrototypeSequences = new Map([
    [
      "order-presentation",
      [
        { state_id: "lisa-presentation-generating", at_ms: 600 },
        { state_id: "lisa-presentation-ready-unread", at_ms: 8000 },
      ],
    ],
    [
      "retry-order",
      [
        { state_id: "lisa-presentation-generating", at_ms: 600 },
        { state_id: "lisa-presentation-ready-unread", at_ms: 8000 },
      ],
    ],
    [
      "retry-failed-attachment",
      [{ state_id: "lisa-presentation-email-sent", at_ms: 900 }],
    ],
    [
      "retry-email",
      [{ state_id: "lisa-presentation-email-sent", at_ms: 900 }],
    ],
    [
      "email-presentation",
      [{ state_id: "lisa-presentation-email-sent", at_ms: 900 }],
    ],
  ]);
  for (const [actionId, expectedSequence] of requiredPrototypeSequences) {
    if (
      JSON.stringify(actionsById.get(actionId)?.prototype_sequence ?? []) !==
      JSON.stringify(expectedSequence)
    ) {
      issues.push(`action ${actionId} must complete its prototype retry sequence`);
    }
  }
  const timeline = contracts.journey.prototype_timeline;
  if (
    timeline.generation_started_at_ms !== 600 ||
    timeline.clock_animation_ends_at_ms !== 7600 ||
    timeline.ready_at_ms !== 8000 ||
    timeline.direct_state_autoplay !== false
  ) {
    issues.push("prototype timeline must run from 13:24 to 13:44 over exactly 8000ms");
  }

  const material = statesById.get("lisa-materials-ready")?.content;
  if (material) {
    const normalizedMaterialSha256 = sha256Bytes(stableStringify(material));
    if (normalizedMaterialSha256 !== contracts.fixture.normalized_material_sha256) {
      issues.push(
        `meeting material hash mismatch: expected ${contracts.fixture.normalized_material_sha256}, got ${normalizedMaterialSha256}`,
      );
    }
    const unitCount = material.sections.reduce(
      (total, section) =>
        total +
        section.blocks.reduce(
          (sectionTotal, block) =>
            sectionTotal + (Array.isArray(block.items) ? block.items.length : 1),
          0,
        ),
      0,
    );
    if (unitCount !== 33) {
      issues.push(`meeting material must contain exactly 33 typed units, got ${unitCount}`);
    }
    const ids = material.sections.flatMap((section) =>
      section.blocks.flatMap((block) => [
        `${section.id}.${block.id}`,
        ...(block.items ?? []).map((item) => `${section.id}.${block.id}.${item.id}`),
      ]),
    );
    if (new Set(ids).size !== ids.length) {
      issues.push("meeting material contains duplicate typed unit ids");
    }
    for (const slide of contracts.preview.slides) {
      for (const binding of slide.data_bindings) {
        if (resolvePresentationBinding(material, binding) === undefined) {
          issues.push(`slide ${slide.id} contains unresolved data binding ${binding}`);
        }
      }
      for (const card of slide.card_summaries ?? []) {
        if (!slide.data_bindings.includes(card.binding)) {
          issues.push(`slide ${slide.id} card summary is not declared in data bindings`);
        }
        if (resolvePresentationBinding(material, card.binding) === undefined) {
          issues.push(`slide ${slide.id} contains unresolved card binding ${card.binding}`);
        }
      }
    }
  }
  if (JSON.stringify(contracts.preview).includes("37 млрд")) {
    issues.push("presentation preview must not sum independent offer limits");
  }

  return issues;
}

export function resolvePresentationBinding(material, binding) {
  let current = material;
  for (const segment of binding.split(".")) {
    if (["__proto__", "prototype", "constructor"].includes(segment)) {
      return undefined;
    }
    if (Array.isArray(current)) {
      current = current.find((item) => item?.id === segment);
      continue;
    }
    if (
      !current ||
      typeof current !== "object" ||
      !Object.prototype.hasOwnProperty.call(current, segment)
    ) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function collectContentStrings(value, key = "") {
  if (typeof value === "string") {
    return ["id", "type", "tag", "group"].includes(key) ? [] : [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectContentStrings(item));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([childKey, childValue]) =>
      collectContentStrings(childValue, childKey),
    );
  }
  return [];
}

export function buildNormalizedModel(contracts) {
  const actionsById = new Map(contracts.journey.actions.map((action) => [action.id, action]));
  const framesByState = new Map(contracts.frames.frames.map((frame) => [frame.state_id, frame]));
  const states = contracts.journey.states.map((state) => {
    const frame = framesByState.get(state.id);
    const actions = state.action_ids.map((actionId) => actionsById.get(actionId));
    const contentTexts = state.content ? collectContentStrings(state.content) : [];
    const projection = {
      state_id: state.id,
      display_name: state.display_name,
      kind: state.kind,
      texts: [
        state.eyebrow,
        state.title,
        state.body,
        ...state.detail_lines,
        ...contentTexts,
        ...actions.map((action) => action.label),
      ],
      actions: actions.map((action) => ({
        id: action.id,
        label: action.label,
        accessible_label: action.accessible_label ?? null,
        variant: action.variant,
        target_state_id: action.target_state_id ?? null,
        behavior: action.behavior ?? null,
        prototype_sequence: action.prototype_sequence ?? [],
      })),
      result_ref: state.result_ref ?? null,
      history_state_ids: state.history_state_ids ?? [],
      region_id: frame.region_id,
      component_ids:
        state.kind === "viewer"
          ? []
          : ["lisa-phone-shell", "lisa-notification-bell"],
    };
    return {
      ...state,
      actions,
      region_id: frame.region_id,
      projection,
      projection_sha256: sha256Bytes(stableStringify(projection)),
    };
  });

  return {
    version: "1.2.0",
    status: contracts.journey.status,
    initial_state_id: contracts.journey.initial_state_id,
    route: contracts.journey.route,
    result_ref: contracts.journey.result_ref,
    notification: contracts.journey.notification,
    email_delivery: contracts.journey.email_delivery,
    prototype_semantics: contracts.journey.prototype_semantics,
    open_product_decisions: contracts.journey.open_product_decisions,
    prototype_timeline: contracts.journey.prototype_timeline,
    presentation: contracts.preview,
    source_fixture: contracts.fixture,
    layout: contracts.visual.layout,
    viewer: contracts.visual.viewer,
    motion: contracts.visual.motion,
    accessibility: contracts.visual.accessibility,
    tokens: contracts.visual.tokens,
    visual_components: contracts.visual.components,
    states,
  };
}

export function parseStateSearch(search, initialStateId, knownStateIds) {
  let params;
  try {
    params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  } catch {
    return { ok: false, reason: "malformed-query" };
  }
  const values = params.getAll("state");
  if (values.length === 0) {
    return { ok: true, stateId: initialStateId, explicit: false };
  }
  if (values.length !== 1) {
    return { ok: false, reason: "duplicate-state" };
  }
  const stateId = values[0];
  if (!STATE_ID_PATTERN.test(stateId)) {
    return { ok: false, reason: "malformed-state" };
  }
  if (!knownStateIds.has(stateId)) {
    return { ok: false, reason: "unknown-state" };
  }
  return { ok: true, stateId, explicit: true };
}

export function measureVariableText(fontPath, text, fontSize, variation = { wght: 400, wdth: 100 }) {
  return createFontEngine(fontPath).measure(text, fontSize, variation);
}

export class LayoutError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "LayoutError";
    this.details = details;
  }
}

function toArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

export function createFontEngine(fontPath, expectedSha256 = null) {
  const bytes = fs.readFileSync(fontPath);
  const actualSha256 = sha256Bytes(bytes);
  if (expectedSha256 && actualSha256 !== expectedSha256) {
    throw new Error(
      `vendored font hash mismatch: expected ${expectedSha256}, received ${actualSha256}`,
    );
  }
  const font = opentype.parse(toArrayBuffer(bytes));
  const axes = new Map((font.tables.fvar?.axes ?? []).map((axis) => [axis.tag, axis]));
  for (const [tag, expected] of [
    ["wght", { min: 100, max: 900 }],
    ["wdth", { min: 62.51, max: 100 }],
  ]) {
    const axis = axes.get(tag);
    if (!axis || axis.minValue > expected.min || axis.maxValue < expected.max) {
      throw new Error(`vendored font does not expose required ${tag} variation axis`);
    }
  }

  function glyphRun(text, fontSize, variation) {
    const sourceGlyphs = font.stringToGlyphs(text);
    const run = [];
    let advance = 0;
    for (let index = 0; index < sourceGlyphs.length; index += 1) {
      const sourceGlyph = sourceGlyphs[index];
      if (sourceGlyph.index === 0 && text[index] !== "\u0000") {
        throw new LayoutError(`vendored font has no glyph for text: ${text}`);
      }
      const glyph = font.variation.getTransform(sourceGlyph, variation);
      run.push({ glyph, x: advance });
      advance += ((glyph.advanceWidth ?? font.unitsPerEm) / font.unitsPerEm) * fontSize;
      const nextSource = sourceGlyphs[index + 1];
      if (nextSource) {
        advance +=
          (font.getKerningValue(sourceGlyph, nextSource) / font.unitsPerEm) * fontSize;
      }
    }
    return { run, advance };
  }

  return {
    sha256: actualSha256,
    measure(text, fontSize, variation = { wght: 400, wdth: 100 }) {
      return glyphRun(text, fontSize, variation).advance;
    },
    pathData(text, x, baseline, fontSize, variation = { wght: 400, wdth: 100 }) {
      const shaped = glyphRun(text, fontSize, variation);
      return shaped.run
        .map(({ glyph, x: glyphX }) =>
          glyph
            .getPath(x + glyphX, baseline, fontSize, { hinting: false }, font)
            .toPathData(2),
        )
        .join("");
    },
    textBox(text, x, baseline, fontSize, variation = { wght: 400, wdth: 100 }) {
      const width = glyphRun(text, fontSize, variation).advance;
      const ascender = (font.ascender / font.unitsPerEm) * fontSize;
      const descender = Math.abs((font.descender / font.unitsPerEm) * fontSize);
      return {
        x,
        y: baseline - ascender,
        width,
        height: ascender + descender,
      };
    },
  };
}

export function wrapMeasuredText(fontEngine, text, options) {
  const {
    maxWidth,
    maxLines,
    fontSize,
    variation = { wght: 400, wdth: 100 },
  } = options;
  const words = String(text).trim().split(/\s+/u).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    if (fontEngine.measure(word, fontSize, variation) > maxWidth) {
      throw new LayoutError("Неразрывное слово не помещается в текстовую область", {
        word,
        maxWidth,
      });
    }
    const candidate = current ? `${current} ${word}` : word;
    if (fontEngine.measure(candidate, fontSize, variation) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (!current) {
      throw new LayoutError("Не удалось сформировать строку текста", { text });
    }
    lines.push(current);
    current = word;
    if (lines.length >= maxLines) {
      throw new LayoutError("Текст превышает допустимое число строк", {
        text,
        maxLines,
      });
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    throw new LayoutError("Текст превышает допустимое число строк", { text, maxLines });
  }
  return lines;
}

function rectanglesOverlap(left, right, tolerance = 0) {
  const overlapWidth =
    Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x);
  const overlapHeight =
    Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y);
  return overlapWidth > tolerance && overlapHeight > tolerance;
}

export function validateLayoutBoxes(boxes, options = {}) {
  const {
    canvasWidth = 390,
    canvasHeight = 844,
    minimumTarget = 44,
    minimumGap = 8,
    tolerance = 1,
  } = options;
  const issues = [];
  const byId = new Map(boxes.map((box) => [box.id, box]));
  for (const box of boxes) {
    if (
      ![box.x, box.y, box.width, box.height].every(Number.isFinite) ||
      box.width <= 0 ||
      box.height <= 0
    ) {
      issues.push(`${box.id}: некорректная геометрия`);
      continue;
    }
    if (
      box.x < -tolerance ||
      box.y < -tolerance ||
      box.x + box.width > canvasWidth + tolerance ||
      box.y + box.height > canvasHeight + tolerance
    ) {
      issues.push(`${box.id}: элемент выходит за холст`);
    }
    if (box.parentId) {
      const parent = byId.get(box.parentId);
      if (!parent) {
        issues.push(`${box.id}: неизвестный владелец ${box.parentId}`);
      } else if (
        box.x < parent.x - tolerance ||
        box.y < parent.y - tolerance ||
        box.x + box.width > parent.x + parent.width + tolerance ||
        box.y + box.height > parent.y + parent.height + tolerance
      ) {
        issues.push(`${box.id}: элемент выходит за границы ${box.parentId}`);
      }
    }
    if (
      box.interactive &&
      (box.width < minimumTarget - tolerance || box.height < minimumTarget - tolerance)
    ) {
      issues.push(`${box.id}: область нажатия меньше ${minimumTarget}px`);
    }
  }
  const collisionGroups = new Map();
  for (const box of boxes.filter((item) => item.collisionGroup)) {
    const group = collisionGroups.get(box.collisionGroup) ?? [];
    group.push(box);
    collisionGroups.set(box.collisionGroup, group);
  }
  for (const [groupId, group] of collisionGroups) {
    for (let leftIndex = 0; leftIndex < group.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < group.length; rightIndex += 1) {
        const left = group[leftIndex];
        const right = group[rightIndex];
        if (left.flowId && left.flowId === right.flowId) continue;
        if (rectanglesOverlap(left, right, tolerance)) {
          issues.push(`${groupId}: ${left.id} пересекается с ${right.id}`);
          continue;
        }
        if (left.requireGap && right.requireGap) {
          const horizontalGap = Math.max(
            right.x - (left.x + left.width),
            left.x - (right.x + right.width),
            0,
          );
          const verticalGap = Math.max(
            right.y - (left.y + left.height),
            left.y - (right.y + right.height),
            0,
          );
          const meaningfulGap = Math.max(horizontalGap, verticalGap);
          if (meaningfulGap > 0 && meaningfulGap < minimumGap - tolerance) {
            issues.push(`${groupId}: интервал между ${left.id} и ${right.id} меньше ${minimumGap}px`);
          }
        }
      }
    }
  }
  return issues;
}

function renderTextPath(fontEngine, text, x, baseline, options = {}) {
  const {
    fontSize = 16,
    weight = 400,
    width = 100,
    fill = "#201F25",
    anchor = "start",
  } = options;
  const variation = { wght: weight, wdth: width };
  const textWidth = fontEngine.measure(text, fontSize, variation);
  const startX = anchor === "middle" ? x - textWidth / 2 : x;
  return {
    svg: `<path d="${fontEngine.pathData(text, startX, baseline, fontSize, variation)}" fill="${fill}"/>`,
    box: fontEngine.textBox(text, startX, baseline, fontSize, variation),
  };
}

function renderTextBlock(fontEngine, lines, x, baseline, options = {}) {
  const { lineHeight = 24, id = "text", parentId, collisionGroup, ...textOptions } = options;
  const rendered = lines.map((line, index) =>
    renderTextPath(fontEngine, line, x, baseline + index * lineHeight, textOptions),
  );
  return {
    svg: rendered.map((item) => item.svg).join("\n"),
    boxes: rendered.map((item, index) => ({
      id: `${id}-${index + 1}`,
      ...item.box,
      parentId,
      collisionGroup,
      flowId: id,
      requireGap: true,
    })),
  };
}

function actionRows(state) {
  if (state.id === "lisa-materials-ready") {
    return [
      {
        y: 642,
        actions: state.actions.slice(0, 2),
        columns: 2,
      },
      {
        y: 708,
        actions: state.actions.slice(2),
        columns: 1,
      },
    ];
  }
  if (state.actions.length === 2) {
    return [
      {
        y: 708,
        actions: state.actions,
        columns: 2,
      },
    ];
  }
  return [
    {
      y: 708,
      actions: state.actions.slice(0, 1),
      columns: 1,
    },
  ];
}

function renderActionSvg(fontEngine, action, x, y, width, height) {
  const primary = action.variant === "primary";
  const fill = primary ? "#F06D78" : "#FFFFFF";
  const stroke = primary ? "#F06D78" : "#D9D4DE";
  const textFill = primary ? "#FFFFFF" : "#201F25";
  const fontSize = width < 180 ? 12.5 : 14;
  const lines = wrapMeasuredText(fontEngine, action.label, {
    maxWidth: width - 24,
    maxLines: 2,
    fontSize,
    variation: { wght: 700, wdth: 100 },
  });
  const baseline = lines.length === 1 ? y + 34 : y + 24;
  const textBlock = renderTextBlock(fontEngine, lines, x + width / 2, baseline, {
    id: `action-${action.id}-text`,
    lineHeight: 17,
    fontSize,
    weight: 700,
    fill: textFill,
    anchor: "middle",
    parentId: `action-${action.id}`,
    collisionGroup: `action-${action.id}-text-flow`,
  });
  return {
    svg: [
      `<g data-action-id="${escapeXml(action.id)}">`,
      `  <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="18" fill="${fill}" stroke="${stroke}"/>`,
      ...textBlock.svg.split("\n").map((line) => `  ${line}`),
      "</g>",
    ].join("\n"),
    boxes: [
      {
        id: `action-${action.id}`,
        x,
        y,
        width,
        height,
        interactive: true,
        collisionGroup: "screen-structure",
        requireGap: true,
      },
      ...textBlock.boxes,
    ],
  };
}

function prefixComponentIds(body, prefix) {
  const ids = [...body.matchAll(/\bid=(["'])([^"']+)\1/gu)].map((match) => match[2]);
  let result = body;
  for (const id of ids) {
    const prefixed = `${prefix}-${id}`;
    result = result
      .replaceAll(`id="${id}"`, `id="${prefixed}"`)
      .replaceAll(`id='${id}'`, `id='${prefixed}'`)
      .replaceAll(`url(#${id})`, `url(#${prefixed})`)
      .replaceAll(`"#${id}"`, `"#${prefixed}"`)
      .replaceAll(`'#${id}'`, `'#${prefixed}'`);
  }
  return result;
}

function loadComponent(root, component) {
  const componentRoot = path.resolve(root, PACKAGE_PATH, "source/components");
  const target = path.resolve(componentRoot, path.basename(component.source_svg));
  if (!target.startsWith(`${componentRoot}${path.sep}`)) {
    throw new Error(`component path escapes source root: ${component.source_svg}`);
  }
  const stat = fs.lstatSync(target);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(`component must be a regular file: ${component.source_svg}`);
  }
  const source = fs.readFileSync(target, "utf8");
  const rootMatch = source.match(/<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/u);
  if (!rootMatch) {
    throw new Error(`component has no SVG root: ${component.source_svg}`);
  }
  const viewBoxMatch = rootMatch[1].match(/\bviewBox=(["'])([^"']+)\1/u);
  if (!viewBoxMatch) {
    throw new Error(`component has no viewBox: ${component.source_svg}`);
  }
  const body = rootMatch[2]
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gu, "")
    .replace(/<desc\b[^>]*>[\s\S]*?<\/desc>/gu, "")
    .trim();
  return {
    id: component.id,
    path: `${PACKAGE_PATH}/source/${component.source_svg}`,
    sha256: sha256Bytes(source),
    viewBox: viewBoxMatch[2],
    body,
  };
}

function loadRenderAssets(root, contracts) {
  const fontPath = absolute(root, FONT_RELATIVE_PATH);
  const fontEngine = createFontEngine(fontPath, EXPECTED_FONT_SHA256);
  const components = new Map(
    contracts.visual.components.map((component) => {
      const loaded = loadComponent(root, component);
      return [loaded.id, loaded];
    }),
  );
  const visualInputSha256 = sha256Bytes(
    stableStringify({
      font: fontEngine.sha256,
      components: [...components.values()].map((component) => ({
        id: component.id,
        sha256: component.sha256,
      })),
    }),
  );
  return { fontEngine, components, visualInputSha256 };
}

function renderComponent(component, instanceId, x, y, width, height) {
  return [
    `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${component.viewBox}" data-component-id="${component.id}" data-component-source-sha256="${component.sha256}">`,
    ...prefixComponentIds(component.body, instanceId)
      .split("\n")
      .map((line) => `  ${line}`),
    "</svg>",
  ].join("\n");
}

export function renderScreenSvg(state, model, assets) {
  const { fontEngine, components, visualInputSha256 } = assets;
  const unread = state.notification_unread === true;
  const contentX = 16;
  const contentWidth = 358;
  const cardX = 24;
  const cardWidth = 342;
  const cardBottom = state.id === "lisa-materials-ready" ? 622 : 688;
  const titleLines = wrapMeasuredText(fontEngine, state.title, {
    maxWidth: 302,
    maxLines: 2,
    fontSize: 21,
    variation: { wght: 700, wdth: 100 },
  });
  const bodyLines = wrapMeasuredText(fontEngine, state.body, {
    maxWidth: 302,
    maxLines: 6,
    fontSize: 14.5,
    variation: { wght: 400, wdth: 100 },
  });
  const detailLines = state.detail_lines.flatMap((line) =>
    wrapMeasuredText(fontEngine, line, {
      maxWidth: 282,
      maxLines: 4,
      fontSize: 12.5,
      variation: { wght: 400, wdth: 100 },
    }),
  );
  const isViewer = state.kind === "viewer";
  const isNotification = state.kind.startsWith("notification");
  const cardFill =
    state.kind === "error"
      ? "#FFF4F4"
      : state.kind === "warning"
        ? "#FFF8E8"
        : state.kind === "success"
          ? "#F0FAF5"
          : "#FFFFFF";

  const bodyParts = [];
  const boxes = [
    {
      id: "phone",
      x: 8,
      y: 16,
      width: 375,
      height: 812,
    },
    {
      id: "composer",
      x: 24,
      y: 778,
      width: 346,
      height: 44,
      parentId: "phone",
      collisionGroup: "screen-structure",
      requireGap: true,
    },
  ];
  bodyParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844" role="img" aria-labelledby="screen-title screen-desc" data-state-id="${escapeXml(state.id)}" data-projection-sha256="${state.projection_sha256}" data-visual-input-sha256="${visualInputSha256}">`,
    `  <title id="screen-title">${escapeXml(state.title)}</title>`,
    `  <desc id="screen-desc">${escapeXml([state.body, ...state.detail_lines].join(" "))}</desc>`,
    '  <rect width="390" height="844" fill="#F1F0F5"/>',
    ...renderComponent(components.get("lisa-phone-shell"), "screen-shell", 8, 16, 375, 812)
      .split("\n")
      .map((line) => `  ${line}`),
    '  <rect x="150" y="30" width="90" height="28" rx="14" fill="#111115"/>',
    `  ${renderTextPath(fontEngine, "13:44", 34, 53, {
      fontSize: 16,
      weight: 700,
    }).svg}`,
    ...renderComponent(
      components.get("lisa-notification-bell"),
      "screen-bell",
      337,
      64,
      24,
      24,
    )
      .split("\n")
      .map((line) => `  ${line}`),
  );
  if (unread) {
    bodyParts.push(
      '  <circle data-component-id="notification-dot" cx="361" cy="66" r="7" fill="#D9253A" stroke="#FBFAFD" stroke-width="3"/>',
    );
  }
  const contextLabel = isViewer
    ? "Просмотр презентации"
    : isNotification
      ? "Уведомления Лисы"
      : "Лиса · Подготовка к встрече";
  bodyParts.push(
    `  ${renderTextPath(fontEngine, contextLabel, contentX, 92, {
      fontSize: 14,
      weight: 700,
      fill: "#65616D",
    }).svg}`,
    '  <line x1="16" y1="108" x2="374" y2="108" stroke="#E5E1E9"/>',
  );

  if (isViewer) {
    boxes.push({
      id: "viewer-card",
      x: 24,
      y: 132,
      width: 342,
      height: 462,
      parentId: "phone",
      collisionGroup: "screen-structure",
      requireGap: true,
    });
    bodyParts.push(
      ...renderComponent(
        components.get("lisa-presentation-card"),
        `screen-card-${state.id}`,
        24,
        132,
        342,
        462,
      )
        .split("\n")
        .map((line) => `  ${line}`),
      `  ${renderTextPath(fontEngine, "Подготовка к встрече", 82, 205, {
        fontSize: 18,
        weight: 700,
      }).svg}`,
      `  ${renderTextPath(fontEngine, "Краткая презентация по материалам агента", 82, 229, {
        fontSize: 12,
        weight: 400,
        fill: "#65616D",
      }).svg}`,
      `  ${renderTextPath(fontEngine, "PDF · только просмотр", 195, 548, {
        fontSize: 13,
        weight: 700,
        fill: "#65616D",
        anchor: "middle",
      }).svg}`,
    );
  } else {
    boxes.push({
      id: "message-card",
      x: cardX,
      y: 132,
      width: cardWidth,
      height: cardBottom - 132,
      parentId: "phone",
      collisionGroup: "screen-structure",
      requireGap: true,
    });
    const eyebrow = renderTextPath(fontEngine, state.eyebrow, 44, 162, {
      fontSize: 13,
      weight: 700,
      fill: "#B63F52",
    });
    const titleBlock = renderTextBlock(fontEngine, titleLines, 44, 198, {
      id: "message-title",
      lineHeight: 27,
      fontSize: 21,
      weight: 700,
      parentId: "message-card",
      collisionGroup: "message-flow",
    });
    const bodyBaseline = 198 + (titleLines.length - 1) * 27 + 38;
    const bodyBlock = renderTextBlock(fontEngine, bodyLines, 44, bodyBaseline, {
      id: "message-body",
      lineHeight: 22,
      fontSize: 14.5,
      weight: 400,
      parentId: "message-card",
      collisionGroup: "message-flow",
    });
    let detailBaseline = bodyBaseline + (bodyLines.length - 1) * 22 + 30;
    const detailBlocks = [];
    for (const [index, line] of detailLines.entries()) {
      const text = renderTextPath(fontEngine, line, 62, detailBaseline, {
        fontSize: 12.5,
        weight: 400,
        fill: "#4F4B56",
      });
      detailBlocks.push({
        svg: [
          `<circle cx="50" cy="${detailBaseline - 5}" r="3" fill="#F06D78"/>`,
          text.svg,
        ].join("\n"),
        box: {
          id: `message-detail-${index + 1}`,
          ...text.box,
          parentId: "message-card",
          collisionGroup: "message-flow",
          flowId: "message-detail",
          requireGap: true,
        },
      });
      detailBaseline += 18;
    }
    bodyParts.push(
      `  <rect x="${cardX}" y="132" width="${cardWidth}" height="${cardBottom - 132}" rx="22" fill="${cardFill}" stroke="#E5E1E9"/>`,
      `  ${eyebrow.svg}`,
      ...titleBlock.svg.split("\n").map((line) => `  ${line}`),
      ...bodyBlock.svg.split("\n").map((line) => `  ${line}`),
      ...detailBlocks.flatMap((block) =>
        block.svg.split("\n").map((line) => `  ${line}`),
      ),
    );
    boxes.push(
      {
        id: "message-eyebrow",
        ...eyebrow.box,
        parentId: "message-card",
        collisionGroup: "message-flow",
        requireGap: true,
      },
      ...titleBlock.boxes,
      ...bodyBlock.boxes,
      ...detailBlocks.map((block) => block.box),
    );
  }

  for (const row of actionRows(state)) {
    if (row.columns === 2) {
      const widths = [173, 173];
      row.actions.forEach((action, index) => {
        const rendered = renderActionSvg(
          fontEngine,
          action,
          contentX + index * 185,
          row.y,
          widths[index],
          54,
        );
        bodyParts.push(rendered.svg);
        boxes.push(...rendered.boxes);
      });
    } else {
      row.actions.forEach((action, index) => {
        const rendered = renderActionSvg(
          fontEngine,
          action,
          contentX,
          row.y + index * 62,
          contentWidth,
          54,
        );
        bodyParts.push(rendered.svg);
        boxes.push(...rendered.boxes);
      });
    }
  }

  const composerLabel = renderTextPath(fontEngine, "Задайте любой вопрос…", 44, 806, {
    fontSize: 15,
    weight: 400,
    fill: "#8B8692",
  });
  bodyParts.push(
    '  <rect x="24" y="778" width="300" height="44" rx="22" fill="#FFFFFF" stroke="#E5E1E9"/>',
    `  ${composerLabel.svg}`,
    '  <circle cx="348" cy="800" r="22" fill="#F06D78"/>',
    '  <path d="M348 810V790m0 0-7 7m7-7 7 7" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    "</svg>",
    "",
  );
  const geometryIssues = validateLayoutBoxes(boxes, {
    canvasWidth: 390,
    canvasHeight: 844,
    minimumTarget: model.layout.minimum_target_px,
    minimumGap: model.layout.minimum_action_gap_px,
    tolerance: model.layout.intersection_tolerance_square_px,
  });
  if (geometryIssues.length > 0) {
    throw new LayoutError(`Геометрия состояния ${state.id} не прошла проверку`, {
      issues: geometryIssues,
    });
  }
  return bodyParts.join("\n");
}

function renderDemoIndex() {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
    <title>Лиса — путь заказа презентации</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <main class="demo-shell">
      <section class="prototype-tools" aria-labelledby="tools-title">
        <div>
          <p class="tools-eyebrow">Проверяемый прототип DataCanvas</p>
          <h1 id="tools-title">Путь заказа презентации в Лисе</h1>
          <p>Выберите состояние или пройдите сценарий кнопками внутри телефона.</p>
          <p id="prototype-review-status" class="review-status"></p>
        </div>
        <label for="state-select">Состояние</label>
        <select id="state-select" aria-describedby="state-help"></select>
        <p id="state-help">Адрес обновляется в формате <code>?state=...</code>.</p>
      </section>
      <section class="phone-stage" aria-label="Экран телефона Лисы">
        <div id="phone-root"></div>
      </section>
      <p id="prototype-live-region" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p>
    </main>
    <dialog id="materials-dialog" aria-labelledby="materials-dialog-title">
      <form method="dialog">
        <h2 id="materials-dialog-title">Редактирование материалов</h2>
        <p>В промышленном сценарии здесь открывается редактор материалов вызывающего агента. В этом прототипе данные не изменяются.</p>
        <button type="submit" class="button button-primary">Закрыть</button>
      </form>
    </dialog>
    <script src="data.js"></script>
    <script src="app.js"></script>
  </body>
</html>
`;
}

function generatedPathsForStates(states) {
  return [
    ...generatedBasePaths,
    ...states.flatMap((state) => [
      `${PACKAGE_PATH}/derived/screens/${state.id}.svg`,
      `${PACKAGE_PATH}/derived/screens/${state.id}.png`,
    ]),
  ];
}

const htmlPrototypePaths = [
  `${PACKAGE_PATH}/demo/index.html`,
  `${PACKAGE_PATH}/demo/app.js`,
  `${PACKAGE_PATH}/demo/styles.css`,
  `${PACKAGE_PATH}/demo/data.js`,
];

function buildHtmlOutputMap(model) {
  return new Map([
    ["index.html", renderDemoIndex()],
    ["styles.css", renderLisaDemoStyles()],
    ["app.js", renderLisaDemoApp()],
    ["data.js", `window.LISA_PROTOTYPE_DATA = ${JSON.stringify(model, null, 2)};\n`],
  ]);
}

function validateHtmlOutputMap(outputs) {
  const expectedNames = ["app.js", "data.js", "index.html", "styles.css"];
  const maximumBytes = new Map([
    ["index.html", 32 * 1024],
    ["styles.css", 128 * 1024],
    ["app.js", 256 * 1024],
    ["data.js", 512 * 1024],
  ]);
  const actualNames = [...outputs.keys()].sort((left, right) => left.localeCompare(right, "en"));
  if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) {
    throw new Error("HTML generation must produce exactly app.js, data.js, index.html and styles.css");
  }
  for (const [name, content] of outputs) {
    if (typeof content !== "string" || content.length === 0) {
      throw new Error(`HTML output is empty: ${name}`);
    }
    const outputBytes = Buffer.byteLength(content, "utf8");
    if (outputBytes > maximumBytes.get(name)) {
      throw new Error(
        `HTML output exceeds its size limit: ${name} is ${outputBytes} bytes`,
      );
    }
    const networkRelevantContent = content.replaceAll(
      "http://www.w3.org/2000/svg",
      "",
    );
    if (/https?:\/\/|wss?:\/\//u.test(networkRelevantContent)) {
      throw new Error(`HTML output contains an active network address: ${name}`);
    }
    if (
      /file:/iu.test(content) ||
      /(?:^|[\s"'(])\/(?:Users|home|root|etc|var|private|opt|tmp)\//mu.test(content) ||
      /(?:^|[\s"'(])[A-Za-z]:[\\/]/mu.test(content) ||
      /\\\\[A-Za-z0-9_.-]+\\/u.test(content)
    ) {
      throw new Error(`HTML output contains an absolute local path: ${name}`);
    }
  }
}

function writeHtmlPrototype(outputRoot, model) {
  const outputs = buildHtmlOutputMap(model);
  validateHtmlOutputMap(outputs);
  const packageDirectory = absolute(outputRoot, PACKAGE_PATH);
  const targetDirectory = path.join(packageDirectory, "demo");
  const lockPath = path.join(packageDirectory, ".html-generation.lock");
  fs.mkdirSync(packageDirectory, { recursive: true });
  let lockHandle;
  let stagingDirectory;
  let backupDirectory;
  let operationError;
  try {
    lockHandle = fs.openSync(lockPath, "wx");
    stagingDirectory = fs.mkdtempSync(path.join(packageDirectory, ".demo-next-"));
    for (const [name, content] of outputs) {
      fs.writeFileSync(path.join(stagingDirectory, name), content, {
        encoding: "utf8",
        flag: "wx",
      });
    }
    for (const name of outputs.keys()) {
      if (!fs.lstatSync(path.join(stagingDirectory, name)).isFile()) {
        throw new Error(`HTML staging output is not a regular file: ${name}`);
      }
    }
    const stagedEntries = fs
      .readdirSync(stagingDirectory)
      .sort((left, right) => left.localeCompare(right, "en"));
    const expectedEntries = [...outputs.keys()].sort((left, right) =>
      left.localeCompare(right, "en"),
    );
    if (JSON.stringify(stagedEntries) !== JSON.stringify(expectedEntries)) {
      throw new Error("HTML staging directory contains unexpected files");
    }
    if (fs.existsSync(targetDirectory)) {
      backupDirectory = path.join(
        packageDirectory,
        `.demo-backup-${process.pid}-${Date.now()}`,
      );
      fs.renameSync(targetDirectory, backupDirectory);
    }
    try {
      fs.renameSync(stagingDirectory, targetDirectory);
      stagingDirectory = null;
    } catch (publishError) {
      if (backupDirectory && fs.existsSync(backupDirectory)) {
        try {
          fs.renameSync(backupDirectory, targetDirectory);
          backupDirectory = null;
        } catch (rollbackError) {
          throw new AggregateError(
            [publishError, rollbackError],
            `HTML publication and rollback failed; preserved backup: ${backupDirectory}`,
          );
        }
      }
      throw publishError;
    }
    if (backupDirectory) {
      try {
        fs.rmSync(backupDirectory, {
          recursive: true,
          force: true,
          maxRetries: 3,
          retryDelay: 50,
        });
        backupDirectory = null;
      } catch (backupCleanupError) {
        const failedPublicationDirectory = path.join(
          packageDirectory,
          `.demo-failed-publication-${process.pid}-${Date.now()}`,
        );
        try {
          fs.renameSync(targetDirectory, failedPublicationDirectory);
          fs.renameSync(backupDirectory, targetDirectory);
          backupDirectory = null;
        } catch (rollbackError) {
          throw new AggregateError(
            [backupCleanupError, rollbackError],
            "HTML backup cleanup and publication rollback failed; preserved available copies",
          );
        }
        try {
          fs.rmSync(failedPublicationDirectory, {
            recursive: true,
            force: true,
            maxRetries: 3,
            retryDelay: 50,
          });
        } catch (failedPublicationCleanupError) {
          throw new AggregateError(
            [backupCleanupError, failedPublicationCleanupError],
            `Previous HTML restored; failed publication preserved: ${failedPublicationDirectory}`,
          );
        }
        throw backupCleanupError;
      }
    }
  } catch (error) {
    operationError = error;
    throw error;
  } finally {
    const cleanupErrors = [];
    if (stagingDirectory) {
      try {
        fs.rmSync(stagingDirectory, { recursive: true, force: true });
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
    }
    if (lockHandle !== undefined) {
      try {
        fs.closeSync(lockHandle);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      } finally {
        try {
          fs.rmSync(lockPath, { force: true });
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError);
        }
      }
    }
    if (cleanupErrors.length > 0) {
      if (operationError) {
        throw new AggregateError(
          [operationError, ...cleanupErrors],
          "HTML generation failed and cleanup was incomplete",
        );
      }
      throw new AggregateError(cleanupErrors, "HTML generation cleanup was incomplete");
    }
  }
}

export function generateHtmlPrototype({
  sourceRoot = process.cwd(),
  outputRoot = process.cwd(),
} = {}) {
  const contracts = loadContracts(sourceRoot);
  const issues = validateContracts(sourceRoot, contracts);
  if (issues.length) {
    throw new Error(`contract validation failed:\n- ${issues.join("\n- ")}`);
  }
  const model = buildNormalizedModel(contracts);
  writeHtmlPrototype(outputRoot, model);
  return {
    model,
    generatedPaths: [...htmlPrototypePaths],
  };
}

export function compareGeneratedHtml(root = process.cwd()) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-html-check-"));
  try {
    const generated = generateHtmlPrototype({ sourceRoot: root, outputRoot: tempRoot });
    const differences = [];
    for (const relativePath of generated.generatedPaths) {
      const expected = absolute(root, relativePath);
      const actual = absolute(tempRoot, relativePath);
      if (!fs.existsSync(expected)) {
        differences.push(`missing generated HTML output: ${relativePath}`);
        continue;
      }
      if (!fs.readFileSync(expected).equals(fs.readFileSync(actual))) {
        differences.push(`stale generated HTML output: ${relativePath}`);
      }
    }
    return differences;
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function renderPng(svgPath, pngPath) {
  ensureParent(pngPath);
  const result = spawnSync(
    "rsvg-convert",
    ["-w", "390", "-h", "844", "-f", "png", svgPath, "-o", pngPath],
    {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        SOURCE_DATE_EPOCH: "0",
      },
    },
  );
  if (result.status !== 0) {
    throw new Error(`rsvg-convert failed for ${svgPath}: ${result.stderr || result.stdout}`);
  }
}

function normalizeCapturedPng(rawBytes, tempRoot, stateId) {
  const normalizationRoot = path.join(tempRoot, "normalized");
  const svgPath = path.join(normalizationRoot, `${stateId}.svg`);
  const pngPath = path.join(normalizationRoot, `${stateId}.png`);
  ensureParent(svgPath);
  fs.writeFileSync(
    svgPath,
    [
      '<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">',
      `  <image x="0" y="0" width="390" height="844" href="data:image/png;base64,${rawBytes.toString("base64")}"/>`,
      "</svg>",
      "",
    ].join("\n"),
  );
  renderPng(svgPath, pngPath);
  return fs.readFileSync(pngPath);
}

function validateCapturedFrame(state, record) {
  const issues = [];
  if (record.state_id !== state.id) {
    issues.push(`ожидалось состояние ${state.id}, получено ${record.state_id}`);
  }
  if (record.projection_sha256 !== state.projection_sha256) {
    issues.push("не совпадает проекция канонического состояния");
  }
  if (
    record.document_width !== 390 ||
    record.phone.width > 375 ||
    record.phone.height > 812 ||
    record.phone.left < -1 ||
    record.phone.right > 391 ||
    record.phone.top < -1 ||
    record.phone.bottom > 845
  ) {
    issues.push("экран не помещается в кадр 390×844");
  }
  if (record.console_errors.length > 0 || record.page_errors.length > 0) {
    issues.push(
      `ошибки браузера: ${[...record.console_errors, ...record.page_errors].join("; ")}`,
    );
  }
  if (
    !["BODY", "HTML"].includes(record.active_element_tag) ||
    record.active_action_id !== null
  ) {
    issues.push("перед созданием кадра не снят программный фокус");
  }
  const notificationSurface = state.kind.startsWith("notification");
  if (state.kind === "viewer") {
    if (
      record.viewer_surface_count !== 1 ||
      record.viewer_toolbar_count !== 1 ||
      record.viewer_slide_count !== 3 ||
      record.composer_count !== 0 ||
      !record.visible_action_labels.includes("Отправить презентацию на почту")
    ) {
      issues.push("просмотрщик не содержит три слайда, панель управления и отправку на почту");
    }
  } else if (notificationSurface) {
    if (record.notification_surface_count !== 1 || record.composer_count !== 0) {
      issues.push("центр уведомлений не должен содержать поле ввода чата");
    }
  } else if (record.composer_count !== 1) {
    issues.push("экран чата должен содержать одно поле ввода");
  }
  if (state.id === "lisa-presentation-generating") {
    if (
      record.clock_overlay_count !== 1 ||
      record.clock_mode !== "static" ||
      !record.clock_text?.includes("Проходит 20 минут") ||
      !record.clock_text?.includes("13:24 → 13:44")
    ) {
      issues.push("кадр подготовки не содержит согласованные часы и сжатие 20 минут");
    }
  }
  if (
    state.id === "lisa-materials-ready" &&
    (record.material_section_count !== 7 ||
      !record.visible_action_labels.includes("Заказать презентацию"))
  ) {
    issues.push("начальный кадр не содержит семь разделов материалов и кнопку заказа");
  }
  if (
    state.notification_unread === true &&
    state.kind !== "viewer" &&
    record.notification_dot_count !== 1
  ) {
    issues.push("непрочитанное событие не обозначено красной точкой у колокольчика");
  }
  if (
    state.id === "lisa-returned-to-chat" &&
    !record.visible_action_labels.includes("Отправить презентацию на почту")
  ) {
    issues.push("после возврата в чат отсутствует отправка презентации на почту");
  }
  if (issues.length > 0) {
    throw new Error(`Кадр ${state.id} не прошёл проверку соответствия HTML:\n- ${issues.join("\n- ")}`);
  }
}

function captureHtmlFrames(
  sourceRoot,
  outputRoot,
  model,
  captureEngine,
  captureStabilization,
  captureTransport,
) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-frames-"));
  const requestPath = path.join(tempRoot, "request.json");
  const reportPath = path.join(tempRoot, "report.json");
  const frameRoot = path.join(tempRoot, "frames");
  try {
    const outputFontPath = absolute(outputRoot, FONT_RELATIVE_PATH);
    if (!fs.existsSync(outputFontPath)) {
      ensureParent(outputFontPath);
      fs.copyFileSync(absolute(sourceRoot, FONT_RELATIVE_PATH), outputFontPath);
    }
    fs.writeFileSync(
      requestPath,
      stableStringify({
        version: "1.0.0",
        demo_path: absolute(outputRoot, `${PACKAGE_PATH}/demo/index.html`),
        output_directory: frameRoot,
        viewport: { width: 390, height: 844 },
        capture_engine: captureEngine,
        capture_stabilization: captureStabilization,
        capture_transport: captureTransport,
        states: model.states.map((state) => ({
          id: state.id,
          projection_sha256: state.projection_sha256,
        })),
      }),
    );
    const helperPath = absolute(
      sourceRoot,
      "scripts/capture-presentation-link-lisa-derived-frames.mjs",
    );
    const result = spawnSync(process.execPath, [helperPath, requestPath, reportPath], {
      cwd: sourceRoot,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        TZ: "UTC",
      },
    });
    if (result.status !== 0) {
      throw new Error(
        `Не удалось создать кадры из HTML: ${result.stderr || result.stdout}`,
      );
    }
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    if (
      report.version !== "1.0.0" ||
      report.network_requests !== 0 ||
      report.viewport?.width !== 390 ||
      report.viewport?.height !== 844 ||
      report.capture_engine !== captureEngine ||
      stableStringify(report.capture_stabilization) !==
        stableStringify(captureStabilization) ||
      stableStringify(report.capture_transport) !==
        stableStringify(captureTransport) ||
      !Number.isInteger(report.virtual_origin_requests) ||
      report.virtual_origin_requests < model.states.length ||
      !Number.isInteger(report.tooling_console_messages) ||
      report.tooling_console_messages < 0 ||
      report.records?.length !== model.states.length
    ) {
      throw new Error("Отчёт создания кадров из HTML не соответствует контракту.");
    }
    const frames = new Map();
    for (const state of model.states) {
      const record = report.records.find((candidate) => candidate.state_id === state.id);
      if (!record || path.basename(record.frame_path) !== `${state.id}.png`) {
        throw new Error(`В отчёте отсутствует кадр ${state.id}.`);
      }
      validateCapturedFrame(state, record);
      const framePath = path.join(frameRoot, path.basename(record.frame_path));
      const rawBytes = fs.readFileSync(framePath);
      const rawDimensions = pngDimensionsFromBytes(rawBytes);
      const bytes = normalizeCapturedPng(rawBytes, tempRoot, state.id);
      const dimensions = pngDimensionsFromBytes(bytes);
      if (
        rawDimensions.width !== 390 ||
        rawDimensions.height !== 844 ||
        dimensions.width !== rawDimensions.width ||
        dimensions.height !== rawDimensions.height
      ) {
        throw new Error(
          `Нормализация изменила размер кадра ${state.id}: ` +
            `${rawDimensions.width}×${rawDimensions.height} → ` +
            `${dimensions.width}×${dimensions.height}.`,
        );
      }
      assertLosslessPngPixels(rawBytes, bytes, state.id);
      frames.set(state.id, {
        bytes,
        sha256: sha256Bytes(bytes),
      });
    }
    return {
      browser: report.browser,
      toolingConsoleMessages: report.tooling_console_messages,
      frames,
    };
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function renderCapturedScreenSvg(state, capture, visualInputSha256) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844" role="img" aria-labelledby="screen-title screen-desc" data-state-id="${escapeXml(state.id)}" data-projection-sha256="${state.projection_sha256}" data-visual-input-sha256="${visualInputSha256}" data-render-source="owner-approved-html" data-capture-sha256="${capture.sha256}">`,
    `  <title id="screen-title">${escapeXml(state.title)}</title>`,
    `  <desc id="screen-desc">${escapeXml([state.body, ...state.detail_lines].join(" "))}</desc>`,
    `  <image x="0" y="0" width="390" height="844" href="data:image/png;base64,${capture.bytes.toString("base64")}"/>`,
    "</svg>",
    "",
  ].join("\n");
}

function sourceInputPaths(contracts) {
  return [
    ...Object.values(CONTRACT_PATHS),
    ...Object.values(SCHEMA_PATHS),
    ...contracts.visual.components.map(
      (component) => `${PACKAGE_PATH}/source/${component.source_svg}`,
    ),
    FONT_RELATIVE_PATH,
    FONT_LICENSE_RELATIVE_PATH,
    "scripts/capture-presentation-link-lisa-derived-frames.mjs",
    "scripts/generate-presentation-link-lisa-user-journey.mjs",
    "scripts/lib/presentation-link-lisa-html-runtime.mjs",
    "scripts/lib/presentation-link-lisa-user-journey.mjs",
  ];
}

function manifestFor(
  root,
  sourceRoot,
  contracts,
  model,
  generatedPaths,
  frameCapture,
  captureEngine,
  captureStabilization,
  captureTransport,
  toolingConsoleMessages,
) {
  const inputs = sourceInputPaths(contracts)
    .map((relativePath) => ({
      path: relativePath.replace(`${PACKAGE_PATH}/`, ""),
      bytes: fs.statSync(absolute(sourceRoot, relativePath)).size,
      sha256: sha256File(absolute(sourceRoot, relativePath)),
    }))
    .sort((left, right) => left.path.localeCompare(right.path, "en"));
  const outputs = generatedPaths.map((relativePath) => ({
    path: relativePath.replace(`${PACKAGE_PATH}/`, ""),
    bytes: fs.statSync(absolute(root, relativePath)).size,
    sha256: sha256File(absolute(root, relativePath)),
  }));
  return {
    version: "1.0.0",
    status: "generated",
    deterministic_epoch: FIXED_EPOCH,
    state_count: model.states.length,
    inputs,
    inventory: {
      generated_output_count: generatedPaths.length + 1,
      exact_generated_paths: [
        ...generatedPaths.map((relativePath) => relativePath.replace(`${PACKAGE_PATH}/`, "")),
        "derived/prototype-package-manifest.json",
      ].sort((left, right) => left.localeCompare(right, "en")),
    },
    outputs,
    self: {
      path: "derived/prototype-package-manifest.json",
      sha256: null,
      reason: "Самохэширование невозможно; хэш хранится во внешнем реестре артефактов.",
    },
    generation: {
      command: "npm run generate:presentation-link-lisa-user-journey",
      frame_capture: frameCapture,
      capture_engine: captureEngine,
      capture_stabilization: captureStabilization,
      capture_transport: captureTransport,
      capture_normalization:
        contracts.package.reproducibility.capture_normalization,
      tooling_console_messages: toolingConsoleMessages,
      renderer: "rsvg-convert",
      viewport: "390x844",
      network_required: false,
    },
    portability: {
      entrypoint: "demo/index.html",
      file_scheme_supported: true,
      relative_resources_only: true,
    },
  };
}

function mirrorRuntimeAssetsForPortableCapture(
  sourceRoot,
  outputRoot,
  contracts,
) {
  if (path.resolve(sourceRoot) === path.resolve(outputRoot)) return;
  for (const asset of contracts.package.source_assets) {
    const sourcePath = absolute(sourceRoot, `${PACKAGE_PATH}/${asset.path}`);
    const sourceStat = fs.lstatSync(sourcePath);
    if (!sourceStat.isFile() || sourceStat.isSymbolicLink()) {
      throw new Error(`portable runtime asset must be a regular file: ${asset.path}`);
    }
    if (sha256File(sourcePath) !== asset.sha256) {
      throw new Error(`portable runtime asset hash differs from contract: ${asset.path}`);
    }
    const targetPath = absolute(outputRoot, `${PACKAGE_PATH}/${asset.path}`);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, fs.readFileSync(sourcePath));
  }
}

export function generatePrototypePackage({
  sourceRoot = process.cwd(),
  outputRoot = process.cwd(),
  renderRaster = true,
} = {}) {
  const contracts = loadContracts(sourceRoot);
  const issues = validateContracts(sourceRoot, contracts);
  if (issues.length) {
    throw new Error(`contract validation failed:\n- ${issues.join("\n- ")}`);
  }
  if (
    contracts.journey.status !== "owner-approved-prototype" ||
    contracts.preview.status !== "owner-approved-prototype"
  ) {
    throw new Error(
      "full visual generation requires owner-approved-prototype status in journey and presentation preview contracts",
    );
  }
  const model = buildNormalizedModel(contracts);
  const assets = loadRenderAssets(sourceRoot, contracts);
  const generatedPaths = generatedPathsForStates(model.states);

  mirrorRuntimeAssetsForPortableCapture(sourceRoot, outputRoot, contracts);
  writeHtmlPrototype(outputRoot, model);
  writeFile(
    outputRoot,
    `${PACKAGE_PATH}/derived/projection-map.json`,
    stableStringify({
      version: "1.0.0",
      states: model.states.map((state) => ({
        state_id: state.id,
        projection_sha256: state.projection_sha256,
        result_ref: state.result_ref ?? null,
      })),
    }),
  );
  const captureStabilization =
    contracts.package.reproducibility.capture_stabilization;
  const captureEngine =
    contracts.package.reproducibility.capture_engine;
  const captureTransport =
    contracts.package.reproducibility.capture_transport;
  const capturedFrames = captureHtmlFrames(
    sourceRoot,
    outputRoot,
    model,
    captureEngine,
    captureStabilization,
    captureTransport,
  );

  for (const state of model.states) {
    const svgRelative = `${PACKAGE_PATH}/derived/screens/${state.id}.svg`;
    const pngRelative = `${PACKAGE_PATH}/derived/screens/${state.id}.png`;
    writeFile(
      outputRoot,
      svgRelative,
      renderCapturedScreenSvg(
        state,
        capturedFrames.frames.get(state.id),
        assets.visualInputSha256,
      ),
    );
    if (renderRaster) {
      renderPng(absolute(outputRoot, svgRelative), absolute(outputRoot, pngRelative));
    }
  }

  if (!renderRaster) {
    for (const state of model.states) {
      const pngRelative = `${PACKAGE_PATH}/derived/screens/${state.id}.png`;
      const sourcePng = absolute(sourceRoot, pngRelative);
      if (!fs.existsSync(sourcePng)) {
        throw new Error(`PNG source required when renderRaster=false: ${pngRelative}`);
      }
      writeFile(outputRoot, pngRelative, fs.readFileSync(sourcePng));
    }
  }

  const manifest = manifestFor(
    outputRoot,
    sourceRoot,
    contracts,
    model,
    generatedPaths,
    capturedFrames.browser,
    captureEngine,
    captureStabilization,
    captureTransport,
    capturedFrames.toolingConsoleMessages,
  );
  writeFile(
    outputRoot,
    `${PACKAGE_PATH}/derived/prototype-package-manifest.json`,
    stableStringify(manifest),
  );

  return {
    model,
    generatedPaths: [
      ...generatedPaths,
      `${PACKAGE_PATH}/derived/prototype-package-manifest.json`,
    ],
    manifest,
  };
}

export function compareGeneratedPackage(root = process.cwd()) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-package-check-"));
  try {
    const generated = generatePrototypePackage({ sourceRoot: root, outputRoot: tempRoot });
    const differences = [];
    for (const relativePath of generated.generatedPaths) {
      const expected = absolute(root, relativePath);
      const actual = absolute(tempRoot, relativePath);
      if (!fs.existsSync(expected)) {
        differences.push(`missing generated output: ${relativePath}`);
        continue;
      }
      if (!fs.readFileSync(expected).equals(fs.readFileSync(actual))) {
        differences.push(`stale generated output: ${relativePath}`);
      }
    }
    return differences;
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function scanXmlTags(xml) {
  const tags = [];
  let index = 0;
  while (index < xml.length) {
    const start = xml.indexOf("<", index);
    if (start === -1) break;
    if (xml.startsWith("<!--", start)) {
      const commentEnd = xml.indexOf("-->", start + 4);
      if (commentEnd === -1) throw new Error("unterminated XML comment");
      index = commentEnd + 3;
      continue;
    }
    const endMarker = xml[start + 1];
    if (endMarker === "?" || endMarker === "!") {
      const declarationEnd = xml.indexOf(">", start + 2);
      if (declarationEnd === -1) throw new Error("unterminated XML declaration");
      tags.push({ declaration: xml.slice(start, declarationEnd + 1) });
      index = declarationEnd + 1;
      continue;
    }
    let cursor = start + 1;
    let quote = null;
    while (cursor < xml.length) {
      const char = xml[cursor];
      if (quote) {
        if (char === quote) quote = null;
      } else if (char === '"' || char === "'") {
        quote = char;
      } else if (char === ">") {
        break;
      }
      cursor += 1;
    }
    if (cursor >= xml.length) throw new Error("unterminated XML tag");
    const raw = xml.slice(start + 1, cursor).trim();
    if (!raw.startsWith("/")) {
      const selfClosing = raw.endsWith("/");
      const clean = selfClosing ? raw.slice(0, -1).trim() : raw;
      let nameEnd = 0;
      while (nameEnd < clean.length && !/\s/u.test(clean[nameEnd])) nameEnd += 1;
      const name = clean.slice(0, nameEnd);
      const attrs = {};
      let attrIndex = nameEnd;
      while (attrIndex < clean.length) {
        while (/\s/u.test(clean[attrIndex])) attrIndex += 1;
        if (attrIndex >= clean.length) break;
        let attrEnd = attrIndex;
        while (attrEnd < clean.length && !/[\s=]/u.test(clean[attrEnd])) attrEnd += 1;
        const attrName = clean.slice(attrIndex, attrEnd);
        attrIndex = attrEnd;
        while (/\s/u.test(clean[attrIndex])) attrIndex += 1;
        if (clean[attrIndex] !== "=") throw new Error(`attribute without value: ${attrName}`);
        attrIndex += 1;
        while (/\s/u.test(clean[attrIndex])) attrIndex += 1;
        const attrQuote = clean[attrIndex];
        if (attrQuote !== '"' && attrQuote !== "'") {
          throw new Error(`unquoted attribute: ${attrName}`);
        }
        attrIndex += 1;
        const valueStart = attrIndex;
        while (attrIndex < clean.length && clean[attrIndex] !== attrQuote) attrIndex += 1;
        if (attrIndex >= clean.length) throw new Error(`unterminated attribute: ${attrName}`);
        attrs[attrName] = clean.slice(valueStart, attrIndex);
        attrIndex += 1;
      }
      tags.push({ name, attrs, selfClosing });
    }
    index = cursor + 1;
  }
  return tags;
}

export function validateSvgSecurity(svg, limits = {}) {
  const issues = [];
  const allowedElements = new Set([
    "svg",
    "title",
    "desc",
    "g",
    "rect",
    "circle",
    "ellipse",
    "line",
    "path",
    "text",
    "tspan",
    "defs",
    "linearGradient",
    "radialGradient",
    "stop",
    "clipPath",
    "image",
  ]);
  const allowedAttributes = new Set([
    "xmlns",
    "width",
    "height",
    "viewBox",
    "role",
    "aria-labelledby",
    "id",
    "class",
    "data-state-id",
    "data-projection-sha256",
    "data-visual-input-sha256",
    "data-component-source-sha256",
    "data-render-source",
    "data-capture-sha256",
    "data-component-id",
    "data-action-id",
    "href",
    "x",
    "y",
    "x1",
    "y1",
    "x2",
    "y2",
    "cx",
    "cy",
    "r",
    "rx",
    "ry",
    "d",
    "fill",
    "fill-opacity",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-opacity",
    "opacity",
    "transform",
    "font-family",
    "font-size",
    "font-weight",
    "text-anchor",
    "dy",
    "offset",
    "stop-color",
    "stop-opacity",
    "clip-path",
    "gradientUnits",
    "gradientTransform",
  ]);
  const maxBytes = limits.component_max_bytes ?? 262144;
  if (Buffer.byteLength(svg) > maxBytes) issues.push(`SVG exceeds ${maxBytes} bytes`);
  if (svg.includes("<!DOCTYPE") || svg.includes("<!ENTITY")) {
    issues.push("SVG declarations and entities are forbidden");
  }
  let tags;
  try {
    tags = scanXmlTags(svg);
  } catch (error) {
    return [...issues, `SVG parse failed: ${error.message}`];
  }
  if (tags.length > (limits.max_nodes ?? 500)) {
    issues.push(`SVG node count exceeds ${limits.max_nodes ?? 500}`);
  }
  let totalPathData = 0;
  const ids = new Set();
  for (const tag of tags) {
    if (tag.declaration) {
      if (!tag.declaration.startsWith("<?xml")) {
        issues.push(`forbidden SVG declaration: ${tag.declaration.slice(0, 32)}`);
      }
      continue;
    }
    if (!allowedElements.has(tag.name)) {
      issues.push(`forbidden SVG element: ${tag.name}`);
    }
    for (const [name, value] of Object.entries(tag.attrs)) {
      if (name.toLowerCase().startsWith("on")) {
        issues.push(`event attribute is forbidden: ${name}`);
      } else if (!allowedAttributes.has(name)) {
        issues.push(`forbidden SVG attribute: ${name}`);
      }
      if (name === "id") {
        if (ids.has(value)) issues.push(`duplicate SVG id: ${value}`);
        ids.add(value);
      }
      if (name === "d") {
        totalPathData += value.length;
        if (value.length > (limits.single_path_data_max_chars ?? 25000)) {
          issues.push("single SVG path exceeds complexity limit");
        }
      }
      if (name === "href") {
        if (!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/u.test(value)) {
          issues.push(`only embedded PNG data is allowed in SVG href`);
        }
      } else if (
        name !== "xmlns" &&
        /^(?:https?:|file:|data:|javascript:)/iu.test(value)
      ) {
        issues.push(`external or executable SVG value is forbidden: ${name}`);
      }
      if (name === "clip-path" && !/^url\(#[A-Za-z][A-Za-z0-9._:-]*\)$/u.test(value)) {
        issues.push(`non-local clip-path is forbidden: ${value}`);
      }
    }
  }
  if (totalPathData > (limits.total_path_data_max_chars ?? 200000)) {
    issues.push("total SVG path data exceeds complexity limit");
  }
  return issues;
}

function pngDimensionsFromBytes(bytes, label = "PNG") {
  if (bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    throw new Error(`invalid PNG signature: ${label}`);
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function pngDimensions(filePath) {
  return pngDimensionsFromBytes(fs.readFileSync(filePath), filePath);
}

function paethPredictor(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  if (aboveDistance <= upperLeftDistance) return above;
  return upperLeft;
}

function decodePngRgba(bytes, label) {
  const dimensions = pngDimensionsFromBytes(bytes, label);
  const bitDepth = bytes[24];
  const colorType = bytes[25];
  const compressionMethod = bytes[26];
  const filterMethod = bytes[27];
  const interlaceMethod = bytes[28];
  const channelCount = new Map([
    [0, 1],
    [2, 3],
    [4, 2],
    [6, 4],
  ]).get(colorType);
  if (
    bitDepth !== 8 ||
    channelCount === undefined ||
    compressionMethod !== 0 ||
    filterMethod !== 0 ||
    interlaceMethod !== 0
  ) {
    throw new Error(
      `unsupported PNG encoding: ${label}; bit_depth=${bitDepth}, color_type=${colorType}, interlace=${interlaceMethod}`,
    );
  }

  const idatChunks = [];
  let offset = 8;
  let sawIend = false;
  while (offset + 12 <= bytes.length) {
    const chunkLength = bytes.readUInt32BE(offset);
    const chunkType = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    const chunkEnd = offset + 12 + chunkLength;
    if (chunkEnd > bytes.length) {
      throw new Error(`truncated PNG chunk: ${label}`);
    }
    if (chunkType === "IDAT") {
      idatChunks.push(bytes.subarray(offset + 8, offset + 8 + chunkLength));
    }
    offset = chunkEnd;
    if (chunkType === "IEND") {
      sawIend = true;
      break;
    }
  }
  if (!sawIend || idatChunks.length === 0) {
    throw new Error(`PNG image data is incomplete: ${label}`);
  }

  const rowByteCount = dimensions.width * channelCount;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  const expectedInflatedBytes = (rowByteCount + 1) * dimensions.height;
  if (inflated.length !== expectedInflatedBytes) {
    throw new Error(
      `unexpected PNG image data size: ${label}; expected ${expectedInflatedBytes}, got ${inflated.length}`,
    );
  }

  const rgba = Buffer.alloc(dimensions.width * dimensions.height * 4);
  let sourceOffset = 0;
  let targetOffset = 0;
  let previousRow = Buffer.alloc(rowByteCount);
  for (let y = 0; y < dimensions.height; y += 1) {
    const filterType = inflated[sourceOffset];
    sourceOffset += 1;
    const filteredRow = inflated.subarray(sourceOffset, sourceOffset + rowByteCount);
    sourceOffset += rowByteCount;
    const row = Buffer.allocUnsafe(rowByteCount);
    for (let x = 0; x < rowByteCount; x += 1) {
      const left = x >= channelCount ? row[x - channelCount] : 0;
      const above = previousRow[x];
      const upperLeft = x >= channelCount ? previousRow[x - channelCount] : 0;
      let predictor;
      if (filterType === 0) predictor = 0;
      else if (filterType === 1) predictor = left;
      else if (filterType === 2) predictor = above;
      else if (filterType === 3) predictor = Math.floor((left + above) / 2);
      else if (filterType === 4) {
        predictor = paethPredictor(left, above, upperLeft);
      } else {
        throw new Error(`unsupported PNG row filter ${filterType}: ${label}`);
      }
      row[x] = (filteredRow[x] + predictor) & 0xff;
    }

    for (let x = 0; x < dimensions.width; x += 1) {
      const pixelOffset = x * channelCount;
      if (colorType === 0) {
        rgba[targetOffset] = row[pixelOffset];
        rgba[targetOffset + 1] = row[pixelOffset];
        rgba[targetOffset + 2] = row[pixelOffset];
        rgba[targetOffset + 3] = 255;
      } else if (colorType === 2) {
        rgba[targetOffset] = row[pixelOffset];
        rgba[targetOffset + 1] = row[pixelOffset + 1];
        rgba[targetOffset + 2] = row[pixelOffset + 2];
        rgba[targetOffset + 3] = 255;
      } else if (colorType === 4) {
        rgba[targetOffset] = row[pixelOffset];
        rgba[targetOffset + 1] = row[pixelOffset];
        rgba[targetOffset + 2] = row[pixelOffset];
        rgba[targetOffset + 3] = row[pixelOffset + 1];
      } else {
        rgba[targetOffset] = row[pixelOffset];
        rgba[targetOffset + 1] = row[pixelOffset + 1];
        rgba[targetOffset + 2] = row[pixelOffset + 2];
        rgba[targetOffset + 3] = row[pixelOffset + 3];
      }
      targetOffset += 4;
    }
    previousRow = row;
  }
  return { ...dimensions, rgba };
}

export function assertLosslessPngPixels(beforeBytes, afterBytes, label = "PNG") {
  const before = decodePngRgba(beforeBytes, `${label}: исходный PNG`);
  const after = decodePngRgba(afterBytes, `${label}: нормализованный PNG`);
  if (
    before.width !== after.width ||
    before.height !== after.height ||
    !before.rgba.equals(after.rgba)
  ) {
    const sharedPixelCount = Math.min(before.rgba.length, after.rgba.length) / 4;
    let firstDifferentPixel = 0;
    while (
      firstDifferentPixel < sharedPixelCount &&
      before.rgba
        .subarray(firstDifferentPixel * 4, firstDifferentPixel * 4 + 4)
        .equals(
          after.rgba.subarray(
            firstDifferentPixel * 4,
            firstDifferentPixel * 4 + 4,
          ),
        )
    ) {
      firstDifferentPixel += 1;
    }
    const x = firstDifferentPixel % Math.max(1, before.width);
    const y = Math.floor(firstDifferentPixel / Math.max(1, before.width));
    throw new Error(
      `Нормализация изменила пиксели кадра ${label}: первое различие x=${x}, y=${y}; ` +
        `${before.width}×${before.height} → ${after.width}×${after.height}.`,
    );
  }
}

function listRegularFiles(rootDirectory) {
  if (!fs.existsSync(rootDirectory)) return [];
  const files = [];
  const visit = (currentDirectory) => {
    for (const entry of fs.readdirSync(currentDirectory, { withFileTypes: true })) {
      const target = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (entry.isFile()) files.push(target);
      else files.push(target);
    }
  };
  visit(rootDirectory);
  return files;
}

function isSafePackageOutputPath(relativePath) {
  return (
    typeof relativePath === "string" &&
    relativePath.length > 0 &&
    !path.posix.isAbsolute(relativePath) &&
    !relativePath.includes("\\") &&
    path.posix.normalize(relativePath) === relativePath &&
    relativePath !== ".." &&
    !relativePath.startsWith("../")
  );
}

export function validateGeneratedPackage(
  outputRoot = process.cwd(),
  sourceRoot = outputRoot,
) {
  const contracts = loadContracts(sourceRoot);
  const issues = validateContracts(sourceRoot, contracts);
  const model = buildNormalizedModel(contracts);
  const packageRoot = absolute(outputRoot, PACKAGE_PATH);
  const manifestRelativePath = "derived/prototype-package-manifest.json";
  const manifestPath = path.join(packageRoot, manifestRelativePath);
  if (!fs.existsSync(manifestPath)) {
    return [...issues, "prototype package manifest is missing"];
  }
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    return [...issues, `prototype package manifest is invalid: ${error.message}`];
  }
  const expectedOutputs = generatedPathsForStates(model.states)
    .map((relativePath) => relativePath.replace(`${PACKAGE_PATH}/`, ""))
    .sort((left, right) => left.localeCompare(right, "en"));
  const expectedInventory = [...expectedOutputs, manifestRelativePath].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
  const manifestOutputs = Array.isArray(manifest.outputs) ? manifest.outputs : [];
  if (!Array.isArray(manifest.outputs)) {
    issues.push("prototype package manifest outputs must be an array");
  }
  const outputPaths = manifestOutputs.map((output) => output?.path);
  if (new Set(outputPaths).size !== outputPaths.length) {
    issues.push("prototype package manifest contains duplicate output paths");
  }
  const safeOutputPaths = [];
  for (const output of manifestOutputs) {
    if (!isSafePackageOutputPath(output?.path)) {
      issues.push(`manifest output path escapes package: ${String(output?.path)}`);
      continue;
    }
    safeOutputPaths.push(output.path);
    const target = path.resolve(packageRoot, output.path);
    if (!target.startsWith(`${path.resolve(packageRoot)}${path.sep}`)) {
      issues.push(`manifest output path escapes package: ${output.path}`);
      continue;
    }
    if (!fs.existsSync(target)) {
      issues.push(`manifest output is missing: ${output.path}`);
      continue;
    }
    if (sha256File(target) !== output.sha256) {
      issues.push(`manifest hash mismatch: ${output.path}`);
    }
  }
  const sortedSafeOutputPaths = [...safeOutputPaths].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
  if (JSON.stringify(sortedSafeOutputPaths) !== JSON.stringify(expectedOutputs)) {
    issues.push("prototype package manifest output inventory differs from the contract");
  }
  if (
    JSON.stringify(
      [...(manifest.inventory?.exact_generated_paths ?? [])].sort((left, right) =>
        left.localeCompare(right, "en"),
      ),
    ) !== JSON.stringify(expectedInventory)
  ) {
    issues.push("prototype package exact generated paths differ from the contract");
  }
  if (manifest.inventory?.generated_output_count !== expectedInventory.length) {
    issues.push("prototype package generated output count differs from the contract");
  }
  const actualOutputs = [
    ...listRegularFiles(path.join(packageRoot, "demo")),
    ...listRegularFiles(path.join(packageRoot, "derived")),
  ]
    .map((filePath) => path.relative(packageRoot, filePath).split(path.sep).join("/"))
    .sort((left, right) => left.localeCompare(right, "en"));
  for (const actualOutput of actualOutputs) {
    if (!expectedInventory.includes(actualOutput)) {
      issues.push(`unregistered generated output: ${actualOutput}`);
    }
  }
  for (const expectedOutput of expectedInventory) {
    if (!actualOutputs.includes(expectedOutput)) {
      issues.push(`registered generated output is missing: ${expectedOutput}`);
    }
  }

  const demoRelativePaths = [
    "demo/index.html",
    "demo/app.js",
    "demo/styles.css",
    "demo/data.js",
  ];
  const missingDemoPaths = demoRelativePaths.filter(
    (relativePath) => !fs.existsSync(path.join(packageRoot, relativePath)),
  );
  for (const relativePath of missingDemoPaths) {
    issues.push(`portable demo resource is missing: ${relativePath}`);
  }
  const demoText = demoRelativePaths
    .filter((relativePath) => !missingDemoPaths.includes(relativePath))
    .map((relativePath) => fs.readFileSync(path.join(packageRoot, relativePath), "utf8"))
    .join("\n")
    .replaceAll("http://www.w3.org/2000/svg", "");
  for (const forbidden of [
    "/Users/",
    "localhost",
    "http://",
    "https://",
    "innerHTML",
    "document.write",
    "new Function",
    "eval(",
    "fetch(",
  ]) {
    if (demoText.includes(forbidden)) {
      issues.push(`portable demo contains forbidden token: ${forbidden}`);
    }
  }

  for (const state of model.states) {
    const svgPath = path.join(packageRoot, `derived/screens/${state.id}.svg`);
    const pngPath = path.join(packageRoot, `derived/screens/${state.id}.png`);
    if (!fs.existsSync(svgPath)) {
      issues.push(`state SVG is missing: ${state.id}`);
      continue;
    }
    const svg = fs.readFileSync(svgPath, "utf8");
    issues.push(
      ...validateSvgSecurity(svg, contracts.visual.svg_security_limits).map(
        (issue) => `${state.id}: ${issue}`,
      ),
    );
    if (!svg.includes(`data-projection-sha256="${state.projection_sha256}"`)) {
      issues.push(`SVG projection mismatch: ${state.id}`);
    }
    if (!svg.includes('data-render-source="owner-approved-html"')) {
      issues.push(`SVG is not captured from the owner-approved HTML: ${state.id}`);
    }
    const captureSha256 = svg.match(/\bdata-capture-sha256="([a-f0-9]{64})"/u)?.[1];
    const captureData = svg.match(
      /\bhref="data:image\/png;base64,([A-Za-z0-9+/]+={0,2})"/u,
    )?.[1];
    if (!captureSha256 || !captureData) {
      issues.push(`embedded HTML capture is missing: ${state.id}`);
    } else {
      const captureBytes = Buffer.from(captureData, "base64");
      if (sha256Bytes(captureBytes) !== captureSha256) {
        issues.push(`embedded HTML capture hash mismatch: ${state.id}`);
      }
      try {
        const captureDimensions = pngDimensionsFromBytes(
          captureBytes,
          `${state.id} embedded capture`,
        );
        if (captureDimensions.width !== 390 || captureDimensions.height !== 844) {
          issues.push(
            `unexpected embedded capture dimensions for ${state.id}: ${captureDimensions.width}x${captureDimensions.height}`,
          );
        }
      } catch (error) {
        issues.push(error.message);
      }
    }
    if (!fs.existsSync(pngPath)) {
      issues.push(`state PNG is missing: ${state.id}`);
      continue;
    }
    if (
      captureData &&
      !Buffer.from(captureData, "base64").equals(fs.readFileSync(pngPath))
    ) {
      issues.push(`embedded capture differs from derived PNG: ${state.id}`);
    }
    try {
      const dimensions = pngDimensions(pngPath);
      if (dimensions.width !== 390 || dimensions.height !== 844) {
        issues.push(`unexpected PNG dimensions for ${state.id}: ${dimensions.width}x${dimensions.height}`);
      }
    } catch (error) {
      issues.push(error.message);
    }
  }

  const dataPath = path.join(packageRoot, "demo/data.js");
  if (fs.existsSync(dataPath)) {
    const dataText = fs.readFileSync(dataPath, "utf8");
    for (const state of model.states) {
      if (!dataText.includes(`"projection_sha256": "${state.projection_sha256}"`)) {
        issues.push(`HTML data projection mismatch: ${state.id}`);
      }
    }
  }
  return issues;
}

export function listGeneratedOutputHashes(root = process.cwd()) {
  const manifest = readJson(root, `${PACKAGE_PATH}/derived/prototype-package-manifest.json`);
  return Object.fromEntries(
    [
      ...manifest.outputs.map((output) => [
        `${PACKAGE_PATH}/${output.path}`,
        sha256File(absolute(root, `${PACKAGE_PATH}/${output.path}`)),
      ]),
      [
        `${PACKAGE_PATH}/derived/prototype-package-manifest.json`,
        sha256File(absolute(root, `${PACKAGE_PATH}/derived/prototype-package-manifest.json`)),
      ],
    ].sort(([left], [right]) => left.localeCompare(right, "en")),
  );
}

export function rendererVersion() {
  try {
    return execFileSync("rsvg-convert", ["--version"], { encoding: "utf8" }).trim();
  } catch {
    return "rsvg-convert unavailable";
  }
}
