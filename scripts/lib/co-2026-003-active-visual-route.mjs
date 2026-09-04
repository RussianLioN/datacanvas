import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";

export const PACKAGE_PATH = "docs/product/analysis/presentation-link-lisa-user-journey";
export const ACTIVE_ROUTE_PATH = `${PACKAGE_PATH}/source/active-contracts.json`;
export const ACTIVE_ROUTE_SCHEMA_PATH = `${PACKAGE_PATH}/source/schemas/active-contracts.schema.json`;
export const HISTORICAL_ROUTE_SCHEMA_PATH = `${PACKAGE_PATH}/source/schemas/historical-thirteen-screen-contracts.schema.json`;
export const BROWSER_CONTRACT_PATH = `${PACKAGE_PATH}/source/browser-native-phone-prototype/browser-native-phone-prototype-contract.json`;
export const BROWSER_OWNER_APPROVAL_PATH = `${PACKAGE_PATH}/source/browser-native-phone-prototype/owner-final-approval.json`;
export const BROWSER_MANIFEST_PATH = `${PACKAGE_PATH}/candidate-evidence/browser-native-phone-prototype/manifest.json`;
export const RELEASE_LEDGER_PATH = "docs/product/change-orders/co-2026-003-release-approval-ledger.json";
export const RELEASE_EVIDENCE_PATH = "docs/release/co-2026-003-browser-native-phone-prototype-release-evidence.json";
export const ACTIVE_ROUTE_ID = "lisa-presentation-browser-native-eleven-screen-route";
export const CANDIDATE_FINGERPRINT = "7f77dc92b3dcd9913bf3496b741d61304457dd65c9d90135b59cecdc986dcc25";
export const ACTIVE_FRAME_IDS = Object.freeze([
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
const HISTORICAL_ROUTE_ID = "lisa-presentation-thirteen-screen-route";
const HISTORICAL_ROUTE_PATH = "source/historical-thirteen-screen-contracts.json";

function fail(message) {
  throw new Error(message);
}

function sameArray(actual, expected) {
  return Array.isArray(actual) && actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function readJson(root, relativePath, label) {
  try {
    const target = path.join(root, relativePath);
    const stat = fs.lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label}: ожидается обычный JSON-файл`);
    return JSON.parse(fs.readFileSync(target, "utf8"));
  } catch (error) {
    fail(`${label}: ${error instanceof Error ? error.message : "не прочитан"}`);
  }
}

function assertJsonSchema(root, schemaPath, value, label) {
  const schema = readJson(root, schemaPath, `схема: ${label}`);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  if (!validate(value)) {
    fail(`${label} не соответствует схеме: ${ajv.errorsText(validate.errors)}`);
  }
}

function assertActiveSchema(root, registry) {
  assertJsonSchema(root, ACTIVE_ROUTE_SCHEMA_PATH, registry, "активный визуальный маршрут");
}

function assertHistoricalRecord(root, registry) {
  const [historicalRoute] = registry.historical_routes ?? [];
  if (
    historicalRoute?.route_id !== HISTORICAL_ROUTE_ID ||
    historicalRoute.record_path !== HISTORICAL_ROUTE_PATH ||
    historicalRoute.generator_eligible !== false ||
    historicalRoute.primary_navigation_allowed !== false
  ) {
    fail("исторический 13-кадровый маршрут должен быть явно запрещён для генерации и первичной навигации");
  }

  const historical = readJson(root, `${PACKAGE_PATH}/${historicalRoute.record_path}`, "историческая запись 13-кадрового маршрута");
  assertJsonSchema(root, HISTORICAL_ROUTE_SCHEMA_PATH, historical, "историческая запись 13-кадрового маршрута");
  if (
    historical.status !== "historical" ||
    historical.route_id !== HISTORICAL_ROUTE_ID ||
    historical.former_active_state_ids?.length !== 13 ||
    historical.former_active_state_ids.includes("lisa-materials-summary") !== true ||
    historical.former_active_state_ids.includes("lisa-presentation-order") !== true ||
    historical.historical_policy?.generator_eligible !== false ||
    historical.historical_policy?.primary_navigation_allowed !== false ||
    historical.historical_policy?.automatic_reactivation_allowed !== false
  ) {
    fail("историческая запись должна сохранять 13 кадров только как неактивный контур");
  }
}

function assertActiveBindings(root, registry) {
  if (
    registry.route_id !== ACTIVE_ROUTE_ID ||
    registry.route_kind !== "browser_native_final" ||
    !sameArray(registry.active_state_ids, ACTIVE_FRAME_IDS)
  ) {
    fail("активный маршрут должен содержать ровно 11 принятых browser-native кадров в согласованном порядке");
  }
  if (
    registry.active_contract?.id !== "browser-native-phone-prototype" ||
    registry.active_contract?.path !== "source/browser-native-phone-prototype/browser-native-phone-prototype-contract.json" ||
    registry.active_contract?.schema !== "source/schemas/browser-native-phone-prototype-contract.schema.json"
  ) {
    fail("активный маршрут должен ссылаться только на договор финального browser-native прототипа");
  }
  if (
    registry.release_bindings?.runtime_root !== "candidate-evidence/browser-native-phone-prototype" ||
    registry.release_bindings?.runtime_manifest_path !== "candidate-evidence/browser-native-phone-prototype/manifest.json" ||
    registry.release_bindings?.owner_final_approval_path !== "source/browser-native-phone-prototype/owner-final-approval.json" ||
    registry.release_bindings?.candidate_fingerprint !== CANDIDATE_FINGERPRINT
  ) {
    fail("активный маршрут должен связывать финальные runtime, манифест, решение владельца и отпечаток кандидата");
  }

  const contract = readJson(root, `${PACKAGE_PATH}/${registry.active_contract.path}`, "договор финального browser-native прототипа");
  if (
    contract.status !== "owner_final_approved" ||
    !sameArray(contract.viewer_navigation?.frame_sequence, ACTIVE_FRAME_IDS) ||
    !sameArray(contract.phone_state_ids, [
      "lisa-materials-full-reference",
      "lisa-presentation-generating",
      "lisa-presentation-chat-list",
      "lisa-presentation-sent",
      "lisa-order-not-accepted",
      "lisa-delivery-delayed",
      "lisa-delivery-partial",
    ]) ||
    !sameArray(contract.external_state_ids, [
      "lisa-presentation-email",
      "lisa-presentation-slidedoc",
      "lisa-presentation-sber2025",
      "lisa-presentation-mag",
    ]) ||
    contract.release_boundary?.active_release_switch_allowed !== true
  ) {
    fail("договор финального browser-native прототипа не подтверждает активный 11-кадровый маршрут");
  }

  const manifest = readJson(root, `${PACKAGE_PATH}/${registry.release_bindings.runtime_manifest_path}`, "манифест финального browser-native прототипа");
  if (manifest.status !== "owner_final_approved" || manifest.candidate_fingerprint?.sha256 !== CANDIDATE_FINGERPRINT) {
    fail("манифест финального browser-native прототипа не совпадает с активным маршрутом");
  }

  const ownerApproval = readJson(root, `${PACKAGE_PATH}/${registry.release_bindings.owner_final_approval_path}`, "итоговое решение владельца");
  if (
    ownerApproval.decision !== "approved" ||
    ownerApproval.authorizations?.active_release_switch_allowed !== true ||
    ownerApproval.authorizations?.high_resolution_release_allowed !== true ||
    ownerApproval.authorizations?.delivery_archive_allowed !== true
  ) {
    fail("итоговое решение владельца не разрешает активный browser-native выпуск");
  }
}

function assertReleaseEvidence(root) {
  const ledger = readJson(root, RELEASE_LEDGER_PATH, "реестр итоговой приёмки CO-2026-003");
  const finalRelease = ledger.final_release ?? {};
  if (
    finalRelease.status !== "owner_final_approved" ||
    finalRelease.active_release_switch_allowed !== true ||
    finalRelease.high_resolution_render_allowed !== true ||
    finalRelease.delivery_archive_allowed !== true ||
    finalRelease.candidate_fingerprint !== CANDIDATE_FINGERPRINT ||
    finalRelease.prototype_package_manifest_path !== BROWSER_MANIFEST_PATH ||
    finalRelease.fresh_evidence_path !== RELEASE_EVIDENCE_PATH
  ) {
    fail("реестр итоговой приёмки не совпадает с активным browser-native маршрутом");
  }

  const evidence = readJson(root, RELEASE_EVIDENCE_PATH, "свежие доказательства browser-native выпуска");
  if (
    evidence.status !== "owner_final_approved" ||
    evidence.runtime_mode !== "browser_native_dom_phone" ||
    evidence.active_release_switch_allowed !== true ||
    evidence.delivery_archive_allowed !== true ||
    evidence.candidate_fingerprint?.sha256 !== CANDIDATE_FINGERPRINT ||
    evidence.prototype_manifest_path !== BROWSER_MANIFEST_PATH ||
    evidence.active_visual_route_path !== ACTIVE_ROUTE_PATH ||
    evidence.active_route_id !== ACTIVE_ROUTE_ID ||
    !sameArray(evidence.active_state_ids, ACTIVE_FRAME_IDS)
  ) {
    fail("свежие доказательства не совпадают с финальным активным browser-native выпуском");
  }
}

export function assertCo2026003ActiveVisualRoute(root = process.cwd()) {
  const registry = readJson(root, ACTIVE_ROUTE_PATH, "активный визуальный маршрут");
  assertActiveSchema(root, registry);
  assertHistoricalRecord(root, registry);
  assertActiveBindings(root, registry);
  assertReleaseEvidence(root);
  return {
    routeId: ACTIVE_ROUTE_ID,
    frameIds: [...ACTIVE_FRAME_IDS],
    candidateFingerprint: CANDIDATE_FINGERPRINT,
  };
}
