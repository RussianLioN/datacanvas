import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";

const root = process.cwd();
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const sourcePath = `${packagePath}/source`;
const contractPath = `${sourcePath}/canonical-svg-frame-pipeline-contract.json`;
const schemaPath = `${sourcePath}/schemas/canonical-svg-frame-pipeline-contract.schema.json`;
const markdownPath = `${sourcePath}/canonical-svg-frame-pipeline-contract.md`;
const validatorPath = "scripts/validate-canonical-svg-frame-pipeline.mjs";
const candidatePath = `${sourcePath}/prototype-revision-candidate.json`;
const approvedTextsPath = `${sourcePath}/owner-approved-texts.json`;
const presentationPdfDonorRegisterPath = `${sourcePath}/presentation-pdf-donor-register.json`;
const presentationPdfDonorRegisterSchemaPath = `${sourcePath}/schemas/presentation-pdf-donor-register.schema.json`;
const errorFrameReviewContractPath = `${sourcePath}/error-frame-review-contract.json`;
const errorFrameReviewManifestSchemaPath = `${sourcePath}/schemas/error-frame-review-source-manifest.schema.json`;
const errorFrameReviewDirectories = Object.freeze([
  "lisa-order-not-accepted-clock-13-40",
  "lisa-delivery-delayed-clock-13-40",
  "lisa-delivery-partial-clock-13-40",
]);
const activeContractsPath = `${sourcePath}/active-contracts.json`;
const negativeFixturePath = "tests/fixtures/canonical-svg-frame-pipeline-negative.json";
const fullReferenceReviewSourcePath = `${packagePath}/candidate-evidence/frame-review/lisa-materials-full-reference/source.svg`;
const fullReferenceReviewManifestPath = `${packagePath}/candidate-evidence/frame-review/lisa-materials-full-reference/review-source-manifest.json`;
const fullReferenceOwnerApprovalPath = `${packagePath}/candidate-evidence/frame-review/lisa-materials-full-reference/owner-approval.json`;
const fullReferenceBaseSvgPath = "candidate-evidence/frame-review/lisa-materials-full-reference/source.svg";
const fullReferenceBaseOwnerApprovalPath = "candidate-evidence/frame-review/lisa-materials-full-reference/owner-approval.json";
const fullReferenceOwnerApprovalSchemaPath = `${sourcePath}/schemas/lisa-frame-owner-approval.schema.json`;
const generatingReviewDirectory = `${packagePath}/candidate-evidence/frame-review/lisa-presentation-generating`;
const generatingReviewSourcePath = `${generatingReviewDirectory}/source.svg`;
const generatingReviewManifestPath = `${generatingReviewDirectory}/review-source-manifest.json`;
const generatingReviewPath = `${generatingReviewDirectory}/review.md`;
const generatingDraftPngPath = `${generatingReviewDirectory}/draft-current-resolution.png`;
const generatingReviewManifestSchemaPath = `${sourcePath}/schemas/lisa-presentation-generating-review-source-manifest.schema.json`;
const generatingOwnerApprovalPath = `${generatingReviewDirectory}/owner-approval.json`;
const sentReviewDirectory = `${packagePath}/candidate-evidence/frame-review/lisa-presentation-sent`;
const sentReviewSourcePath = `${sentReviewDirectory}/source.svg`;
const sentReviewManifestPath = `${sentReviewDirectory}/review-source-manifest.json`;
const sentReviewPath = `${sentReviewDirectory}/review.md`;
const sentDraftPngPath = `${sentReviewDirectory}/draft-current-resolution.png`;
const sentReviewManifestSchemaPath = `${sourcePath}/schemas/lisa-presentation-sent-review-source-manifest.schema.json`;
const sentOwnerApprovalPath = `${sentReviewDirectory}/owner-approval.json`;
const sentPhoneStatusTimeDonorPath = `${packagePath}/editable-sources/7.3 — Презентация.svg`;
const emailReviewDirectory = `${packagePath}/candidate-evidence/frame-review/lisa-presentation-email`;
const emailReviewSourcePath = `${emailReviewDirectory}/source.svg`;
const emailReviewManifestPath = `${emailReviewDirectory}/review-source-manifest.json`;
const emailReviewDraftPngPath = `${emailReviewDirectory}/draft-current-resolution.png`;
const emailReviewOwnerApprovalPath = `${emailReviewDirectory}/owner-approval.json`;
const emailReviewManifestSchemaPath = `${sourcePath}/schemas/lisa-presentation-email-review-source-manifest.schema.json`;
const generatingClockCorrectionDirectory = `${packagePath}/candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24`;
const generatingClockCorrectionSourcePath = `${generatingClockCorrectionDirectory}/source.svg`;
const generatingClockCorrectionManifestPath = `${generatingClockCorrectionDirectory}/review-source-manifest.json`;
const generatingClockCorrectionReviewPath = `${generatingClockCorrectionDirectory}/review.md`;
const generatingClockCorrectionDraftPngPath = `${generatingClockCorrectionDirectory}/draft-current-resolution.png`;
const generatingClockCorrectionOwnerApprovalPath = `${generatingClockCorrectionDirectory}/owner-approval.json`;
const generatingClockCorrectionManifestSchemaPath = `${sourcePath}/schemas/lisa-presentation-generating-clock-13-24-review-source-manifest.schema.json`;
const generatingClockCorrectionTimeDonorPath = `${packagePath}/editable-sources/08.svg`;
const generationStartedText = "Формирование презентации началось в ЧЧ:ММ и займет не более 20 минут. После завершения презентация будет направлена по электронной почте в SIGMA и OMEGA.";
const deliverySuccessText = "Презентация готова и направлена по электронной почте в ЧЧ:ММ.";

