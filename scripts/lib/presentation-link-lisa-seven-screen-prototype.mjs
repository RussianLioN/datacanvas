import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  buildApprovedEditableSourceRasters,
  canonicalizeApprovedPng,
} from "../import-presentation-link-lisa-editable-sources.mjs";
import { createStoredZip, readStoredZip } from "./documentation-archive.mjs";

export const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
export const ARCHIVE_RELATIVE_PATH = "derived/lisa-presentation-user-journey-demo.zip";
export const PACKAGE_MANIFEST_RELATIVE_PATH = "derived/prototype-package-manifest.json";
export const PROJECTION_MAP_RELATIVE_PATH = "derived/projection-map.json";
export const RASTER_MANIFEST_RELATIVE_PATH = "derived/canonical-raster-manifest.json";

const TEMPLATE_PATH = "scripts/templates/presentation-link-lisa-seven-screen";
const ACTIVE_CONTRACTS_PATH = `${PACKAGE_PATH}/source/active-contracts.json`;
const JOURNEY_CONTRACT_PATH = `${PACKAGE_PATH}/source/journey-contract.json`;
const FRAME_CONTRACT_PATH = `${PACKAGE_PATH}/source/frame-contract.json`;
const SOURCE_RENDER_CATALOG_PATH = `${PACKAGE_PATH}/source/source-render-catalog.json`;
const VISUAL_BASIS_CONTRACT_PATH = `${PACKAGE_PATH}/source/visual-basis-contract.json`;
const PROTOTYPE_PACKAGE_CONTRACT_PATH = `${PACKAGE_PATH}/source/prototype-package-contract.json`;
const AUTHORITATIVE_INTERVIEW_REGISTER_PATH = "docs/product/change-orders/co-2026-003-authoritative-interview-decision-register.json";
const EMAIL_SOURCE_FALLBACK = "editable-sources/7.4 — Письмо с презентацией.png";
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const SOURCE_BODY_CORNER_RADIUS = 32;
const PHONE_LAYER_ROLES = Object.freeze(["system_top", "scroll_content", "system_bottom"]);
const STATIC_RUNTIME_FILES = ["index.html", "styles.css", "app.js", "data.js"];
const ARCHIVE_STATIC_MEMBERS = ["README.md", "manifest.json", "index.html", "app.js", "data.js", "styles.css"];
const LIFECYCLE_STATE_IDS = Object.freeze([
  "eligible",
  "validating",
  "rejected_retryable",
  "accepted_locked",
  "generating",
  "delivery_confirmed",
  "delayed",
  "delivery_partial",
  "support_pending",
  "session_closed",
]);
const LIFECYCLE_MESSAGE_IDS = Object.freeze([
  "order_started",
  "order_not_accepted",
  "delivery_confirmed",
  "delivery_delayed",
  "delivery_partial",
]);
let runtimePublishRenameHook = null;

function fail(message) {
  throw new Error(message);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readJson(root, relativePath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
  } catch (error) {
    fail(`${relativePath}: JSON не прочитан (${error instanceof Error ? error.message : "неизвестная ошибка"})`);
  }
}

function readFile(root, relativePath, label = relativePath) {
  const target = path.join(root, relativePath);
  let stat;
  try {
    stat = fs.lstatSync(target);
  } catch {
    fail(`${label}: файл отсутствует`);
  }
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label}: ожидается обычный файл`);
  return fs.readFileSync(target);
}

function safePackageRelativePath(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    path.isAbsolute(value) ||
    value.includes("\\") ||
    value.includes("\u0000") ||
    value.split("/").includes("..")
  ) {
    fail(`${label}: небезопасный относительный путь`);
  }
  return value;
}

function dimensions(value, label) {
  if (
    !value ||
    !Number.isInteger(value.width) ||
    !Number.isInteger(value.height) ||
    value.width < 1 ||
    value.height < 1
  ) {
    fail(`${label}: размеры должны быть положительными целыми числами`);
  }
  return { width: value.width, height: value.height };
}

function rect(value, label) {
  if (value === null || value === undefined) return null;
  for (const key of ["x", "y", "width", "height"]) {
    if (!Number.isFinite(value[key]) || value[key] < 0 || (["width", "height"].includes(key) && value[key] <= 0)) {
      fail(`${label}: неверный прямоугольник`);
    }
  }
  return { x: value.x, y: value.y, width: value.width, height: value.height };
}

function rectDimensions(value) {
  return { width: value.width, height: value.height };
}

function sourceBodyCornerRadius(value, label) {
  if (!Number.isFinite(value) || value <= 0) fail(`${label}: радиус исходного корпуса должен быть положительным конечным числом`);
  if (value !== SOURCE_BODY_CORNER_RADIUS) fail(`${label}: радиус исходного корпуса должен быть ровно ${SOURCE_BODY_CORNER_RADIUS}`);
  return value;
}

function visualStatesFromContract(contract) {
  if (Array.isArray(contract.states)) return contract.states;
  if (Array.isArray(contract.bindings)) return contract.bindings;
  fail("source/visual-basis-contract.json: отсутствует массив states");
}

function assertSameStringArray(actual, expected, label) {
  if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${label}: порядок не совпадает с единым активным реестром`);
  }
}

function normalizeSourcePath(value, stateId) {
  const sourcePath = safePackageRelativePath(value, `${stateId}: исходный путь`);
  if (sourcePath.startsWith(`${PACKAGE_PATH}/`)) return sourcePath;
  return `${PACKAGE_PATH}/${sourcePath}`;
}

function normalizeRuntimePath(value, stateId) {
  const runtimePath = safePackageRelativePath(value, `${stateId}: путь ресурса выполнения`);
  if (!/^demo\/assets\/[a-z0-9-]+\.png$/u.test(runtimePath)) {
    fail(`${stateId}: ресурс выполнения должен находиться в demo/assets`);
  }
  return runtimePath;
}

function normalizeRasterSourcePath(value, stateId) {
  const sourcePath = safePackageRelativePath(value, `${stateId}: путь растровой основы`);
  if (sourcePath.startsWith(`${PACKAGE_PATH}/`)) return sourcePath;
  return `${PACKAGE_PATH}/${sourcePath}`;
}

