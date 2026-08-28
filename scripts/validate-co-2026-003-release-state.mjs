import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";

const ledgerPath = "docs/product/change-orders/co-2026-003-release-approval-ledger.json";
const ledgerSchemaPath = "schemas/co-2026-003-release-approval-ledger.schema.json";
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const candidatePath = `${packagePath}/source/prototype-revision-candidate.json`;
const clientDataPath = `${packagePath}/source/client-reference-data.json`;
const historicalVisualContractPath = `${packagePath}/source/visual-components-contract.json`;
const deliveryArchivePath = "artifacts/delivery/co-2026-003-q4-lisa-profile-delivery.zip";
const fullDeliveryFailureMessage =
  "Презентация сформирована, но отправка по электронной почте в SIGMA и OMEGA не подтверждена. Задача передана в сопровождение.";
const fullDeliveryFailureDecisionSource =
  "Стенограмма интервью имеет приоритет над устаревшей записью журнала по решению владельца продукта в рабочем чате.";
const frameApprovalSourcePath = "docs/product/change-orders/co-2026-003-q4-lisa-profile-bt-interview-transcript.md";

const expectedRoute = Object.freeze([
  "lisa-materials-summary",
  "lisa-materials-full-reference",
  "lisa-presentation-order",
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
const expectedFrameApprovalIds = Object.freeze([
  "lisa-materials-full-reference",
  "lisa-presentation-generating",
  "lisa-presentation-chat-list",
  "lisa-presentation-sent",
  "lisa-presentation-email",
  "lisa-order-not-accepted",
  "lisa-delivery-delayed",
  "lisa-delivery-partial",
  "lisa-presentation-slidedoc",
  "lisa-presentation-sber2025",
  "lisa-presentation-mag",
]);

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function sameArray(actual, expected) {
  return Array.isArray(actual) && actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function validateSchema(root, data) {
  const schema = readJson(root, ledgerSchemaPath);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  if (!validate(data)) {
    throw new Error(`реестр разрешений и приёмок не соответствует схеме: ${ajv.errorsText(validate.errors)}`);
  }
}

function validateFrameApprovals(root, ledger) {
  if (!sameArray(ledger.frame_approvals.map((frame) => frame.frame_id), expectedFrameApprovalIds)) {
    throw new Error("реестр должен содержать ровно 11 принятых кадров черновика из стенограммы");
  }
  for (const frame of ledger.frame_approvals) {
    if (frame.status !== "owner_frame_approved" || frame.approval_source_path !== frameApprovalSourcePath) {
      throw new Error(`${frame.frame_id}: каждый кадр черновика должен быть принят владельцем по стенограмме`);
    }
    if (frame.review_manifest_path === null) {
      continue;
    }
    const manifest = readJson(root, frame.review_manifest_path);
    if (manifest.frame_id !== frame.frame_id) {
      throw new Error(`${frame.frame_id}: реестр ссылается на манифест другого кадра`);
    }
    if (frame.owner_approval_record_path !== null) {
      const manifestApproval = manifest.owner_frame_approval ?? manifest.owner_approval;
      if (
        manifest.status !== "owner_frame_approved" ||
        !frame.owner_approval_record_path.endsWith(`${packagePath}/${manifestApproval?.record_path || ""}`)
      ) {
        throw new Error(`${frame.frame_id}: одобрение кадра должно подтверждаться первичным манифестом и записью владельца`);
      }
    }
  }
}

function validateCandidateRoute(root, ledger) {
  const candidate = readJson(root, candidatePath);
  if (candidate.release_approval_ledger_path !== "../../change-orders/co-2026-003-release-approval-ledger.json") {
    throw new Error("кандидат должен ссылаться на единый реестр разрешений и приёмок");
  }
  if (!sameArray(candidate.active_future_frame_ids, expectedRoute) || candidate.historical_inactive_frame_ids.length !== 0) {
    throw new Error("кандидат должен сохранять все десять исходных экранов в порядке и добавлять три ошибки в конце");
  }
  const activeFrames = candidate.frames.filter((frame) => frame.status === "active_future");
  if (!sameArray(activeFrames.map((frame) => frame.id), expectedRoute)) {
    throw new Error("статусы кадров кандидата должны совпадать с единым порядком маршрута");
  }
  const orderSources = ["lisa-materials-summary", "lisa-materials-full-reference", "lisa-presentation-order"];
  if (
    candidate.active_button.action_definition_count !== 1 ||
    candidate.active_button.button_instances_count !== 3 ||
    !sameArray(candidate.active_button.source_state_ids, orderSources)
  ) {
    throw new Error("кандидат должен сохранить одну команду заказа на трёх исходных экранах");
  }
  if (ledger.final_release.active_release_switch_allowed || candidate.draft_acceptance.active_release_switch_allowed) {
    throw new Error("документационная приёмка не разрешает смену активного выпуска");
  }
}

function validatePublicDataBoundary(root, ledger) {
  const clientData = readJson(root, clientDataPath);
  const control = clientData.source_control;
  if (
    control.source_classification !== "owner_authorized_public_demo_data" ||
    control.git_display_permission !== "owner_authorized_public" ||
    !ledger.public_data_authorization.allow_public_repository_and_archives ||
    !ledger.public_data_authorization.allow_public_visual_derivatives ||
    ledger.public_data_authorization.raw_external_pdf_tracking_allowed
  ) {
    throw new Error("публичное размещение должно быть явно разрешено, а сырые внешние PDF — запрещены к хранению в Git");
  }
}

function validateHistoricalVisualContract(root) {
  const contract = readJson(root, historicalVisualContractPath);
  const scope = contract.release_scope;
  if (
    scope?.applies_to !== "historical_active_release_only" ||
    scope.successor_contract_path !== "source/canonical-svg-frame-pipeline-contract.json" ||
    scope.future_candidate_use !== "forbidden"
  ) {
    throw new Error("исторический договор растровых наложений нельзя применять к будущему кандидату CO-2026-003");
  }
}

function validateAcceptedFullDeliveryText(ledger) {
  if (ledger.pending_text_selections.some((topic) => topic.topic_id === "delivery_full_failure_message")) {
    throw new Error("текст полной недоставки не должен оставаться в ожидающих выборах после решения владельца");
  }
  const accepted = ledger.accepted_text_decisions.find(
    (topic) => topic.topic_id === "delivery_full_failure_message",
  );
  if (
    accepted?.status !== "owner_selected" ||
    accepted.selected_text !== fullDeliveryFailureMessage ||
    accepted.decision_source !== fullDeliveryFailureDecisionSource
  ) {
    throw new Error("реестр должен хранить точный согласованный текст полной неподтверждённой доставки и его приоритетный источник");
  }
}

function validateIndependentReleaseDecisions(ledger) {
  if (
    ledger.release_decisions.draft_archive.release_allowed !== false ||
    ledger.release_decisions.delivery_archive.public_allowed !== true ||
    ledger.release_decisions.delivery_archive.creation_allowed !== false ||
    ledger.release_decisions.publicity.public_allowed !== true ||
    ledger.release_decisions.high_resolution_render.render_allowed !== false ||
    ledger.release_decisions.high_resolution_render.current_render_allowed !== false
  ) {
    throw new Error("статусы выпуска должны иметь независимые флаги без смешения черновика, архива, публичности и high-res");
  }
}

function validateFinalReleaseBoundary(root, ledger, { requireFinalRelease }) {
  const finalRelease = ledger.final_release;
  validateAcceptedFullDeliveryText(ledger);
  validateIndependentReleaseDecisions(ledger);
  if (finalRelease.status === "pending_owner_approval") {
    if (
      finalRelease.active_release_switch_allowed ||
      finalRelease.high_resolution_render_allowed ||
      finalRelease.delivery_archive_allowed ||
      finalRelease.candidate_fingerprint !== null ||
      finalRelease.fresh_evidence_path !== null
    ) {
      throw new Error("до итоговой приёмки владельца запрещены чистовой рендер, смена активного выпуска и архив поставки");
    }
    if (fs.existsSync(path.join(root, deliveryArchivePath))) {
      throw new Error("архив поставки не должен существовать при ожидающем итоговом выпуске");
    }
    if (requireFinalRelease) {
      throw new Error("итоговая приёмка владельца ещё не получена: чистовой рендер, смена активного выпуска и архив поставки запрещены");
    }
    return;
  }

  if (finalRelease.status !== "owner_final_approved") {
    throw new Error("итоговый статус выпуска не распознан");
  }
  if (
    typeof finalRelease.candidate_fingerprint !== "string" ||
    !/^[a-f0-9]{64}$/u.test(finalRelease.candidate_fingerprint) ||
    typeof finalRelease.fresh_evidence_path !== "string"
  ) {
    throw new Error("итоговая приёмка должна задавать отпечаток кандидата и свежие доказательства");
  }
  if (
    finalRelease.high_resolution_render_allowed &&
    ledger.release_decisions.high_resolution_render.render_allowed !== true
  ) {
    throw new Error("high-res нельзя разрешать без отдельного решения по высокоразрешённому рендеру");
  }
  if (
    finalRelease.delivery_archive_allowed &&
    ledger.release_decisions.delivery_archive.creation_allowed !== true
  ) {
    throw new Error("архив поставки нельзя создавать без отдельного разрешения на создание архива");
  }
  if (
    ledger.documentation_cascade.execution_status !== "completed" ||
    ledger.documentation_cascade.candidate_fingerprint !== finalRelease.candidate_fingerprint
  ) {
    throw new Error("документационный каскад должен быть завершён и связан с тем же отпечатком кандидата");
  }
  if (ledger.pending_text_selections.length !== 0 || ledger.frame_approvals.some((frame) => frame.status !== "owner_frame_approved")) {
    throw new Error("до итогового выпуска должны быть закрыты все ожидающие текстовые решения и приёмка всех кадров");
  }
  const packageManifest = readJson(root, finalRelease.prototype_package_manifest_path);
  const evidence = readJson(root, finalRelease.fresh_evidence_path);
  if (
    packageManifest.candidate_fingerprint?.sha256 !== finalRelease.candidate_fingerprint ||
    evidence.candidate_fingerprint?.sha256 !== finalRelease.candidate_fingerprint
  ) {
    throw new Error("манифест прототипа и свежие доказательства должны иметь отпечаток итогового кандидата");
  }
}

try {
  const root = process.cwd();
  const requireFinalRelease = process.argv.slice(2).includes("--require-final-release");
  const ledger = readJson(root, ledgerPath);
  validateSchema(root, ledger);
  validatePublicDataBoundary(root, ledger);
  validateHistoricalVisualContract(root);
  validateCandidateRoute(root, ledger);
  validateFrameApprovals(root, ledger);
  validateFinalReleaseBoundary(root, ledger, { requireFinalRelease });
  process.stdout.write("Единый статус разрешений и приёмок CO-2026-003 проверен.\n");
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "проверка не выполнена"}\n`);
  process.exitCode = 1;
}