const expectedTopics = Object.freeze([
  "button_label",
  "generation_started_message",
  "delivery_success_message",
  "email_subject",
  "email_body",
]);
const expectedFrameAcceptanceFlow = Object.freeze([
  "owner_text_selected",
  "canonical_svg_existing_group_updated",
  "svg_visual_check",
  "draft_png_current_resolution_rendered",
  "owner_frame_approval",
]);
const expectedPrototypeAcceptanceFlow = Object.freeze([
  "all_frames_approved",
  "draft_full_prototype_current_resolution_rendered",
  "owner_full_prototype_approval",
  "high_resolution_render_from_approved_svg_sources",
  "final_owner_approval",
]);
const expectedPerFrameReview = Object.freeze({
  required: true,
  review_surface: "isolated_current_prototype_copy",
  allowed_changed_frame_count: 1,
  candidate_must_replace_same_frame_id: true,
  next_frame_blocked_until_owner_approval: true,
  active_release_mutation_prohibited: true,
});
const expectedForbiddenMethods = Object.freeze([
  "html_overlay",
  "css_overlay",
  "png_text_overlay",
  "additional_svg_message_overlay",
  "draft_png_upscale_for_final",
]);
const expectedSourceGroupIds = Object.freeze([
  "general_information",
  "business_owners",
  "financial_indicators",
  "cooperation",
  "sber_share",
  "active_deals",
  "potential",
  "preapproved_offers",
  "insights",
  "meeting_agreements",
  "dynamic_suggestions",
  "actions",
]);
const expectedVisibleGroupIds = Object.freeze(expectedSourceGroupIds.slice(0, -2));
const expectedExcludedGroupIds = Object.freeze(["dynamic_suggestions", "actions"]);
const expectedExternalSources = Object.freeze([
  Object.freeze({
    source_id: "presentation_variant_slidedoc_pdf_donor",
    required_for_frame_id: "lisa-presentation-slidedoc",
    required_format: "owner_supplied_pdf_visual_donor",
    canonical_svg_required_before_render: true,
    status: "owner_attachment_received_pending_canonical_svg_intake",
  }),
  Object.freeze({
    source_id: "presentation_variant_sber2025_pdf_donor",
    required_for_frame_id: "lisa-presentation-sber2025",
    required_format: "owner_supplied_pdf_visual_donor",
    canonical_svg_required_before_render: true,
    status: "owner_attachment_received_pending_canonical_svg_intake",
  }),
  Object.freeze({
    source_id: "presentation_variant_mag_pdf_donor",
    required_for_frame_id: "lisa-presentation-mag",
    required_format: "owner_supplied_pdf_visual_donor",
    canonical_svg_required_before_render: true,
    status: "owner_attachment_received_pending_canonical_svg_intake",
  }),
  Object.freeze({
    source_id: "email_frame_owner_visual_reference",
    required_for_frame_id: "lisa-presentation-email",
    required_format: "owner_supplied_email_visual_reference",
    canonical_svg_required_before_render: true,
    status: "repository_svg_candidate_approved_from_owner_visual_reference",
  }),
]);

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readJson(relativePath) {
  assert.ok(fs.existsSync(absolute(relativePath)), `Отсутствует обязательный файл: ${relativePath}`);
  return JSON.parse(fs.readFileSync(absolute(relativePath), "utf8"));
}

function clone(value) {
  return structuredClone(value);
}

function runValidator(options = {}) {
  const args = [validatorPath];
  if (options.contractPath) args.push("--contract", options.contractPath);
  if (options.activeContractsPath) args.push("--active-contracts", options.activeContractsPath);
  return spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
  });
}