function localRuntimeAssetPath(runtimePath) {
  const prefix = `${PACKAGE_PATH}/demo/`;
  if (!runtimePath.startsWith(prefix)) fail(`${runtimePath}: ресурс выполнения находится вне demo`);
  return runtimePath.slice(prefix.length);
}

function frameRegions(frame, stateId) {
  if (!frame || frame.presentation !== "phone") fail(`${stateId}: телефонный кадр отсутствует в договоре кадров`);
  if (!frame.regions || typeof frame.regions !== "object") fail(`${stateId}: кадр должен содержать regions для трёх слоёв`);
  return Object.fromEntries(PHONE_LAYER_ROLES.map((role) => {
    const region = frame.regions[role];
    if (!region) fail(`${stateId}: в кадре отсутствует область ${role}`);
    return [role, {
      source_rect: rect(region.source_rect, `${stateId}/${role}: исходная область`),
      viewport_rect: rect(region.viewport_rect, `${stateId}/${role}: область назначения`),
    }];
  }));
}

function normalizePhoneLayers(visualState, frame, stateId) {
  if (visualState.raster) fail(`${stateId}: телефонное состояние не должно содержать одиночный raster`);
  if (!Array.isArray(visualState.raster_layers) || visualState.raster_layers.length !== PHONE_LAYER_ROLES.length) {
    fail(`${stateId}: телефонное состояние должно содержать ровно три raster_layers`);
  }
  const regions = frameRegions(frame, stateId);
  const layersByRole = new Map(visualState.raster_layers.map((layer) => [layer.role, layer]));
  if (layersByRole.size !== PHONE_LAYER_ROLES.length) fail(`${stateId}: роли raster_layers должны быть уникальны`);
  return PHONE_LAYER_ROLES.map((role) => {
    const layer = layersByRole.get(role);
    if (!layer) fail(`${stateId}: отсутствует слой ${role}`);
    const sourceRect = rect(layer.source_rect || regions[role].source_rect, `${stateId}/${role}: исходная область`);
    const viewportRect = rect(layer.viewport_rect || layer.destination_rect || regions[role].viewport_rect, `${stateId}/${role}: область назначения`);
    const logicalDimensions = dimensions(layer.logical_dimensions || rectDimensions(sourceRect), `${stateId}/${role}: логические размеры`);
    const pixelDimensions = dimensions(layer.pixel_dimensions, `${stateId}/${role}: растровые размеры`);
    const rasterScale = layer.raster_scale || layer.scale;
    if (!Number.isInteger(rasterScale) || rasterScale < 1) fail(`${stateId}/${role}: неверный масштаб растра`);
    const runtimePath = normalizeRuntimePath(layer.runtime_path, `${stateId}/${role}`);
    const rasterSha256 = layer.sha256 || layer.raster_sha256;
    if (!SHA256_PATTERN.test(rasterSha256 || "")) fail(`${stateId}/${role}: неверный SHA-256 растрового слоя`);
    return {
      role,
      source_path: normalizeRasterSourcePath(layer.source_path, `${stateId}/${role}`),
      runtime_path: `${PACKAGE_PATH}/${runtimePath}`,
      sha256: rasterSha256,
      source_rect: sourceRect,
      viewport_rect: viewportRect,
      destination_rect: viewportRect,
      pixel_dimensions: pixelDimensions,
      logical_dimensions: logicalDimensions,
      raster_scale: rasterScale,
    };
  });
}

function normalizeDesktopRaster(visualState, stateId) {
  if (visualState.raster_layers) fail(`${stateId}: десктопное состояние не должно содержать raster_layers`);
  const raster = visualState.raster || {};
  const rasterSha256 = raster.sha256 || visualState.raster_sha256;
  if (!SHA256_PATTERN.test(rasterSha256 || "")) fail(`${stateId}: неверный SHA-256 растровой основы`);
  const runtimePath = normalizeRuntimePath(raster.runtime_path || visualState.runtime_path, stateId);
  const fallbackSourcePath = stateId === "lisa-presentation-email" ? EMAIL_SOURCE_FALLBACK : undefined;
  return {
    source_path: normalizeRasterSourcePath(raster.source_path || fallbackSourcePath, stateId),
    runtime_path: `${PACKAGE_PATH}/${runtimePath}`,
    sha256: rasterSha256,
    pixel_dimensions: dimensions(raster.pixel_dimensions || visualState.pixel_dimensions, `${stateId}: растровые размеры`),
    scale: raster.scale || visualState.raster_scale || 1,
  };
}

