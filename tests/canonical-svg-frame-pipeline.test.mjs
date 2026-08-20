import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
const activeContractsPath = `${sourcePath}/active-contracts.json`;
const negativeFixturePath = "tests/fixtures/canonical-svg-frame-pipeline-negative.json";
const fullReferenceReviewSourcePath = `${packagePath}/candidate-evidence/frame-review/lisa-materials-full-reference/source.svg`;
const fullReferenceReviewManifestPath = `${packagePath}/candidate-evidence/frame-review/lisa-materials-full-reference/review-source-manifest.json`;
const fullReferenceOwnerApprovalPath = `${packagePath}/candidate-evidence/frame-review/lisa-materials-full-reference/owner-approval.json`;
const fullReferenceOwnerApprovalSchemaPath = `${sourcePath}/schemas/lisa-frame-owner-approval.schema.json`;

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
    source_id: "email_frame_canonical_svg_source",
    required_for_frame_id: "lisa-presentation-email",
    required_format: "canonical_svg_source",
    canonical_svg_required_before_render: true,
    status: "pending_owner_attachment",
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

function copyRequiredInputs(tempRoot, contract, activeContracts) {
  writeJson(tempRoot, contractPath, contract);
  writeJson(tempRoot, schemaPath, readJson(schemaPath));
  writeJson(tempRoot, candidatePath, readJson(candidatePath));
  writeJson(tempRoot, approvedTextsPath, readJson(approvedTextsPath));
  writeJson(tempRoot, presentationPdfDonorRegisterPath, readJson(presentationPdfDonorRegisterPath));
  writeJson(tempRoot, presentationPdfDonorRegisterSchemaPath, readJson(presentationPdfDonorRegisterSchemaPath));
  writeJson(tempRoot, fullReferenceReviewManifestPath, readJson(fullReferenceReviewManifestPath));
  writeJson(tempRoot, fullReferenceOwnerApprovalPath, readJson(fullReferenceOwnerApprovalPath));
  writeJson(tempRoot, activeContractsPath, activeContracts);
}

function schemaValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  return ajv.compile(readJson(schemaPath));
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
});

test("общий контроль качества включает схему и семантическую проверку будущего SVG-договора", () => {
  const packageManifest = readJson("package.json");
  const schemaValidator = fs.readFileSync(absolute("scripts/validate-json-schema.mjs"), "utf8");

  assert.match(packageManifest.scripts.test, /validate:canonical-svg-frame-pipeline/u);
  assert.match(schemaValidator, /canonical-svg-frame-pipeline-contract\.schema\.json/u);
  assert.match(schemaValidator, /presentation-pdf-donor-register\.schema\.json/u);
  assert.match(schemaValidator, /lisa-full-reference-review-source-manifest\.schema\.json/u);
  assert.match(schemaValidator, /lisa-frame-owner-approval\.schema\.json/u);
});

test("неактивный договор наследует кадры и смысловые ребра из подготовительного кандидата v1", () => {
  if (!fs.existsSync(absolute(contractPath))) return;
  const contract = readJson(contractPath);
  const candidate = readJson(candidatePath);

  assert.equal(contract.version, "3.4.0");
  assert.equal(contract.status, "inactive_pending_canonical_svg_sources_and_frame_approval");
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

test("выбранные тексты и покадровые источники фиксируют приёмку первого кадра и блокировку остальных", () => {
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
    assert.equal(frame.svg_editing_mode, "canonical_svg_existing_groups_only");
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
    status: "owner_frame_approved_next_frame_ready",
    current_frame_id: "lisa-materials-full-reference",
    next_frame_id: "lisa-presentation-generating",
    source_svg_path: "candidate-evidence/frame-review/lisa-materials-full-reference/source.svg",
    draft_png_path: "candidate-evidence/frame-review/lisa-materials-full-reference/draft-current-resolution.png",
    review_manifest_path: "candidate-evidence/frame-review/lisa-materials-full-reference/review-source-manifest.json",
    base_svg_path: "editable-sources/5.4.svg",
    edit_mode: "replace_existing_frame_group_content",
    prohibited_legacy_overlay_ids: ["lisa-edit-5-4-title"],
    active_release_mutation_prohibited: true,
    owner_approval_record_path: "candidate-evidence/frame-review/lisa-materials-full-reference/owner-approval.json",
    next_frame_blocked_until_owner_approval: false,
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
  assert.equal(fixture.cases.length, 14);

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