function writeJson(baseDir, relativePath, value) {
  const target = path.join(baseDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function copyFile(baseDir, relativePath) {
  const target = path.join(baseDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(absolute(relativePath), target);
}

function copyRequiredInputs(tempRoot, contract, activeContracts) {
  writeJson(tempRoot, contractPath, contract);
  writeJson(tempRoot, schemaPath, readJson(schemaPath));
  writeJson(tempRoot, candidatePath, readJson(candidatePath));
  writeJson(tempRoot, approvedTextsPath, readJson(approvedTextsPath));
  writeJson(tempRoot, presentationPdfDonorRegisterPath, readJson(presentationPdfDonorRegisterPath));
  writeJson(tempRoot, presentationPdfDonorRegisterSchemaPath, readJson(presentationPdfDonorRegisterSchemaPath));
  writeJson(tempRoot, errorFrameReviewContractPath, readJson(errorFrameReviewContractPath));
  writeJson(tempRoot, errorFrameReviewManifestSchemaPath, readJson(errorFrameReviewManifestSchemaPath));
  for (const directory of errorFrameReviewDirectories) {
    const reviewDirectory = `${packagePath}/candidate-evidence/frame-review/${directory}`;
    writeJson(tempRoot, `${reviewDirectory}/review-source-manifest.json`, readJson(`${reviewDirectory}/review-source-manifest.json`));
    writeJson(tempRoot, `${reviewDirectory}/owner-approval.json`, readJson(`${reviewDirectory}/owner-approval.json`));
    copyFile(tempRoot, `${reviewDirectory}/source.svg`);
    copyFile(tempRoot, `${reviewDirectory}/draft-current-resolution.png`);
  }
  writeJson(tempRoot, fullReferenceReviewManifestPath, readJson(fullReferenceReviewManifestPath));
  writeJson(tempRoot, fullReferenceOwnerApprovalPath, readJson(fullReferenceOwnerApprovalPath));
  copyFile(tempRoot, fullReferenceReviewSourcePath);
  writeJson(tempRoot, generatingReviewManifestPath, readJson(generatingReviewManifestPath));
  copyFile(tempRoot, generatingReviewSourcePath);
  writeJson(tempRoot, generatingOwnerApprovalPath, readJson(generatingOwnerApprovalPath));
  writeJson(tempRoot, generatingClockCorrectionManifestPath, readJson(generatingClockCorrectionManifestPath));
  copyFile(tempRoot, generatingClockCorrectionSourcePath);
  copyFile(tempRoot, generatingClockCorrectionDraftPngPath);
  writeJson(tempRoot, generatingClockCorrectionOwnerApprovalPath, readJson(generatingClockCorrectionOwnerApprovalPath));
  writeJson(tempRoot, sentReviewManifestPath, readJson(sentReviewManifestPath));
  writeJson(tempRoot, sentOwnerApprovalPath, readJson(sentOwnerApprovalPath));
  copyFile(tempRoot, sentReviewSourcePath);
  copyFile(tempRoot, sentPhoneStatusTimeDonorPath);
  writeJson(tempRoot, emailReviewManifestPath, readJson(emailReviewManifestPath));
  writeJson(tempRoot, emailReviewOwnerApprovalPath, readJson(emailReviewOwnerApprovalPath));
  writeJson(tempRoot, emailReviewManifestSchemaPath, readJson(emailReviewManifestSchemaPath));
  copyFile(tempRoot, emailReviewSourcePath);
  copyFile(tempRoot, emailReviewDraftPngPath);
  writeJson(tempRoot, activeContractsPath, activeContracts);
}

function schemaValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  return ajv.compile(readJson(schemaPath));
}

function phoneStatusTimePath(svg) {
  const match = svg.match(/<path id="Time" d="([^"]+)"/u);
  assert.ok(match, "в SVG должен быть штатный контур системного времени телефона");
  return match[1];
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

function mutate(contract, activeContracts, mutation) {
  switch (mutation) {
    case "set-active-true":
      contract.active = true;
      break;
    case "set-render-allowed-true":
      contract.render_allowed = true;
      break;
    case "set-prototype-candidate-version-2":
      contract.prototype_revision_candidate.expected_version = "2.0.0";
      break;
    case "remove-future-frame":
      contract.future_frame_ids.pop();
      contract.frame_svg_sources.pop();
      break;
    case "add-future-frame":
      contract.future_frame_ids.push("unexpected-frame");
      contract.frame_svg_sources.push({
        frame_id: "unexpected-frame",
        svg_editing_mode: "canonical_svg_existing_groups_only",
        canonical_svg_status: "pending_source",
        approved_text_status: "pending",
        svg_visual_check_status: "pending",
        draft_png_status: "blocked",
        owner_frame_approval_status: "pending",
      });
      break;
    case "wrong-external-source":
      contract.external_sources[0].source_id = "wrong_source";
      break;
    case "add-selected-text":
      contract.message_topics[0].selected_text = "Создать презентацию";
      break;
    case "set-message-topic-pending":
      contract.message_topics[0].status = "pending_owner_selection";
      break;
    case "swap-frame-acceptance-order":
      [contract.acceptance.frame_flow[0], contract.acceptance.frame_flow[1]] = [
        contract.acceptance.frame_flow[1],
        contract.acceptance.frame_flow[0],
      ];
      break;
    case "remove-forbidden-method":
      contract.forbidden_methods.pop();
      break;
    case "add-local-path":
      contract.external_sources[0].source_path = "/Users/example/source.svg";
      break;
    case "add-docx-name":
      contract.external_sources[0].source_file_name = "source.docx";
      break;
    case "add-sha256":
      contract.external_sources[0].sha256 = "a".repeat(64);
      break;
    case "add-contract-to-active-registry":
      activeContracts.active_contracts.push({
        id: "canonical-svg-frame-pipeline",
        path: "source/canonical-svg-frame-pipeline-contract.json",
        schema: "source/schemas/canonical-svg-frame-pipeline-contract.schema.json",
      });
      break;
    case "replace-approved-continuation-base":
      contract.frame_review_session.base_svg_path = "editable-sources/7.2 — Длинное название клиента + холдинг.svg";
      break;
    default:
      throw new Error(`Неизвестная отрицательная мутация: ${mutation}`);
  }
}

test("неактивный договор SVG-first кадров существует рядом со схемой, описанием и валидатором", () => {
  assert.ok(fs.existsSync(absolute(contractPath)), `Отсутствует обязательный файл: ${contractPath}`);
  assert.ok(fs.existsSync(absolute(schemaPath)), `Отсутствует обязательный файл: ${schemaPath}`);
  assert.ok(fs.existsSync(absolute(markdownPath)), `Отсутствует обязательный файл: ${markdownPath}`);
  assert.ok(fs.existsSync(absolute(validatorPath)), `Отсутствует обязательный файл: ${validatorPath}`);
  assert.ok(fs.existsSync(absolute(presentationPdfDonorRegisterPath)), `Отсутствует обязательный файл: ${presentationPdfDonorRegisterPath}`);
  assert.ok(fs.existsSync(absolute(presentationPdfDonorRegisterSchemaPath)), `Отсутствует обязательный файл: ${presentationPdfDonorRegisterSchemaPath}`);
  assert.ok(fs.existsSync(absolute(fullReferenceOwnerApprovalPath)), `Отсутствует обязательный файл: ${fullReferenceOwnerApprovalPath}`);
  assert.ok(fs.existsSync(absolute(fullReferenceOwnerApprovalSchemaPath)), `Отсутствует обязательный файл: ${fullReferenceOwnerApprovalSchemaPath}`);
  assert.ok(fs.existsSync(absolute(generatingReviewSourcePath)), `Отсутствует изолированный SVG второго кадра: ${generatingReviewSourcePath}`);
  assert.ok(fs.existsSync(absolute(generatingReviewManifestPath)), `Отсутствует манифест второго кадра: ${generatingReviewManifestPath}`);
  assert.ok(fs.existsSync(absolute(generatingReviewPath)), `Отсутствует журнал второго кадра: ${generatingReviewPath}`);
  assert.ok(fs.existsSync(absolute(generatingDraftPngPath)), `Отсутствует черновой PNG второго кадра: ${generatingDraftPngPath}`);
  assert.ok(fs.existsSync(absolute(generatingReviewManifestSchemaPath)), `Отсутствует схема манифеста второго кадра: ${generatingReviewManifestSchemaPath}`);
  assert.ok(fs.existsSync(absolute(generatingOwnerApprovalPath)), `Отсутствует запись приёмки второго кадра: ${generatingOwnerApprovalPath}`);
  assert.ok(fs.existsSync(absolute(sentReviewSourcePath)), `Отсутствует изолированный SVG кадра успеха: ${sentReviewSourcePath}`);
  assert.ok(fs.existsSync(absolute(sentReviewManifestPath)), `Отсутствует манифест кадра успеха: ${sentReviewManifestPath}`);
  assert.ok(fs.existsSync(absolute(sentReviewPath)), `Отсутствует журнал кадра успеха: ${sentReviewPath}`);
  assert.ok(fs.existsSync(absolute(sentDraftPngPath)), `Отсутствует черновой PNG кадра успеха: ${sentDraftPngPath}`);
  assert.ok(fs.existsSync(absolute(sentReviewManifestSchemaPath)), `Отсутствует схема манифеста кадра успеха: ${sentReviewManifestSchemaPath}`);
  assert.ok(fs.existsSync(absolute(generatingClockCorrectionSourcePath)), `Отсутствует SVG исправления времени: ${generatingClockCorrectionSourcePath}`);
  assert.ok(fs.existsSync(absolute(generatingClockCorrectionManifestPath)), `Отсутствует манифест исправления времени: ${generatingClockCorrectionManifestPath}`);
  assert.ok(fs.existsSync(absolute(generatingClockCorrectionReviewPath)), `Отсутствует журнал исправления времени: ${generatingClockCorrectionReviewPath}`);
  assert.ok(fs.existsSync(absolute(generatingClockCorrectionDraftPngPath)), `Отсутствует черновой PNG исправления времени: ${generatingClockCorrectionDraftPngPath}`);
  assert.ok(fs.existsSync(absolute(generatingClockCorrectionOwnerApprovalPath)), `Отсутствует запись приёмки исправления времени: ${generatingClockCorrectionOwnerApprovalPath}`);
  assert.ok(fs.existsSync(absolute(generatingClockCorrectionManifestSchemaPath)), `Отсутствует схема манифеста исправления времени: ${generatingClockCorrectionManifestSchemaPath}`);
});

test("общий контроль качества включает схему и семантическую проверку будущего SVG-договора", () => {
  const packageManifest = readJson("package.json");
  const schemaValidator = fs.readFileSync(absolute("scripts/validate-json-schema.mjs"), "utf8");

  assert.match(packageManifest.scripts.test, /validate:canonical-svg-frame-pipeline/u);
  assert.match(packageManifest.scripts["check:lisa-presentation-generating-review-draft"], /prepare-lisa-presentation-generating-review-source\.mjs --check/u, "проверка второго кадра должна сначала сверять сохранённый SVG с повторной подготовкой из канонического источника");
  assert.match(schemaValidator, /canonical-svg-frame-pipeline-contract\.schema\.json/u);
  assert.match(schemaValidator, /presentation-pdf-donor-register\.schema\.json/u);
  assert.match(schemaValidator, /lisa-full-reference-review-source-manifest\.schema\.json/u);
  assert.match(schemaValidator, /lisa-presentation-generating-review-source-manifest\.schema\.json/u);
  assert.match(schemaValidator, /lisa-presentation-sent-review-source-manifest\.schema\.json/u);
  assert.match(schemaValidator, /lisa-presentation-generating-clock-13-24-review-source-manifest\.schema\.json/u);
  assert.match(schemaValidator, /lisa-frame-owner-approval\.schema\.json/u);
});

test("неактивный договор наследует кадры и смысловые ребра из подготовительного кандидата v1", () => {
  if (!fs.existsSync(absolute(contractPath))) return;
  const contract = readJson(contractPath);
  const candidate = readJson(candidatePath);

  assert.equal(contract.version, "4.1.0");
  assert.equal(contract.status, "inactive_pending_presentation_variant_frame_approval");
  assert.equal(contract.active, false);
  assert.equal(contract.generator_input, false);
  assert.equal(contract.render_allowed, false);
  assert.equal(contract.archive_allowed, false);
  assert.equal(contract.prototype_revision_candidate.path, "source/prototype-revision-candidate.json");
  assert.equal(contract.prototype_revision_candidate.expected_version, "1.0.0");
  assert.equal(candidate.version, "1.0.0");
  assert.deepEqual(contract.future_frame_ids, candidate.active_future_frame_ids);
  assert.deepEqual(contract.historical_reference_frame_ids, candidate.historical_inactive_frame_ids);

  const semanticGraph = candidate.semantic_graphs.find((graph) => graph.graph_type === "semantic_transition");
  const galleryGraph = candidate.semantic_graphs.find((graph) => graph.graph_id === "stakeholder_gallery_order");
  assert.deepEqual(contract.scenario_edges, semanticGraph.edges);
  assert.deepEqual(contract.stakeholder_gallery_order, {
    graph_id: "stakeholder_gallery_order",
    is_user_scenario_transition: false,
    ordered_state_ids: galleryGraph.ordered_state_ids,
  });
});

test("выбранные тексты и покадровые источники фиксируют принятые кадры и блокировку письма до SVG-источника", () => {
  if (!fs.existsSync(absolute(contractPath))) return;
  const contract = readJson(contractPath);
  const candidate = readJson(candidatePath);

  assert.deepEqual(contract.message_topics.map((topic) => topic.topic_id), expectedTopics);
  for (const topic of contract.message_topics) {
    assert.deepEqual(Object.keys(topic).sort(), ["render_blocker", "status", "topic_id"]);
    assert.equal(topic.status, "owner_approved");
    assert.equal(topic.render_blocker, true);
  }

  assert.equal(contract.text_selection_source.path, "source/owner-approved-texts.json");
  assert.equal(readJson(approvedTextsPath).status, "owner_approved");

  assert.deepEqual(contract.external_sources, expectedExternalSources);
  assert.deepEqual(contract.presentation_pdf_donor_register, {
    path: "source/presentation-pdf-donor-register.json",
    raw_pdf_direct_render_prohibited: true,
    all_received_pdf_donors_require_canonical_svg: true,
  });
  assert.deepEqual(contract.client_reference_svg_update, {
    source_data_path: "source/client-reference-data.json",
    historical_client_marker: "ГК Достовалова",
    replacement_client_name: "ООО «Водолей Трейд»",
    full_reference_frame_id: "lisa-materials-full-reference",
    source_group_ids_preserved: expectedSourceGroupIds,
    visible_group_ids: expectedVisibleGroupIds,
    excluded_group_ids: expectedExcludedGroupIds,
    exclusion_scope: "visual_frame_only",
    source_data_mutation_allowed: false,
    cta_geometry: {
      button_rect: { x: 80, y: 4968, width: 361, height: 40 },
      font_size: 16,
      center_tolerance_px: 0.5,
      measurement_method: "pinned_font_path_bounding_box",
    },
    continuation_frame_ids: [
      "lisa-presentation-generating",
      "lisa-presentation-chat-list",
      "lisa-presentation-sent",
      "lisa-order-not-accepted",
      "lisa-delivery-delayed",
      "lisa-delivery-partial",
    ],
    svg_editing_mode: "canonical_svg_existing_groups_only",
    status: "pending_frame_cycle",
  });
  const donorRegister = readJson(presentationPdfDonorRegisterPath);
  assert.equal(donorRegister.status, "owner_attachments_received_pending_canonical_svg_intake");
  assert.equal(donorRegister.raw_pdf_direct_render_prohibited, true);
  assert.equal(donorRegister.donors.length, 3);
  assert.deepEqual(donorRegister.donors.map((donor) => donor.frame_id), [
    "lisa-presentation-slidedoc",
    "lisa-presentation-sber2025",
    "lisa-presentation-mag",
  ]);
  assert.ok(donorRegister.donors.every((donor) => donor.page_count === 3 && donor.sha256.length === 64));
  assert.deepEqual(
    contract.frame_svg_sources.map((frame) => frame.frame_id),
    candidate.active_future_frame_ids,
  );
  for (const frame of contract.frame_svg_sources) {
    assert.deepEqual(Object.keys(frame).sort(), [
      "approved_text_status",
      "canonical_svg_status",
      "draft_png_status",
      "frame_id",
      "owner_frame_approval_status",
      "svg_editing_mode",
      "svg_visual_check_status",
    ]);
    assert.equal(
      frame.svg_editing_mode,
      frame.frame_id === "lisa-presentation-slidedoc"
        ? "new_canonical_svg_composition_from_pdf_visual_reference"
        : "canonical_svg_existing_groups_only",
    );
    if (frame.frame_id === "lisa-materials-full-reference") {
      assert.deepEqual(frame, {
        frame_id: "lisa-materials-full-reference",
        svg_editing_mode: "canonical_svg_existing_groups_only",
        canonical_svg_status: "prepared_existing_group_content_replaced",
        approved_text_status: "owner_approved",
        svg_visual_check_status: "passed",
        draft_png_status: "rendered_current_resolution",
        owner_frame_approval_status: "approved",
      });
    } else if (frame.frame_id === "lisa-presentation-generating") {
      assert.deepEqual(frame, {
        frame_id: "lisa-presentation-generating",
        svg_editing_mode: "canonical_svg_existing_groups_only",
        canonical_svg_status: "prepared_existing_group_content_replaced",
        approved_text_status: "owner_approved",
        svg_visual_check_status: "passed",
        draft_png_status: "rendered_current_resolution",
        owner_frame_approval_status: "approved",
      });
    } else if (frame.frame_id === "lisa-presentation-chat-list") {
      assert.deepEqual(frame, {
        frame_id: "lisa-presentation-chat-list",
        svg_editing_mode: "canonical_svg_existing_groups_only",
        canonical_svg_status: "preserved_without_rework",
        approved_text_status: "not_applicable",
        svg_visual_check_status: "not_required",
        draft_png_status: "existing_frame_preserved",
        owner_frame_approval_status: "not_required",
      });
    } else if (frame.frame_id === "lisa-presentation-sent") {
      assert.deepEqual(frame, {
        frame_id: "lisa-presentation-sent",
        svg_editing_mode: "canonical_svg_existing_groups_only",
        canonical_svg_status: "prepared_existing_group_content_replaced",
        approved_text_status: "owner_approved",
        svg_visual_check_status: "passed",
        draft_png_status: "rendered_current_resolution",
        owner_frame_approval_status: "approved",
      });
    } else if (frame.frame_id === "lisa-presentation-email") {
      assert.deepEqual(frame, {
        frame_id: "lisa-presentation-email",
        svg_editing_mode: "canonical_svg_existing_groups_only",
        canonical_svg_status: "prepared_visual_reference_composition",
        approved_text_status: "owner_approved",
        svg_visual_check_status: "passed",
        draft_png_status: "rendered_current_resolution",
        owner_frame_approval_status: "approved",
      });
    } else if (frame.frame_id === "lisa-presentation-slidedoc") {
      assert.deepEqual(frame, {
        frame_id: "lisa-presentation-slidedoc",
        svg_editing_mode: "new_canonical_svg_composition_from_pdf_visual_reference",
        canonical_svg_status: "prepared_new_canonical_svg_composition",
        approved_text_status: "approved_for_demo_model",
        svg_visual_check_status: "passed",
        draft_png_status: "rendered_current_resolution",
        owner_frame_approval_status: "pending",
      });
    } else if (["lisa-order-not-accepted", "lisa-delivery-delayed", "lisa-delivery-partial"].includes(frame.frame_id)) {
      assert.deepEqual(frame, {
        frame_id: frame.frame_id,
        svg_editing_mode: "canonical_svg_existing_groups_only",
        canonical_svg_status: "prepared_existing_group_content_replaced",
        approved_text_status: "authoritative_interview_agreed",
        svg_visual_check_status: "passed",
        draft_png_status: "rendered_current_resolution",
        owner_frame_approval_status: "approved",
      });
    } else {
      assert.equal(frame.canonical_svg_status, "pending_source");
      assert.equal(frame.approved_text_status, "pending");
      assert.equal(frame.svg_visual_check_status, "pending");
      assert.equal(frame.draft_png_status, "blocked");
      assert.equal(frame.owner_frame_approval_status, "pending");
    }
  }
});

test("принятый первый проверочный кадр изолирован, основан на SVG полной справки и не затрагивает действующий выпуск", () => {
  if (!fs.existsSync(absolute(contractPath))) return;
  const contract = readJson(contractPath);

  assert.deepEqual(contract.frame_review_session, {
    status: "presentation_variant_frame_pending_owner_approval",
    current_frame_id: "lisa-presentation-slidedoc",
    next_frame_id: "lisa-presentation-sber2025",
    source_svg_path: "candidate-evidence/frame-review/lisa-presentation-slidedoc/source.svg",
    draft_png_path: "candidate-evidence/frame-review/lisa-presentation-slidedoc/draft-current-resolution.png",
    review_manifest_path: "candidate-evidence/frame-review/lisa-presentation-slidedoc/review-source-manifest.json",
    base_frame_id: "lisa-presentation-email",
    base_svg_path: "candidate-evidence/frame-review/lisa-presentation-email/source.svg",
    base_owner_approval_path: "candidate-evidence/frame-review/lisa-presentation-email/owner-approval.json",
    transition_rendering_mode: "separate_desktop_frame",
    dynamic_footer: null,
    edit_mode: "new_canonical_svg_composition_from_pdf_visual_reference",
    prohibited_legacy_overlay_ids: ["html_overlay", "css_overlay", "png_text_overlay"],
    active_release_mutation_prohibited: true,
    owner_approval_record_path: null,
    next_frame_blocked_until_owner_approval: true,
    skipped_frame_id: "lisa-presentation-chat-list",
    skipped_frame_reason: "owner_direction_no_rework",
    error_review_batch: {
      contract_path: "source/error-frame-review-contract.json",
      candidate_frame_ids: ["lisa-order-not-accepted", "lisa-delivery-delayed", "lisa-delivery-partial"],
      acceptance_mode: "all_frames_approved",
      full_delivery_representation_frame_id: "lisa-delivery-partial",
      draft_preparation_authorized_by_owner: true,
    },
  });
  assert.ok(fs.existsSync(absolute(fullReferenceReviewSourcePath)), "должен существовать изолированный SVG первого кадра");
  assert.ok(fs.existsSync(absolute(fullReferenceReviewManifestPath)), "должен существовать манифест источника первого кадра");
  assert.ok(fs.existsSync(absolute(`${packagePath}/candidate-evidence/frame-review/lisa-materials-full-reference/draft-current-resolution.png`)), "должен существовать черновой PNG первого кадра");

  const reviewSource = fs.readFileSync(absolute(fullReferenceReviewSourcePath), "utf8");
  const manifest = readJson(fullReferenceReviewManifestPath);
  const approval = readJson(fullReferenceOwnerApprovalPath);
  assert.doesNotMatch(reviewSource, /id="lisa-edit-/u, "в проверочном SVG не допускаются исторические накладки");
  assert.doesNotMatch(reviewSource, /<text\b/u, "новый текст кадра должен остаться векторными контурами SVG");
  assert.match(reviewSource, /id="Frame 2131329748"/u, "проверочный SVG обязан сохранять существующую группу кадра");

  const generatingSource = fs.readFileSync(absolute(generatingReviewSourcePath), "utf8");
  const generatingManifest = readJson(generatingReviewManifestPath);
  assert.doesNotMatch(generatingSource, /id="lisa-edit-/u, "во втором SVG не допускаются исторические накладки");
  assert.doesNotMatch(generatingSource, /<text\b/u, "текст второго кадра должен остаться векторными контурами SVG");
  assert.match(generatingSource, /data-review-frame-id="lisa-presentation-generating"/u, "второй кадр обязан стать динамическим состоянием полной справки");
  assert.match(generatingSource, /id="lisa-review-group-general_information"/u, "второй кадр обязан сохранить содержимое полной справки");
  assert.match(generatingSource, /id="lisa-review-generation-status"/u, "второй кадр обязан показывать сообщение о начале");
  assert.equal((generatingSource.match(/id="button"/gu) || []).length, 1, "второй кадр не должен создавать повторяющийся идентификатор подписи действия");
  assert.match(generatingSource, new RegExp(`aria-label="${generationStartedText}"`, "u"), "второй кадр должен содержать утверждённое сообщение в доступной подписи");
  assert.equal(generatingManifest.status, "owner_frame_approved");
  assert.equal(generatingManifest.frame_id, "lisa-presentation-generating");
  assert.equal(generatingManifest.base_svg_path, fullReferenceBaseSvgPath);
  assert.equal(generatingManifest.base_frame_id, "lisa-materials-full-reference");
  assert.equal(generatingManifest.transition_rendering_mode, "same_screen_dynamic_state");
  assert.deepEqual(generatingManifest.owner_frame_approval, {
    record_path: "candidate-evidence/frame-review/lisa-presentation-generating/owner-approval.json",
    decision: "approved",
    decision_text: "кадр принят",
    decision_source: "Product Owner в рабочем чате",
    approved_at: "2026-08-24T07:10:11Z",
  }, "второй кадр должен иметь отдельную запись принятия владельцем");
  assert.match(reviewSource, /id="Group 2131328969"/u, "проверочный SVG обязан заменить содержимое существующей группы справки");
  assert.match(reviewSource, /id="button_footer_2\.0"/u, "проверочный SVG обязан сохранить нижнюю кнопку");
  assert.match(reviewSource, /aria-label="Создать презентацию по справке"/u, "проверочный SVG обязан использовать согласованный текст кнопки");
  assert.match(reviewSource, /data-pixso-skip-parse="true"/u, "проверочный SVG обязан сохранить существующую подложку нижней панели");
  assert.match(reviewSource, /data-review-button-label="centered-large"/u, "подпись должна заменять существующий путь кнопки крупным центрированным векторным текстом");
  assert.match(reviewSource, /id="2\.0_chevron_down_sm-24" opacity="0"/u, "замена подписи не должна пересобирать или терять исходный блок кнопки");
  assert.doesNotMatch(reviewSource, /id="lisa-actions-source-native-list"/u, "действия не должны отображаться в первом кадре");
  assert.doesNotMatch(reviewSource, /data-review-action-row=/u, "строки действий не должны отображаться в первом кадре");
  assert.doesNotMatch(reviewSource, /data-review-rendered-group-id="dynamic_suggestions"/u, "динамические подсказки не должны отображаться в первом кадре");
  assert.doesNotMatch(reviewSource, /data-review-rendered-group-id="actions"/u, "действия не должны отображаться в первом кадре");
  assert.deepEqual(
    [...reviewSource.matchAll(/data-review-rendered-group-id="([a-z_]+)"/gu)].map((match) => match[1]),
    expectedVisibleGroupIds,
    "SVG должен показывать только разрешенные группы полной справки",
  );
  assert.deepEqual(manifest.covered_group_ids, readJson(`${sourcePath}/client-reference-data.json`).coverage.required_group_ids);
  assert.deepEqual(manifest.visible_projection, {
    mode: "exclude_source_groups_from_visual_frame_only",
    visible_group_ids: expectedVisibleGroupIds,
    excluded_group_ids: expectedExcludedGroupIds,
    source_data_preserved: true,
    last_visible_group_id: "meeting_agreements",
  });
  assert.equal(manifest.active_release_mutation_prohibited, true);
  assert.equal(manifest.draft_png_rendered, true, "после визуальной проверки SVG должен быть создан черновой PNG");
  assert.equal(manifest.status, "owner_frame_approved");
  assert.deepEqual(manifest.owner_approval, {
    record_path: "candidate-evidence/frame-review/lisa-materials-full-reference/owner-approval.json",
    decision: "approved",
    decision_text: "кадр принят",
    decision_source: "Product Owner в рабочем чате",
    approved_at: "2026-08-20T17:02:02Z",
  });
  assert.deepEqual(approval, {
    $schema: "../../../source/schemas/lisa-frame-owner-approval.schema.json",
    version: "1.0.0",
    change_order_id: "CO-2026-003",
    frame_id: "lisa-materials-full-reference",
    decision: "approved",
    decision_text: "кадр принят",
    decision_source: "Product Owner в рабочем чате",
    approved_at: "2026-08-20T17:02:02Z",
    approved_source_svg_sha256: manifest.source_svg_sha256,
    approved_draft_png_sha256: manifest.draft_png_sha256,
  });
  assert.equal(manifest.button_label_text, "Создать презентацию по справке");
  assert.deepEqual(manifest.button_geometry.button_rect, { x: 80, y: 4968, width: 361, height: 40 });
  assert.equal(manifest.button_geometry.font_size, 16);
  assert.ok(manifest.button_geometry.text_bbox.x1 >= 80, "подпись кнопки не должна выходить влево за кнопку");
  assert.ok(manifest.button_geometry.text_bbox.x2 <= 441, "подпись кнопки не должна выходить вправо за кнопку");
  assert.ok(Math.abs(manifest.button_geometry.center_delta.x) <= 0.5, "подпись кнопки должна быть центрирована по горизонтали");
  assert.ok(Math.abs(manifest.button_geometry.center_delta.y) <= 0.5, "подпись кнопки должна быть центрирована по вертикали");
  assert.deepEqual(manifest.draft_png_dimensions, { width: 521, height: manifest.frame_geometry.canvas_height });
  assert.ok(manifest.draft_png_non_white_pixel_count >= 1_000, "черновой PNG не должен быть пустым");
});

test("кадр начала формирования является динамическим продолжением принятой полной справки", () => {
  if (!fs.existsSync(absolute(contractPath))) return;
  const contract = readJson(contractPath);
  const approvedBaseManifest = readJson(fullReferenceReviewManifestPath);
  const approvedBaseSource = fs.readFileSync(absolute(fullReferenceReviewSourcePath), "utf8");
  const generatingSource = fs.readFileSync(absolute(generatingReviewSourcePath), "utf8");
  const generatingManifest = readJson(generatingReviewManifestPath);

  assert.equal(
    contract.frame_svg_sources.find((frame) => frame.frame_id === "lisa-presentation-generating").owner_frame_approval_status,
    "approved",
  );

  assert.equal(generatingManifest.base_frame_id, "lisa-materials-full-reference");
  assert.equal(generatingManifest.base_svg_path, fullReferenceBaseSvgPath);
  assert.equal(generatingManifest.base_svg_sha256, approvedBaseManifest.source_svg_sha256);
  assert.equal(generatingManifest.base_owner_approval_path, fullReferenceBaseOwnerApprovalPath);
  assert.equal(generatingManifest.transition_rendering_mode, "same_screen_dynamic_state");
  assert.deepEqual(generatingManifest.draft_png_dimensions, { width: 521, height: 3226 });
  assert.deepEqual(generatingManifest.dynamic_footer, {
    button_translate_y: -18,
    background_fill: "rgb(224,227,234)",
    label_fill: "rgb(143,148,160)",
    status_placement: "below_disabled_button",
    extension_height: 82,
  }, "погашенная кнопка и сообщение должны составлять одну нижнюю фиксированную панель");
  assert.deepEqual(generatingManifest.disabled_button, {
    existing_group_id: "buttons_2.0",
    aria_disabled: true,
    opacity: 1,
    label_unchanged: true,
  }, "состояние блокировки не должно достигаться полупрозрачностью синей активной кнопки");
  assert.deepEqual(generatingManifest.generation_started_message.safe_area, {
    x: 80,
    y: 2958,
    width: 345,
    height: 64,
  }, "сообщение должно находиться под погашенной кнопкой в расширенной нижней панели");
  assert.equal(generatingManifest.generation_started_message.font_size, 11.5, "сообщение должно использовать тот же кегль, что и текст полной справки");
  assert.equal(generatingManifest.generation_started_message.fill, "rgb(73,80,94)", "сообщение должно использовать тот же цвет, что и текст полной справки");
  assert.equal(generatingManifest.generation_started_message.inserted_into_existing_frame_group_id, "button_footer_2.0", "сообщение под кнопкой должно находиться над штатной подложкой в существующей группе нижней панели");
  assert.equal(
    generatingManifest.generation_started_message.line_widths.length,
    generatingManifest.generation_started_message.display_lines.length,
    "для каждой строки сообщения должна быть измерена фактическая ширина",
  );
  for (const width of generatingManifest.generation_started_message.line_widths) {
    assert.ok(width <= generatingManifest.generation_started_message.safe_area.width, "строка статуса не должна выходить за ширину свободной зоны");
  }

  assert.match(generatingSource, /data-review-frame-id="lisa-presentation-generating"/u);
  assert.match(generatingSource, /id="buttons_2\.0"[^>]*aria-disabled="true"[^>]*data-review-button-state="disabled"/u);
  assert.match(generatingSource, /id="buttons_2\.0"[^>]*transform="translate\(0 -18\)"/u, "погашенная кнопка должна быть поднята внутри фиксированной нижней панели");
  assert.match(generatingSource, /id="buttons_2\.0"[\s\S]*?<rect id="buttons_2\.0"[^>]*fill="rgb\(224,227,234\)"/u, "фон погашенной кнопки должен быть бледно-серым");
  assert.match(generatingSource, /id="lisa-review-generation-status"/u);
  assert.ok(
    generatingSource.indexOf('id="lisa-review-generation-status"') > generatingSource.indexOf('id="Home indicator"'),
    "сообщение должно размещаться после подложки нижней панели и не может быть ею перекрыто",
  );
  assert.match(generatingSource, new RegExp(`aria-label="${generationStartedText}"`, "u"));
  assert.doesNotMatch(generatingSource, /<text\b|<foreignObject\b[^>]*lisa-review-generation-status|lisa-status-|lisa-edit-/u);
  assert.doesNotMatch(generatingSource, /7\.2 — Длинное название клиента/u);

  for (const groupId of expectedVisibleGroupIds) {
    const baseMatch = approvedBaseSource.match(new RegExp(`<g id="lisa-review-group-${groupId}"[\\s\\S]*?<\\/g>`, "u"));
    assert.ok(baseMatch, `в принятом первом кадре отсутствует группа ${groupId}`);
    assert.ok(generatingSource.includes(baseMatch[0]), `второй кадр утратил содержимое принятой группы ${groupId}`);
  }
});

test("принятый кадр начала ведёт к отдельному черновому кадру успеха после неизменяемого списка чатов", () => {
  const contract = readJson(contractPath);
  const generatingManifest = readJson(generatingReviewManifestPath);
  const generatingApproval = readJson(generatingOwnerApprovalPath);
  const correctionManifest = readJson(generatingClockCorrectionManifestPath);
  const correctionApproval = readJson(generatingClockCorrectionOwnerApprovalPath);
  const sentSource = fs.readFileSync(absolute(sentReviewSourcePath), "utf8");
  const sentPhoneStatusTimeDonor = fs.readFileSync(absolute(sentPhoneStatusTimeDonorPath), "utf8");
  const sentManifest = readJson(sentReviewManifestPath);
  const sentApproval = readJson(sentOwnerApprovalPath);

  assert.equal(generatingManifest.status, "owner_frame_approved");
  assert.deepEqual(generatingManifest.owner_frame_approval, {
    record_path: "candidate-evidence/frame-review/lisa-presentation-generating/owner-approval.json",
    decision: "approved",
    decision_text: "кадр принят",
    decision_source: "Product Owner в рабочем чате",
    approved_at: generatingApproval.approved_at,
  });
  assert.equal(generatingApproval.frame_id, "lisa-presentation-generating");
  assert.equal(generatingApproval.approved_source_svg_sha256, generatingManifest.source_svg_sha256);
  assert.equal(generatingApproval.approved_draft_png_sha256, generatingManifest.draft_png_sha256);

  const chatListFrame = contract.frame_svg_sources.find((frame) => frame.frame_id === "lisa-presentation-chat-list");
  assert.deepEqual(chatListFrame, {
    frame_id: "lisa-presentation-chat-list",
    svg_editing_mode: "canonical_svg_existing_groups_only",
    canonical_svg_status: "preserved_without_rework",
    approved_text_status: "not_applicable",
    svg_visual_check_status: "not_required",
    draft_png_status: "existing_frame_preserved",
    owner_frame_approval_status: "not_required",
  }, "список чатов должен быть явно исключён владельцем из текущей переработки, а не неявно пропущен");

  assert.equal(contract.frame_review_session.current_frame_id, "lisa-presentation-slidedoc");
  assert.equal(contract.frame_review_session.skipped_frame_id, "lisa-presentation-chat-list");
  assert.equal(contract.frame_review_session.skipped_frame_reason, "owner_direction_no_rework");
  assert.equal(contract.frame_review_session.next_frame_id, "lisa-presentation-sber2025");
  assert.deepEqual(contract.frame_review_session.error_review_batch, {
    contract_path: "source/error-frame-review-contract.json",
    candidate_frame_ids: ["lisa-order-not-accepted", "lisa-delivery-delayed", "lisa-delivery-partial"],
    acceptance_mode: "all_frames_approved",
    full_delivery_representation_frame_id: "lisa-delivery-partial",
    draft_preparation_authorized_by_owner: true,
  });
  assert.equal(sentManifest.base_frame_id, "lisa-presentation-generating");
  assert.equal(sentManifest.base_svg_path, "candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24/source.svg");
  assert.equal(sentManifest.base_svg_sha256, correctionManifest.source_svg_sha256);
  assert.equal(sentManifest.base_owner_approval_path, "candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24/owner-approval.json");
  assert.equal(correctionApproval.approved_source_svg_sha256, correctionManifest.source_svg_sha256);
  assert.equal(sentManifest.status, "owner_frame_approved");
  assert.deepEqual(sentManifest.owner_frame_approval, {
    record_path: "candidate-evidence/frame-review/lisa-presentation-sent/owner-approval.json",
    decision: "approved",
    decision_text: "кадр принят",
    decision_source: "Product Owner в рабочем чате",
    approval_time_precision: "date_only",
    approved_on: "2026-08-24",
  });
  assert.equal(sentApproval.frame_id, "lisa-presentation-sent");
  assert.equal(sentApproval.approval_time_precision, "date_only");
  assert.equal(sentApproval.approved_on, "2026-08-24");
  assert.equal(sentApproval.approved_source_svg_sha256, sentManifest.source_svg_sha256);
  assert.equal(sentApproval.approved_draft_png_sha256, sentManifest.draft_png_sha256);
  assert.deepEqual(sentManifest.draft_png_dimensions, { width: 521, height: 3290 });
  assert.equal(sentManifest.delivery_success_message.text, deliverySuccessText);
  assert.deepEqual(sentManifest.delivery_success_message.display_lines, [
    "Презентация готова и направлена",
    "по электронной почте в 13:38.",
  ]);
  assert.equal(sentManifest.mock_phone_status_time_value, "13:40");
  assert.equal(
    phoneStatusTimePath(sentSource),
    phoneStatusTimePath(sentPhoneStatusTimeDonor),
    "системное время кадра успеха должно быть заменено штатным контуром 13:40 без наложения",
  );
  assert.match(sentSource, /id="lisa-review-generation-status"/u);
  assert.match(sentSource, /id="lisa-review-delivery-success-status"/u);
  assert.match(sentSource, new RegExp(`aria-label="${deliverySuccessText}"`, "u"));
  assert.ok(
    sentSource.indexOf('id="lisa-review-delivery-success-status"') > sentSource.indexOf('id="lisa-review-generation-status"'),
    "сообщение успеха должно продолжать сообщение начала в том же SVG нижней панели",
  );
  assert.match(sentSource, /id="buttons_2\.0"[^>]*aria-disabled="true"[^>]*data-review-button-state="disabled"/u);
  assert.match(sentSource, /id="buttons_2\.0"[\s\S]*?<rect id="buttons_2\.0"[^>]*fill="rgb\(224,227,234\)"/u);
  assert.doesNotMatch(sentSource, /<text\b|lisa-edit-|lisa-status-|<foreignObject\b[^>]*lisa-review-delivery-success-status/u);
});

test("принятая исправляющая версия кадра начала меняет только штатное системное время на 13:24", () => {
  const approvedSource = fs.readFileSync(absolute(generatingReviewSourcePath), "utf8");
  const correctionSource = fs.readFileSync(absolute(generatingClockCorrectionSourcePath), "utf8");
  const correctionManifest = readJson(generatingClockCorrectionManifestPath);
  const timeDonor = fs.readFileSync(absolute(generatingClockCorrectionTimeDonorPath), "utf8");

  assert.equal(correctionManifest.frame_id, "lisa-presentation-generating");
  assert.equal(correctionManifest.status, "owner_frame_approved");
  assert.equal(correctionManifest.base_source_svg_sha256, sha256Text(approvedSource));
  assert.equal(correctionManifest.mock_phone_status_time_value, "13:24");
  assert.deepEqual(correctionManifest.draft_png_dimensions, { width: 521, height: 3226 });
  const correctionApproval = readJson(generatingClockCorrectionOwnerApprovalPath);
  assert.deepEqual(correctionManifest.owner_frame_approval, {
    record_path: "candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24/owner-approval.json",
    decision: "approved",
    decision_text: "кадр принят",
    decision_source: "Product Owner в рабочем чате",
    approved_at: correctionApproval.approved_at,
  });
  assert.equal(correctionApproval.approved_source_svg_sha256, correctionManifest.source_svg_sha256);
  assert.equal(correctionApproval.approved_draft_png_sha256, correctionManifest.draft_png_sha256);
  assert.equal(
    phoneStatusTimePath(correctionSource),
    phoneStatusTimePath(timeDonor),
    "системное время должно быть заменено штатным контуром 13:24 из канонического SVG",
  );
  assert.equal(
    correctionSource.replace(phoneStatusTimePath(correctionSource), phoneStatusTimePath(approvedSource)),
    approvedSource,
    "исправляющая версия не должна менять ничего кроме существующего контура системного времени",
  );
  assert.doesNotMatch(correctionSource, /<text\b|lisa-edit-|lisa-status-|<foreignObject\b[^>]*lisa-review/u);
});

test("проверки сохранённых SVG кадров не требуют локального шрифта в среде CI", () => {
  const emptyHome = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-svg-check-"));
  try {
    for (const scriptPath of [
      "scripts/prepare-lisa-presentation-generating-review-source.mjs",
      "scripts/prepare-lisa-presentation-sent-review-source.mjs",
    ]) {
      const result = spawnSync(process.execPath, [scriptPath, "--check"], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, HOME: emptyHome },
      });
      assert.equal(
        result.status,
        0,
        `${scriptPath} должен проверять сохранённый SVG без локального шрифта:\n${result.stderr}`,
      );
    }
  } finally {
    fs.rmSync(emptyHome, { recursive: true, force: true });
  }
});

test("принятый кадр успеха нельзя неявно вернуть в ожидание повторной подготовкой", () => {
  const result = spawnSync(process.execPath, ["scripts/prepare-lisa-presentation-sent-review-source.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0, "повторная подготовка принятого кадра должна быть заблокирована");
  assert.match(result.stderr, /принятый кадр успеха нельзя пересобирать/u);
});

test("проверка сохранённого PNG принятого кадра успеха не требует повторного рендера", () => {
  const result = spawnSync(process.execPath, ["scripts/render-lisa-presentation-sent-review-draft.mjs", "--check"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("порядок приемки, запреты и граница выпуска закрепляют неактивный будущий контур", () => {
  if (!fs.existsSync(absolute(contractPath))) return;
  const contract = readJson(contractPath);

  assert.deepEqual(contract.acceptance.frame_flow, expectedFrameAcceptanceFlow);
  assert.deepEqual(contract.acceptance.prototype_flow, expectedPrototypeAcceptanceFlow);
  assert.deepEqual(contract.acceptance.per_frame_review, expectedPerFrameReview);
  assert.deepEqual(contract.forbidden_methods, expectedForbiddenMethods);
  assert.equal(contract.release_boundary.candidate_evidence_status, "pending");
  assert.equal(contract.release_boundary.active_release_switch_status, "blocked");
  assert.equal(contract.release_boundary.rollback_mode, "full_bundle_only");
  assert.deepEqual(contract.release_boundary.future_transaction_targets, [
    "active-contracts.json",
    "journey-contract.json",
    "frame-or-visual-contract",
    "source-render-catalog.json",
    "demo/**",
    "derived/**",
    "evidence/**",
    "portable-zip",
    "delivery-archive",
  ]);
});

test("JSON Schema сама отклоняет дрейф будущих кадров и порядка галереи", () => {
  if (!fs.existsSync(absolute(contractPath))) return;
  const validate = schemaValidator();
  const contract = readJson(contractPath);

  const missingFutureFrame = clone(contract);
  missingFutureFrame.future_frame_ids.pop();
  assert.equal(validate(missingFutureFrame), false, "Schema должна отклонять пропущенный будущий кадр");

  const extraFutureFrame = clone(contract);
  extraFutureFrame.future_frame_ids.push("lisa-unexpected-frame");
  assert.equal(validate(extraFutureFrame), false, "Schema должна отклонять лишний будущий кадр");

  const swappedGalleryOrder = clone(contract);
  [
    swappedGalleryOrder.stakeholder_gallery_order.ordered_state_ids[0],
    swappedGalleryOrder.stakeholder_gallery_order.ordered_state_ids[1],
  ] = [
    swappedGalleryOrder.stakeholder_gallery_order.ordered_state_ids[1],
    swappedGalleryOrder.stakeholder_gallery_order.ordered_state_ids[0],
  ];
  assert.equal(validate(swappedGalleryOrder), false, "Schema должна отклонять перестановку галереи");
});

test("валидатор принимает канонический договор и отклоняет обязательные отрицательные случаи", () => {
  if (!fs.existsSync(absolute(contractPath))) return;
  const success = runValidator();
  assert.equal(success.status, 0, success.stderr || success.stdout);

  const baseContract = readJson(contractPath);
  const baseActiveContracts = readJson(activeContractsPath);
  const fixture = readJson(negativeFixturePath);
  assert.equal(fixture.cases.length, 15);

  for (const negativeCase of fixture.cases) {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "canonical-svg-frame-pipeline-"));
    const mutatedContract = clone(baseContract);
    const mutatedActiveContracts = clone(baseActiveContracts);
    mutate(mutatedContract, mutatedActiveContracts, negativeCase.mutation);
    copyRequiredInputs(tempRoot, mutatedContract, mutatedActiveContracts);

    const result = runValidator({
      contractPath: path.join(tempRoot, contractPath),
      activeContractsPath: path.join(tempRoot, activeContractsPath),
    });
    assert.notEqual(result.status, 0, `${negativeCase.name}: отрицательный случай должен падать`);
    assert.match(result.stderr, new RegExp(negativeCase.expected_error.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"));
  }
});