function validateLifecycle(lifecycle, ctaStates, orderedStateIds, authoritativeRegister) {
  if (!lifecycle || lifecycle.model !== "variant") fail("договор пути должен содержать вариантный жизненный цикл");
  if (lifecycle.content_review_status !== "approved_product_owner") {
    fail("договор пути должен ссылаться только на согласованные Product Owner сообщения");
  }
  if (!["pending_product_owner", "approved_product_owner"].includes(lifecycle.visual_release_status)) {
    fail("договор пути должен явно задавать статус визуального выпуска");
  }
  const visualReleaseGate = authoritativeRegister?.visual_release_gate;
  if (
    !visualReleaseGate ||
    visualReleaseGate.content_review_status !== lifecycle.content_review_status ||
    visualReleaseGate.visual_release_status !== lifecycle.visual_release_status ||
    visualReleaseGate.release_condition !== "explicit_product_owner_visual_approval"
  ) {
    fail("договор пути и реестр интервью должны согласованно разделять одобрение содержания и визуального выпуска");
  }
  if (!Array.isArray(lifecycle.states)) fail("вариантный жизненный цикл должен содержать состояния");
  const stateIds = lifecycle.states.map((state) => state?.id);
  assertSameStringArray(stateIds, LIFECYCLE_STATE_IDS, "вариантный жизненный цикл/states");
  for (const state of lifecycle.states) {
    if (!Array.isArray(state.next_state_ids)) fail(`${state.id}: не заданы допустимые переходы`);
    for (const targetStateId of state.next_state_ids) {
      if (!stateIds.includes(targetStateId)) fail(`${state.id}: переход ведёт в неизвестное состояние ${targetStateId}`);
    }
  }
  const button = lifecycle.button;
  if (!button || button.submission !== "immediate_without_confirmation") {
    fail("кнопка заказа должна отправлять запрос сразу, без второго подтверждения");
  }
  assertSameStringArray(button.source_state_ids, ctaStates, "источники CTA вариантного жизненного цикла");
  if (button.retry_after !== "rejected_retryable" || !button.enabled_in?.includes("rejected_retryable")) {
    fail("повтор заказа допускается только после исправления непринятого запроса");
  }
  if (!button.enabled_in?.includes("eligible") || !button.disabled_in?.includes("accepted_locked")) {
    fail("CTA должна быть доступна до принятия и заблокирована после принятия заказа");
  }
  const buttonStateIds = [...(button.enabled_in || []), ...(button.disabled_in || [])];
  assertSameStringArray([...buttonStateIds].sort(), [...LIFECYCLE_STATE_IDS].sort(), "доступность CTA по состояниям");
  if (new Set(buttonStateIds).size !== buttonStateIds.length) fail("состояние CTA не может быть одновременно доступно и заблокировано");
  const lock = lifecycle.single_order_lock;
  if (lock?.scope !== "session_user_pair" || lock.locks_on !== "accepted_locked" || lock.duplicate_behavior !== "reject_after_acceptance") {
    fail("договор должен блокировать повторный заказ для пары сеанс/пользователь после принятия");
  }
  const chat = lifecycle.chat;
  if (chat?.delivery !== "same_chat_on_return" || chat.persistence !== true || chat.system_push !== false || chat.safe_message_only !== true) {
    fail("безопасное состояние должно сохраняться и возвращаться в тот же чат без системного PUSH");
  }
  const scope = lifecycle.scope;
  if (scope?.result_link !== false || scope.separate_storage !== false || scope.rich_structure_editing !== false) {
    fail("договор пути не должен включать ссылку, отдельное хранилище или расширенное редактирование структуры");
  }
  const variants = lifecycle.delivery_variants || [];
  assertSameStringArray(variants.map((variant) => variant?.id), ["one_contour", "two_contours"], "варианты доставки");
  if (variants[0]?.contour_count !== 1 || variants[1]?.contour_count !== 2) fail("варианты доставки должны различать один и два контура");
  const messages = lifecycle.messages || [];
  assertSameStringArray(messages.map((message) => message?.id), LIFECYCLE_MESSAGE_IDS, "каталог сообщений");
  if (!Array.isArray(authoritativeRegister?.authoritative_messages) || authoritativeRegister.authoritative_messages.length !== LIFECYCLE_MESSAGE_IDS.length) {
    fail("реестр интервью должен содержать пять согласованных сообщений");
  }
  if ((authoritativeRegister.unresolved_authoritative_text_ids || []).length !== 0) {
    fail("реестр интервью не должен оставлять согласованные сообщения неразрешенными");
  }
  const authoritativeMessagesById = new Map(authoritativeRegister.authoritative_messages.map((message) => [message.message_id, message]));
  for (const message of messages) {
    const authoritativeMessage = authoritativeMessagesById.get(message.message_id);
    if (
      message.decision_id !== "CO3-DEC-007" ||
      message.authoritative_text_status !== "agreed" ||
      !authoritativeMessage ||
      authoritativeMessage.lifecycle_message_id !== message.id ||
      authoritativeMessage.text !== message.authoritative_text
    ) {
      fail(`${message.id}: текст статуса должен дословно совпадать с реестром согласованных сообщений`);
    }
  }
  const partialMessage = messages.find((message) => message.id === "delivery_partial");
  if (partialMessage?.contour_display_rule !== "by_actual_address_lookup") {
    fail("частичная доставка должна подставлять один или два контура по фактическому результату поиска адресов");
  }
  const screenSequence = lifecycle.screen_sequence;
  if (screenSequence?.decision_id !== "CO3-DEC-009" || screenSequence.preserve_existing_source_order !== true) {
    fail("договор должен сохранять согласованный исходный порядок экранов");
  }
  assertSameStringArray(screenSequence.existing_state_ids, orderedStateIds, "сохраненный исходный порядок экранов");
  if (screenSequence.additional_status_placement !== "after_existing_presentation_states" || screenSequence.generation_status !== "source_ready_visual_generation_not_run") {
    fail("дополнительные статусы допускаются только в конце; визуальная генерация не должна считаться выполненной");
  }
  return lifecycle;
}

export function loadSevenScreenContracts(root = process.cwd()) {
  const registry = readJson(root, ACTIVE_CONTRACTS_PATH);
  const journey = readJson(root, JOURNEY_CONTRACT_PATH);
  const authoritativeInterviewRegister = readJson(root, AUTHORITATIVE_INTERVIEW_REGISTER_PATH);
  const frameContract = readJson(root, FRAME_CONTRACT_PATH);
  const sourceRenderCatalog = readJson(root, SOURCE_RENDER_CATALOG_PATH);
  const visualBasis = readJson(root, VISUAL_BASIS_CONTRACT_PATH);
  const packageContract = readJson(root, PROTOTYPE_PACKAGE_CONTRACT_PATH);

  if (!Array.isArray(registry.active_state_ids) || registry.active_state_ids.length === 0) {
    fail("реестр должен содержать непустой набор активных состояний");
  }
  if (new Set(registry.active_state_ids).size !== registry.active_state_ids.length) {
    fail("реестр содержит повторяющиеся активные состояния");
  }
  const activeStateIds = registry.active_state_ids;
  assertSameStringArray(journey.state_ids, activeStateIds, "договор пути/state_ids");
  if (!Array.isArray(journey.states) || journey.states.length !== activeStateIds.length) {
    fail("договор пути должен содержать тот же набор состояний, что и активный реестр");
  }
  assertSameStringArray(journey.states.map((state) => state.id), activeStateIds, "договор пути/states");
  if (!Array.isArray(frameContract.frames) || frameContract.frames.length !== activeStateIds.length) {
    fail("договор кадров должен содержать тот же набор кадров, что и активный реестр");
  }
  assertSameStringArray(frameContract.frames.map((frame) => frame.state_id), activeStateIds, "договор кадров/frames");
  const visualStates = visualStatesFromContract(visualBasis);
  if (visualStates.length !== activeStateIds.length) {
    fail("договор визуальных основ должен содержать тот же набор состояний, что и активный реестр");
  }
  assertSameStringArray(visualStates.map((state) => state.state_id || state.id), activeStateIds, "договор визуальных основ/states");
  if (!Array.isArray(sourceRenderCatalog.sources) || sourceRenderCatalog.sources.length !== activeStateIds.length) {
    fail("каталог исходных кадров должен содержать тот же набор источников, что и активный реестр");
  }
  assertSameStringArray(sourceRenderCatalog.sources.map((source) => source.state_id), activeStateIds, "каталог исходных кадров/sources");
  assertSameStringArray(sourceRenderCatalog.active_source_ids, journey.states.map((state) => state.source_id), "каталог исходных кадров/active_source_ids");
  const frameDevice = frameContract.device;
  if (!frameDevice || typeof frameDevice !== "object") fail("договор кадров должен содержать device");
  const frameSourceBodyCornerRadius = sourceBodyCornerRadius(
    frameDevice.source_body_corner_radius,
    "source/frame-contract.json/device/source_body_corner_radius",
  );
  if (!Array.isArray(packageContract.archive_members)) fail("договор пакета должен содержать archive_members");

  const journeyById = new Map(journey.states.map((state) => [state.id, state]));
  const frameById = new Map(frameContract.frames.map((frame) => [frame.state_id, frame]));
  const visualById = new Map(visualStates.map((state) => [state.state_id || state.id, state]));

  const states = activeStateIds.map((stateId, index) => {
    const journeyState = journeyById.get(stateId);
    const frame = frameById.get(stateId);
    const visualState = visualById.get(stateId);
    if (!journeyState || !frame || !visualState) fail(`${stateId}: отсутствует в договоре пути, кадров или визуальной основы`);
    if (journeyState.order !== undefined && journeyState.order !== index + 1) fail(`${stateId}: нарушен номер в маршруте`);
    if (!Number.isInteger(journeyState.display_order) || journeyState.display_order < 1) {
      fail(`${stateId}: не задан отображаемый номер`);
    }
    const presentation = journeyState.presentation;
    if (!["phone", "desktop"].includes(presentation)) fail(`${stateId}: неверный вид представления`);
    if (frame.presentation !== presentation) fail(`${stateId}: представление в кадре не совпадает с договором пути`);
    const source = visualState.source || {};
    const logicalDimensions = dimensions(source.logical_dimensions || visualState.logical_dimensions, `${stateId}: логические размеры`);
    const viewport = dimensions(frame.viewport || visualState.viewport || (presentation === "phone" ? { width: 393, height: 852 } : logicalDimensions), `${stateId}: окно просмотра`);
    const content = dimensions(frame.content || viewport, `${stateId}: область содержимого`);
    const fallbackSourcePath = stateId === "lisa-presentation-email" ? EMAIL_SOURCE_FALLBACK : undefined;
    const sourcePath = normalizeSourcePath(source.path || visualState.source_path || fallbackSourcePath, stateId);
    const sourceSha256 = source.sha256 || visualState.source_sha256;
    if (!SHA256_PATTERN.test(sourceSha256 || "")) fail(`${stateId}: неверный SHA-256 исходника`);
    const ctaRect = rect(visualState.cta_rect, `${stateId}: CTA`);
    if (ctaRect && (ctaRect.x + ctaRect.width > logicalDimensions.width || ctaRect.y + ctaRect.height > logicalDimensions.height)) {
      fail(`${stateId}: CTA выходит за логические границы основы`);
    }
    const state = {
      id: stateId,
      order: index + 1,
      display_order: journeyState.display_order,
      source_id: journeyState.source_id,
      caption: journeyState.caption,
      presentation,
      scrollable: Boolean(journeyState.scrollable),
      action_ids: Array.isArray(journeyState.action_ids) ? journeyState.action_ids : [],
      source: {
        path: sourcePath,
        sha256: sourceSha256,
        logical_dimensions: logicalDimensions,
      },
      viewport,
      content,
      cta_rect: ctaRect,
    };
    if (presentation === "phone") {
      state.raster_layers = normalizePhoneLayers(visualState, frame, stateId);
    } else {
      state.raster = normalizeDesktopRaster(visualState, stateId);
    }
    return state;
  });

  if (journey.initial_state_id !== states[0].id) fail("начальным должен быть первый экран маршрута");
  if (!Number.isInteger(journey.navigation?.display_total) || journey.navigation.display_total < states.at(-1).display_order) {
    fail("не задан корректный общий отображаемый номер маршрута");
  }
  const orderAction = (journey.actions || []).find((action) => action.id === "order-presentation");
  if (!orderAction || !states.some((state) => state.id === orderAction.target_state_id)) {
    fail("не задан переход заказа презентации в активное состояние");
  }
  const ctaStates = states.filter((state) => state.cta_rect).map((state) => state.id);
  if (JSON.stringify(orderAction.source_state_ids) !== JSON.stringify(ctaStates)) {
    fail("источники действия заказа не совпадают с CTA визуального договора");
  }
  const lifecycle = validateLifecycle(journey.lifecycle, ctaStates, states.map((state) => state.id), authoritativeInterviewRegister);
  const expectedArchiveMembers = [
    ...ARCHIVE_STATIC_MEMBERS,
    ...states.flatMap((state) => stateAssetNames(state).map((name) => `assets/${name}`)),
  ];
  assertSameStringArray(packageContract.archive_members, expectedArchiveMembers, "договор пакета/archive_members");

  return {
    registry,
    journey,
    authoritativeInterviewRegister,
    frameContract,
    sourceRenderCatalog,
    visualBasis,
    packageContract,
    frameDevice: {
      source_body_corner_radius: frameSourceBodyCornerRadius,
    },
    states,
    orderAction,
    lifecycle,
  };
}

function renderLayerData(layer) {
  return {
    role: layer.role,
    src: localRuntimeAssetPath(layer.runtime_path),
    source_rect: layer.source_rect,
    viewport_rect: layer.viewport_rect,
    destination_rect: layer.destination_rect,
    pixel_dimensions: layer.pixel_dimensions,
    logical_dimensions: layer.logical_dimensions,
    raster_scale: layer.raster_scale,
  };
}

function renderRuntimeData(contracts) {
  const payload = {
    version: contracts.journey.version,
    initial_state_id: contracts.journey.initial_state_id,
    order_target_state_id: contracts.orderAction.target_state_id,
    lifecycle: contracts.lifecycle,
    navigation: {
      display_total: contracts.journey.navigation.display_total,
    },
    device: {
      ...contracts.journey.device,
      ...contracts.frameDevice,
    },
    states: contracts.states.map((state) => {
      const common = {
        id: state.id,
        order: state.order,
        display_order: state.display_order,
        source_id: state.source_id,
        caption: state.caption,
        presentation: state.presentation,
        scrollable: state.scrollable,
        action_ids: state.action_ids,
        viewport: state.viewport,
        content: state.content,
        logical_dimensions: state.source.logical_dimensions,
        cta_rect: state.cta_rect,
      };
      if (state.presentation === "phone") {
        const layers = state.raster_layers.map(renderLayerData);
        return {
          ...common,
          raster_layers: layers,
          asset: { layers },
        };
      }
      return {
        ...common,
        asset: {
          src: localRuntimeAssetPath(state.raster.runtime_path),
          logical_dimensions: state.source.logical_dimensions,
          pixel_dimensions: state.raster.pixel_dimensions,
          raster_scale: state.raster.scale,
        },
      };
    }),
    actions: [
      {
        id: "order-presentation",
        label: "Сформировать презентацию",
        accessible_label: "Сформировать презентацию",
        target_state_id: contracts.orderAction.target_state_id,
        source_state_ids: contracts.orderAction.source_state_ids,
      },
    ],
  };
  return Buffer.from(`window.LISA_PROTOTYPE_DATA = Object.freeze(${JSON.stringify(payload, null, 2)});\n`, "utf8");
}

function inspectPngDimensions(bytes, label) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    fail(`${label}: не является PNG`);
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function readTemplate(root, name) {
  return readFile(root, `${TEMPLATE_PATH}/${name}`, `шаблон ${name}`);
}

function assetNameFromRuntimePath(runtimePath) {
  return path.posix.basename(runtimePath);
}

function stateAssetNames(state) {
  if (state.presentation === "phone") return state.raster_layers.map((layer) => assetNameFromRuntimePath(layer.runtime_path));
  return [assetNameFromRuntimePath(state.raster.runtime_path)];
}

function verifySource(root, state) {
  const bytes = readFile(root, state.source.path, `${state.id}: исходник`);
  if (sha256(bytes) !== state.source.sha256) fail(`${state.id}: SHA-256 утверждённого исходника изменился`);
  return bytes;
}

function assertSameRect(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) fail(`${label}: область не совпадает с договором`);
}

function rasterResultsBySourcePath(results) {
  return new Map(results.map((result) => [`${PACKAGE_PATH}/${result.path.slice(`${PACKAGE_PATH}/`.length)}`, result]));
}

function bytesFromImportedRaster(resultBySourcePath, raster, label) {
  const result = resultBySourcePath.get(raster.source_path);
  if (!result) fail(`${label}: импортёр не вернул договорный PNG ${raster.source_path}`);
  if (result.output !== assetNameFromRuntimePath(raster.runtime_path)) fail(`${label}: имя PNG импортёра не совпадает с runtime_path`);
  if (result.sha256 !== raster.sha256) fail(`${label}: SHA-256 импортёра не совпадает с визуальным договором`);
  if (JSON.stringify(result.dimensions) !== JSON.stringify(raster.pixel_dimensions)) fail(`${label}: размеры импортёра не совпадают с визуальным договором`);
  if (raster.source_rect) assertSameRect(result.source_rect, raster.source_rect, `${label}: source_rect`);
  if (raster.viewport_rect) assertSameRect(result.viewport_rect, raster.viewport_rect, `${label}: viewport_rect`);
  const actualDimensions = inspectPngDimensions(result.bytes, label);
  if (JSON.stringify(actualDimensions) !== JSON.stringify(raster.pixel_dimensions)) {
    fail(`${label}: байты импортёра имеют размеры вне договора`);
  }
  if (sha256(result.bytes) !== raster.sha256) fail(`${label}: байты импортёра имеют SHA-256 вне договора`);
  return result.bytes;
}

function buildInternalManifest(contracts, runtimeEntries, candidateFingerprint) {
  return {
    version: "3.0.0",
    status: "portable-ten-screen-prototype",
    candidate_fingerprint: { algorithm: "sha256", sha256: candidateFingerprint },
    state_ids: contracts.states.map((state) => state.id),
    active_state_ids: contracts.states.map((state) => state.id),
    files: runtimeEntries.map((entry) => ({ path: entry.name, bytes: entry.content.length, sha256: sha256(entry.content) })),
  };
}

function buildArchiveReadme(contracts) {
  return Buffer.from(`# Автономный прототип заказа презентации

В архиве находится один десятиэкранный пользовательский путь. Все изображения и данные синтетические. Сетевые подключения не используются.

Откройте \`index.html\` двойным щелчком или перетащите файл в Chromium, Safari либо другой современный браузер. Стрелки в левой панели и клавиши ←/→ переключают экраны. На длинных телефонных экранах прокрутка выполняется внутри средней области смартфона. Три варианта презентации после письма автоматически масштабируются под окно; их страницы прокручиваются внутри десктопной сцены.

Начальный экран: \`${contracts.states[0].id}\`. Финальный экран: \`${contracts.states.at(-1).id}\`.
`, "utf8");
}

function archiveEntryMap(entries) {
  return new Map(entries.map((entry) => [entry.name, entry]));
}

function orderArchiveEntries(packageContract, entries) {
  const byName = archiveEntryMap(entries);
  const ordered = packageContract.archive_members.map((name) => {
    const entry = byName.get(name);
    if (!entry) fail(`договор пакета требует отсутствующий файл ${name}`);
    return entry;
  });
  const extra = entries.filter((entry) => !packageContract.archive_members.includes(entry.name));
  if (extra.length > 0) fail(`сборка содержит файлы вне договора пакета: ${extra.map((entry) => entry.name).join(", ")}`);
  return ordered;
}

export async function buildSevenScreenPrototype(root = process.cwd(), { writeRasters = false } = {}) {
  const contracts = loadSevenScreenContracts(root);
  const rasterResults = await buildApprovedEditableSourceRasters({ root, write: writeRasters });
  const importedRasterBySourcePath = rasterResultsBySourcePath(rasterResults);
  const assetEntries = [];

  for (const state of contracts.states) {
    verifySource(root, state);
    if (state.presentation === "phone") {
      for (const layer of state.raster_layers) {
        const label = `${state.id}/${layer.role}: ресурс выполнения`;
        const bytes = bytesFromImportedRaster(importedRasterBySourcePath, layer, label);
        assetEntries.push({ name: `assets/${assetNameFromRuntimePath(layer.runtime_path)}`, content: bytes });
      }
    } else {
      const sourceBytes = readFile(root, state.raster.source_path, `${state.id}: исходный PNG`);
      const bytes = canonicalizeApprovedPng(sourceBytes, state.raster.pixel_dimensions, `${state.id}: исходный PNG`);
      const actualDimensions = inspectPngDimensions(bytes, `${state.id}: ресурс выполнения`);
      if (JSON.stringify(actualDimensions) !== JSON.stringify(state.raster.pixel_dimensions)) {
        fail(`${state.id}: растровые размеры не совпадают с визуальным договором`);
      }
      if (sha256(bytes) !== state.raster.sha256) fail(`${state.id}: SHA-256 растровой основы не совпадает с визуальным договором`);
      assetEntries.push({ name: `assets/${assetNameFromRuntimePath(state.raster.runtime_path)}`, content: bytes });
    }
  }

  const runtimeEntries = [
    { name: "index.html", content: readTemplate(root, "index.html") },
    { name: "app.js", content: readTemplate(root, "app.js") },
    { name: "data.js", content: renderRuntimeData(contracts) },
    { name: "styles.css", content: readTemplate(root, "styles.css") },
    ...assetEntries,
  ];
  const fingerprintPayload = runtimeEntries.map((entry) => ({ path: entry.name, bytes: entry.content.length, sha256: sha256(entry.content) }));
  const candidateFingerprint = sha256(jsonBytes(fingerprintPayload));
  const readme = buildArchiveReadme(contracts);
  const internalManifest = jsonBytes(buildInternalManifest(contracts, runtimeEntries, candidateFingerprint));
  const archiveEntries = orderArchiveEntries(contracts.packageContract, [
    { name: "README.md", content: readme },
    { name: "manifest.json", content: internalManifest },
    ...runtimeEntries,
  ]);
  const archive = createStoredZip(archiveEntries);
  const externalManifest = {
    version: "3.0.0",
    status: "portable-ten-screen-prototype",
    candidate_fingerprint: { algorithm: "sha256", sha256: candidateFingerprint },
    state_ids: contracts.states.map((state) => state.id),
    runtime_files: fingerprintPayload,
    archive: {
      path: ARCHIVE_RELATIVE_PATH,
      bytes: archive.length,
      sha256: sha256(archive),
      members: archiveEntries.map((entry) => entry.name),
    },
  };
  const projectionMap = {
    version: "3.0.0",
    state_ids: contracts.states.map((state) => state.id),
    states: contracts.states.map((state) => ({
      state_id: state.id,
      source_id: state.source_id,
      presentation: state.presentation,
      caption: state.caption,
      asset_paths: state.presentation === "phone"
        ? state.raster_layers.map((layer) => localRuntimeAssetPath(layer.runtime_path))
        : [localRuntimeAssetPath(state.raster.runtime_path)],
      layers: state.presentation === "phone"
        ? state.raster_layers.map((layer) => ({
          role: layer.role,
          source_rect: layer.source_rect,
          viewport_rect: layer.viewport_rect,
          raster_sha256: layer.sha256,
        }))
        : undefined,
      projection_sha256: sha256(jsonBytes({
        state_id: state.id,
        source_sha256: state.source.sha256,
        raster_sha256: state.presentation === "phone" ? state.raster_layers.map((layer) => layer.sha256) : state.raster.sha256,
        viewport: state.viewport,
        content: state.content,
        cta_rect: state.cta_rect,
      })),
    })),
  };
  const rasterManifest = {
    version: "3.0.0",
    status: "safe-mixed-raster-basis",
    rasterizers: {
      phone: "playwright-webkit-page-screenshot",
      email: "approved-png-canonicalization",
      presentation_documents: "swift-coregraphics-imageio",
    },
    phone_raster_scale: 3,
    state_ids: contracts.states.map((state) => state.id),
    states: contracts.states.map((state) => {
      const common = {
        state_id: state.id,
        source_path: state.source.path.slice(`${PACKAGE_PATH}/`.length),
        source_sha256: state.source.sha256,
      };
      if (state.presentation === "phone") {
        return {
          ...common,
          raster_layers: state.raster_layers.map((layer) => ({
            role: layer.role,
            raster_path: layer.runtime_path.slice(`${PACKAGE_PATH}/`.length),
            source_path: layer.source_path.slice(`${PACKAGE_PATH}/`.length),
            raster_sha256: layer.sha256,
            source_rect: layer.source_rect,
            viewport_rect: layer.viewport_rect,
            logical_dimensions: layer.logical_dimensions,
            pixel_dimensions: layer.pixel_dimensions,
            scale: layer.raster_scale,
          })),
        };
      }
      return {
        ...common,
        raster_path: state.raster.runtime_path.slice(`${PACKAGE_PATH}/`.length),
        raster_sha256: state.raster.sha256,
        logical_dimensions: state.source.logical_dimensions,
        pixel_dimensions: state.raster.pixel_dimensions,
        scale: state.raster.scale,
      };
    }),
  };
  return {
    contracts,
    runtimeEntries,
    archiveEntries,
    archive,
    externalManifest,
    projectionMap,
    rasterManifest,
    candidateFingerprint,
  };
}

function writeAtomic(target, content) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.candidate-${process.pid}`;
  fs.writeFileSync(temporary, content, { flag: "wx", mode: 0o644 });
  fs.renameSync(temporary, target);
}

function renameRuntimePath(from, to, context) {
  if (runtimePublishRenameHook) runtimePublishRenameHook({ from, to, ...context });
  fs.renameSync(from, to);
}

function withRuntimePublishRenameHook(hook, callback) {
  if (runtimePublishRenameHook) fail("обработчик проверки публикации demo уже установлен");
  runtimePublishRenameHook = hook;
  try {
    return callback();
  } finally {
    runtimePublishRenameHook = null;
  }
}

export function publishSevenScreenRuntime(root, built) {
  if (
    built?.contracts?.lifecycle?.content_review_status !== "approved_product_owner" ||
    built?.contracts?.lifecycle?.visual_release_status !== "approved_product_owner"
  ) {
    fail("визуальный выпуск требует отдельного одобрения Product Owner");
  }
  const packageRoot = path.join(root, PACKAGE_PATH);
  const demoRoot = path.join(packageRoot, "demo");
  fs.mkdirSync(packageRoot, { recursive: true });
  const candidateDemo = fs.mkdtempSync(path.join(packageRoot, ".demo-candidate-"));
  const backupDemo = path.join(packageRoot, `.demo-backup-${path.basename(candidateDemo).slice(".demo-candidate-".length)}`);
  let activeWasBackedUp = false;
  try {
    for (const entry of built.runtimeEntries) {
      const relativePath = safePackageRelativePath(entry.name, `runtime/${entry.name}`);
      const target = path.join(candidateDemo, ...relativePath.split("/"));
      if (!target.startsWith(`${candidateDemo}${path.sep}`)) fail(`${entry.name}: путь выходит из кандидата demo`);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, entry.content, { flag: "wx", mode: 0o644 });
      if (!fs.readFileSync(target).equals(entry.content)) fail(`${entry.name}: временный файл не совпадает с кандидатом`);
    }

    if (fs.existsSync(demoRoot)) {
      const activeStat = fs.lstatSync(demoRoot);
      if (!activeStat.isDirectory() || activeStat.isSymbolicLink()) fail("demo: активный путь не является безопасным каталогом");
      renameRuntimePath(demoRoot, backupDemo, { phase: "backup" });
      activeWasBackedUp = true;
    }

    try {
      renameRuntimePath(candidateDemo, demoRoot, { phase: "activate" });
    } catch (error) {
      if (fs.existsSync(demoRoot)) fs.rmSync(demoRoot, { recursive: true, force: true, maxRetries: 2 });
      if (activeWasBackedUp && fs.existsSync(backupDemo)) {
        renameRuntimePath(backupDemo, demoRoot, { phase: "rollback" });
      }
      throw error;
    }

    if (fs.existsSync(backupDemo)) fs.rmSync(backupDemo, { recursive: true, force: true, maxRetries: 2 });
  } finally {
    if (fs.existsSync(candidateDemo)) fs.rmSync(candidateDemo, { recursive: true, force: true, maxRetries: 2 });
    if (fs.existsSync(backupDemo) && fs.existsSync(demoRoot)) {
      fs.rmSync(backupDemo, { recursive: true, force: true, maxRetries: 2 });
    }
  }
}

export function publishSevenScreenPrototype(root, built) {
  publishSevenScreenRuntime(root, built);
  writeAtomic(path.join(root, PACKAGE_PATH, ARCHIVE_RELATIVE_PATH), built.archive);
  writeAtomic(path.join(root, PACKAGE_PATH, PACKAGE_MANIFEST_RELATIVE_PATH), jsonBytes(built.externalManifest));
  writeAtomic(path.join(root, PACKAGE_PATH, PROJECTION_MAP_RELATIVE_PATH), jsonBytes(built.projectionMap));
  writeAtomic(path.join(root, PACKAGE_PATH, RASTER_MANIFEST_RELATIVE_PATH), jsonBytes(built.rasterManifest));
}

function compareBuffer(root, relativePath, expected, issues) {
  const target = path.join(root, relativePath);
  if (!fs.existsSync(target)) {
    issues.push(`${relativePath}: файл отсутствует`);
    return;
  }
  const actual = fs.readFileSync(target);
  if (!actual.equals(expected)) issues.push(`${relativePath}: файл устарел`);
}

export function compareSevenScreenRuntime(root, built) {
  const issues = [];
  for (const entry of built.runtimeEntries) {
    compareBuffer(root, `${PACKAGE_PATH}/demo/${entry.name}`, entry.content, issues);
  }
  const expectedAssets = built.runtimeEntries.filter((entry) => entry.name.startsWith("assets/")).map((entry) => path.posix.basename(entry.name)).sort();
  const assetRoot = path.join(root, PACKAGE_PATH, "demo/assets");
  const actualAssets = fs.existsSync(assetRoot) ? fs.readdirSync(assetRoot).sort() : [];
  if (JSON.stringify(actualAssets) !== JSON.stringify(expectedAssets)) issues.push("demo/assets: состав ресурсов отличается от десятиэкранного договора");
  return issues;
}

export function compareSevenScreenPrototype(root, built) {
  const issues = compareSevenScreenRuntime(root, built);
  compareBuffer(root, `${PACKAGE_PATH}/${ARCHIVE_RELATIVE_PATH}`, built.archive, issues);
  compareBuffer(root, `${PACKAGE_PATH}/${PACKAGE_MANIFEST_RELATIVE_PATH}`, jsonBytes(built.externalManifest), issues);
  compareBuffer(root, `${PACKAGE_PATH}/${PROJECTION_MAP_RELATIVE_PATH}`, jsonBytes(built.projectionMap), issues);
  compareBuffer(root, `${PACKAGE_PATH}/${RASTER_MANIFEST_RELATIVE_PATH}`, jsonBytes(built.rasterManifest), issues);
  return issues;
}

function forbiddenRuntimeReferences(bytes, name) {
  if (!/\.(?:html|css|js|md)$/u.test(name)) return [];
  const text = bytes.toString("utf8");
  const issues = [];
  if (text.includes("../")) issues.push(`${name}: найден выход из каталога через ../`);
  if (/(?:source|editable-sources)\//u.test(text)) issues.push(`${name}: найдена ссылка на источник происхождения`);
  if (/https?:\/\//u.test(text)) issues.push(`${name}: найдена сетевая ссылка`);
  if (/(?:file|data|javascript|mailto|blob):/iu.test(text)) issues.push(`${name}: найден запрещённый протокол ресурса`);
  if (/[A-Za-z]:[\\/]/u.test(text)) issues.push(`${name}: найден абсолютный путь Windows`);
  if (/(?:^|["'(\s])\/(?:Users|home|private|tmp|var|Volumes)\//mu.test(text)) {
    issues.push(`${name}: найден абсолютный локальный путь`);
  }
  if (/["']\/\/[^/]/u.test(text) || /url\(\s*["']?\//iu.test(text)) {
    issues.push(`${name}: найден сетевой или корневой путь без протокола`);
  }
  if (/\.svg(?:[?#"')]|$)/iu.test(text)) issues.push(`${name}: найден сырой SVG`);
  return issues;
}

export function validateSavedSevenScreenPrototype(root = process.cwd()) {
  const issues = [];
  let contracts;
  try {
    contracts = loadSevenScreenContracts(root);
  } catch (error) {
    return [error instanceof Error ? error.message : "договоры не прочитаны"];
  }
  const manifestPath = path.join(root, PACKAGE_PATH, PACKAGE_MANIFEST_RELATIVE_PATH);
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    return [`${PACKAGE_MANIFEST_RELATIVE_PATH}: манифест не прочитан`];
  }
  if (JSON.stringify(manifest.state_ids) !== JSON.stringify(contracts.registry.active_state_ids)) {
    issues.push("манифест содержит неверный порядок состояний");
  }
  for (const relativePath of [PROJECTION_MAP_RELATIVE_PATH, RASTER_MANIFEST_RELATIVE_PATH]) {
    try {
      const value = readJson(root, `${PACKAGE_PATH}/${relativePath}`);
      if (JSON.stringify(value.state_ids) !== JSON.stringify(contracts.registry.active_state_ids)) {
        issues.push(`${relativePath}: неверный порядок состояний`);
      }
    } catch (error) {
      issues.push(error instanceof Error ? error.message : `${relativePath}: не прочитан`);
    }
  }
  if (!SHA256_PATTERN.test(manifest.candidate_fingerprint?.sha256 || "")) issues.push("манифест не содержит отпечаток кандидата");

  const expectedAssetNames = contracts.states.flatMap(stateAssetNames).sort();
  const assetRoot = path.join(root, PACKAGE_PATH, "demo/assets");
  const actualAssetNames = fs.existsSync(assetRoot) ? fs.readdirSync(assetRoot).sort() : [];
  if (JSON.stringify(actualAssetNames) !== JSON.stringify(expectedAssetNames)) issues.push("demo/assets не содержит договорный набор PNG");
  for (const state of contracts.states) {
    const rasters = state.presentation === "phone" ? state.raster_layers : [state.raster];
    for (const raster of rasters) {
      const relativePath = `${PACKAGE_PATH}/${raster.runtime_path.slice(`${PACKAGE_PATH}/`.length)}`;
      try {
        const bytes = readFile(root, relativePath);
        const actual = inspectPngDimensions(bytes, relativePath);
        if (JSON.stringify(actual) !== JSON.stringify(raster.pixel_dimensions)) issues.push(`${relativePath}: неверные натуральные размеры`);
        if (sha256(bytes) !== raster.sha256) issues.push(`${relativePath}: SHA-256 не совпадает с договором`);
      } catch (error) {
        issues.push(error instanceof Error ? error.message : `${relativePath}: не прочитан`);
      }
    }
  }
  for (const name of STATIC_RUNTIME_FILES) {
    try {
      issues.push(...forbiddenRuntimeReferences(readFile(root, `${PACKAGE_PATH}/demo/${name}`), name));
    } catch (error) {
      issues.push(error instanceof Error ? error.message : `${name}: не прочитан`);
    }
  }
  try {
    const archive = readFile(root, `${PACKAGE_PATH}/${ARCHIVE_RELATIVE_PATH}`);
    if (sha256(archive) !== manifest.archive?.sha256 || archive.length !== manifest.archive?.bytes) issues.push("ZIP не совпадает с внешним манифестом");
    const members = readStoredZip(archive);
    const actualMembers = [...members.keys()];
    if (JSON.stringify(actualMembers) !== JSON.stringify(contracts.packageContract.archive_members)) issues.push("ZIP содержит состав или порядок вне договора пакета");
    if (JSON.stringify(actualMembers) !== JSON.stringify(manifest.archive?.members)) issues.push("ZIP содержит неверный состав или порядок файлов");
    const internalManifest = JSON.parse(members.get("manifest.json")?.toString("utf8") || "null");
    if (internalManifest?.candidate_fingerprint?.sha256 !== manifest.candidate_fingerprint?.sha256) {
      issues.push("отпечаток кандидата внутри ZIP не совпадает с внешним манифестом");
    }
    for (const [name, bytes] of members) issues.push(...forbiddenRuntimeReferences(bytes, name));
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "ZIP не проверен");
  }
  return issues;
}

export const __test = Object.freeze({
  forbiddenRuntimeReferences,
  inspectPngDimensions,
  renderRuntimeData,
  sha256,
  withRuntimePublishRenameHook,
});
