import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";

const defaultPackagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const defaultSourcePath = `${defaultPackagePath}/source`;
const defaultContractPath = `${defaultSourcePath}/canonical-svg-frame-pipeline-contract.json`;
const defaultActiveContractsPath = `${defaultSourcePath}/active-contracts.json`;

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
const expectedFutureTransactionTargets = Object.freeze([
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
const expectedCurrentFrame = Object.freeze({
  frame_id: "lisa-materials-full-reference",
  svg_editing_mode: "canonical_svg_existing_groups_only",
  canonical_svg_status: "prepared_existing_group_content_replaced",
  approved_text_status: "owner_approved",
  svg_visual_check_status: "passed",
  draft_png_status: "rendered_current_resolution",
  owner_frame_approval_status: "approved",
});
const expectedGeneratingFrame = Object.freeze({
  frame_id: "lisa-presentation-generating",
  svg_editing_mode: "canonical_svg_existing_groups_only",
  canonical_svg_status: "prepared_existing_group_content_replaced",
  approved_text_status: "owner_approved",
  svg_visual_check_status: "passed",
  draft_png_status: "rendered_current_resolution",
  owner_frame_approval_status: "approved",
});
const expectedChatListFrame = Object.freeze({
  frame_id: "lisa-presentation-chat-list",
  svg_editing_mode: "canonical_svg_existing_groups_only",
  canonical_svg_status: "preserved_without_rework",
  approved_text_status: "not_applicable",
  svg_visual_check_status: "not_required",
  draft_png_status: "existing_frame_preserved",
  owner_frame_approval_status: "not_required",
});
const expectedSentFrame = Object.freeze({
  frame_id: "lisa-presentation-sent",
  svg_editing_mode: "canonical_svg_existing_groups_only",
  canonical_svg_status: "prepared_existing_group_content_replaced",
  approved_text_status: "owner_approved",
  svg_visual_check_status: "passed",
  draft_png_status: "rendered_current_resolution",
  owner_frame_approval_status: "approved",
});
const expectedEmailFrame = Object.freeze({
  frame_id: "lisa-presentation-email",
  svg_editing_mode: "canonical_svg_existing_groups_only",
  canonical_svg_status: "prepared_visual_reference_composition",
  approved_text_status: "owner_approved",
  svg_visual_check_status: "passed",
  draft_png_status: "rendered_current_resolution",
  owner_frame_approval_status: "approved",
});
const expectedSlideDocFrame = Object.freeze({
  frame_id: "lisa-presentation-slidedoc",
  svg_editing_mode: "new_canonical_svg_composition_from_pdf_visual_reference",
  canonical_svg_status: "prepared_new_canonical_svg_composition",
  approved_text_status: "approved_for_demo_model",
  svg_visual_check_status: "passed",
  draft_png_status: "rendered_current_resolution",
  owner_frame_approval_status: "pending",
});
const expectedErrorFrames = Object.freeze(new Map([
  ["lisa-order-not-accepted", Object.freeze({
    frame_id: "lisa-order-not-accepted",
    svg_editing_mode: "canonical_svg_existing_groups_only",
    canonical_svg_status: "prepared_existing_group_content_replaced",
    approved_text_status: "authoritative_interview_agreed",
    svg_visual_check_status: "passed",
    draft_png_status: "rendered_current_resolution",
    owner_frame_approval_status: "approved",
  })],
  ["lisa-delivery-delayed", Object.freeze({
    frame_id: "lisa-delivery-delayed",
    svg_editing_mode: "canonical_svg_existing_groups_only",
    canonical_svg_status: "prepared_existing_group_content_replaced",
    approved_text_status: "authoritative_interview_agreed",
    svg_visual_check_status: "passed",
    draft_png_status: "rendered_current_resolution",
    owner_frame_approval_status: "approved",
  })],
  ["lisa-delivery-partial", Object.freeze({
    frame_id: "lisa-delivery-partial",
    svg_editing_mode: "canonical_svg_existing_groups_only",
    canonical_svg_status: "prepared_existing_group_content_replaced",
    approved_text_status: "authoritative_interview_agreed",
    svg_visual_check_status: "passed",
    draft_png_status: "rendered_current_resolution",
    owner_frame_approval_status: "approved",
  })],
]));
const expectedFrameReviewSession = Object.freeze({
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
const expectedPresentationPdfDonors = Object.freeze([
  Object.freeze({
    donor_id: "presentation_variant_slidedoc_pdf_donor",
    frame_id: "lisa-presentation-slidedoc",
    source_file_name: "vodoley_dense_slidedoc.pdf",
    sha256: "52f0194ff2f4fd10066925bf4d488e12e8f194cdae465e5075a4ec3a7dd92425",
    page_count: 3,
    use: "visual_reference_only",
    status: "owner_attachment_received_pending_canonical_svg_intake",
  }),
  Object.freeze({
    donor_id: "presentation_variant_sber2025_pdf_donor",
    frame_id: "lisa-presentation-sber2025",
    source_file_name: "vodoley_dense_sber2025.pdf",
    sha256: "9dc9ab650fdf24ff87edc1973515fa4baac6fddf8c8a715433207b2ca0c80fcc",
    page_count: 3,
    use: "visual_reference_only",
    status: "owner_attachment_received_pending_canonical_svg_intake",
  }),
  Object.freeze({
    donor_id: "presentation_variant_mag_pdf_donor",
    frame_id: "lisa-presentation-mag",
    source_file_name: "vodoley_dense_mag.pdf",
    sha256: "12b4717101eeb553164ea22e3d41a7594590872adc19217ea35f345089434f2d",
    page_count: 3,
    use: "visual_reference_only",
    status: "owner_attachment_received_pending_canonical_svg_intake",
  }),
]);
const forbiddenTracePattern = /(?:\/Users\/|file:\/\/|[A-Za-z]:\\|\.docx\b|\b[a-f0-9]{64}\b|raw_source_content)/iu;

function parseArguments(args) {
  const options = {
    contractPath: path.resolve(defaultContractPath),
    activeContractsPath: path.resolve(defaultActiveContractsPath),
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--contract" && args[index + 1]) {
      options.contractPath = path.resolve(args[index + 1]);
      index += 1;
    } else if (arg === "--active-contracts" && args[index + 1]) {
      options.activeContractsPath = path.resolve(args[index + 1]);
      index += 1;
    } else {
      throw new Error("использование: node scripts/validate-canonical-svg-frame-pipeline.mjs [--contract <path>] [--active-contracts <path>]");
    }
  }
  return options;
}

function readJson(absolutePath) {
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function sha256File(absolutePath) {
  return createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex");
}

function sameArray(actual, expected) {
  return Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index]);
}

function assertSameArray(actual, expected, message) {
  if (!sameArray(actual, expected)) {
    throw new Error(message);
  }
}

function assertNoRawSourceTraces(contract) {
  if (forbiddenTracePattern.test(JSON.stringify(contract))) {
    throw new Error("local paths, DOCX names, SHA-256 values, and raw source content are forbidden");
  }
}

function schemaPathFor(contractPath) {
  return path.join(path.dirname(contractPath), "schemas/canonical-svg-frame-pipeline-contract.schema.json");
}

function siblingPath(contractPath, filename) {
  return path.join(path.dirname(contractPath), filename);
}

function validateAgainstSchema(contractPath, contract) {
  const schema = readJson(schemaPathFor(contractPath));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  if (!validate(contract)) {
    const details = (validate.errors || [])
      .map((error) => `${error.instancePath || "/"}: ${error.message}`)
      .join("; ");
    throw new Error(`canonical SVG frame pipeline contract schema validation failed: ${details}`);
  }
}

function scenarioEdges(candidate) {
  const graph = candidate.semantic_graphs.find((item) => item.graph_type === "semantic_transition");
  assert.ok(graph, "prototype revision candidate semantic graph is missing");
  return graph.edges;
}

function galleryOrder(candidate) {
  const graph = candidate.semantic_graphs.find((item) => item.graph_id === "stakeholder_gallery_order");
  assert.ok(graph, "prototype revision candidate stakeholder gallery order is missing");
  return {
    graph_id: "stakeholder_gallery_order",
    is_user_scenario_transition: false,
    ordered_state_ids: graph.ordered_state_ids,
  };
}

function validateTopLevel(contract) {
  if (contract.active !== false) throw new Error("active must remain false");
  if (contract.render_allowed !== false) throw new Error("render_allowed must remain false");
  if (contract.generator_input !== false || contract.archive_allowed !== false) {
    throw new Error("inactive contract must not be a generator input or archive input");
  }
  if (contract.prototype_revision_candidate.expected_version !== "1.0.0") {
    throw new Error("prototype revision candidate expected_version must remain 1.0.0");
  }
  if (contract.version !== "4.1.0" || contract.status !== "inactive_pending_presentation_variant_frame_approval") {
    throw new Error("версия договора должна фиксировать готовый SVG-кандидат SlideDoc и ожидание покадровой приёмки");
  }
}

function validateFrames(contract, candidate) {
  assertSameArray(
    contract.future_frame_ids,
    candidate.active_future_frame_ids,
    "future frame ids must match prototype revision candidate active_future_frame_ids",
  );
  assertSameArray(
    contract.historical_reference_frame_ids,
    candidate.historical_inactive_frame_ids,
    "historical reference frame ids must match prototype revision candidate historical_inactive_frame_ids",
  );
  assertSameArray(
    contract.frame_svg_sources.map((frame) => frame.frame_id),
    candidate.active_future_frame_ids,
    "future frame ids must match prototype revision candidate active_future_frame_ids",
  );
  for (const frame of contract.frame_svg_sources) {
    if (frame.frame_id === expectedCurrentFrame.frame_id) {
      if (JSON.stringify(frame) !== JSON.stringify(expectedCurrentFrame)) {
        throw new Error("full reference frame must stop after draft PNG and wait for owner approval");
      }
      continue;
    }
    if (frame.frame_id === expectedGeneratingFrame.frame_id) {
      if (JSON.stringify(frame) !== JSON.stringify(expectedGeneratingFrame)) {
        throw new Error("кадр начала формирования должен быть зафиксирован как принятый владельцем");
      }
      continue;
    }
    if (frame.frame_id === expectedChatListFrame.frame_id) {
      if (JSON.stringify(frame) !== JSON.stringify(expectedChatListFrame)) {
        throw new Error("список чатов должен быть явно сохранён без переработки по указанию владельца");
      }
      continue;
    }
    if (frame.frame_id === expectedSentFrame.frame_id) {
      if (JSON.stringify(frame) !== JSON.stringify(expectedSentFrame)) {
        throw new Error("кадр успеха должен быть подготовлен из принятого кадра начала и ожидать отдельной приёмки");
      }
      continue;
    }
    if (frame.frame_id === expectedEmailFrame.frame_id) {
      if (JSON.stringify(frame) !== JSON.stringify(expectedEmailFrame)) {
        throw new Error("кадр письма должен быть сохранён как принятый SVG-кандидат по предоставленному визуальному образцу");
      }
      continue;
    }
    if (frame.frame_id === expectedSlideDocFrame.frame_id) {
      if (JSON.stringify(frame) !== JSON.stringify(expectedSlideDocFrame)) {
        throw new Error("кадр SlideDoc должен оставаться изолированным SVG-кандидатом до явной покадровой приёмки владельцем");
      }
      continue;
    }
    const expectedErrorFrame = expectedErrorFrames.get(frame.frame_id);
    if (expectedErrorFrame) {
      if (JSON.stringify(frame) !== JSON.stringify(expectedErrorFrame)) {
    throw new Error("кадры ошибок должны быть приняты только после покадровой проверки SVG и PNG");
      }
      continue;
    }
    if (
      frame.svg_editing_mode !== "canonical_svg_existing_groups_only" ||
      frame.canonical_svg_status !== "pending_source" ||
      frame.approved_text_status !== "pending" ||
      frame.svg_visual_check_status !== "pending" ||
      frame.draft_png_status !== "blocked" ||
      frame.owner_frame_approval_status !== "pending"
    ) {
    throw new Error("неподготовленные кадры вариантов презентаций должны оставаться заблокированными до покадровой приёмки");
    }
    if ("path" in frame || "svg_path" in frame || "sha256" in frame || "svg_sha256" in frame) {
      throw new Error("local paths, DOCX names, SHA-256 values, and raw source content are forbidden");
    }
  }
}

function validateFrameReviewSession(contract) {
  if (JSON.stringify(contract.frame_review_session) !== JSON.stringify(expectedFrameReviewSession)) {
    throw new Error("договор покадровой приёмки должен указывать на подготовленный SVG-кандидат SlideDoc и блокировать следующий вариант презентации");
  }
}

function validateEmailReviewEvidence(contractPath) {
  const packageDirectory = path.join(path.dirname(contractPath), "..");
  const reviewDirectory = path.join(packageDirectory, "candidate-evidence/frame-review/lisa-presentation-email");
  const manifest = readJson(path.join(reviewDirectory, "review-source-manifest.json"));
  const approval = readJson(path.join(reviewDirectory, "owner-approval.json"));
  const sourcePath = path.join(reviewDirectory, "source.svg");
  const draftPath = path.join(reviewDirectory, "draft-current-resolution.png");
  const source = fs.readFileSync(sourcePath, "utf8");
  const expectedSummary = {
    record_path: "candidate-evidence/frame-review/lisa-presentation-email/owner-approval.json",
    decision: "approved",
    decision_text: "ok",
    decision_source: "Product Owner в рабочем чате",
    approval_time_precision: "date_only",
    approved_on: "2026-08-24",
  };
  if (
    manifest.frame_id !== "lisa-presentation-email" ||
    manifest.status !== "owner_frame_approved" ||
    manifest.visual_reference_id !== "owner_supplied_outlook_corporate_email_screenshot_2026_08_19" ||
    manifest.visual_reference_persisted_in_repository !== false ||
    manifest.source_svg_sha256 !== sha256File(sourcePath) ||
    manifest.draft_png_sha256 !== sha256File(draftPath) ||
    manifest.draft_png_dimensions?.width !== 1280 ||
    manifest.draft_png_dimensions?.height !== 960 ||
    JSON.stringify(manifest.owner_frame_approval) !== JSON.stringify(expectedSummary) ||
    approval.frame_id !== "lisa-presentation-email" ||
    approval.decision !== "approved" ||
    approval.decision_text !== "ok" ||
    approval.approved_source_svg_sha256 !== manifest.source_svg_sha256 ||
    approval.approved_draft_png_sha256 !== manifest.draft_png_sha256 ||
    /<image\b/u.test(source) ||
    !source.includes("Презентация по справке ООО «Водолей Трейд»") ||
    !source.includes("Презентация по справке.pptx") ||
    !source.includes("Презентация по справке.pdf")
  ) {
    throw new Error("принятый кадр письма должен связывать SVG, PNG, образец владельца, согласованные тексты и запись приёмки");
  }
}

function validateGeneratingReviewEvidence(contractPath) {
  const packageDirectory = path.join(path.dirname(contractPath), "..");
  const reviewDirectory = path.join(packageDirectory, "candidate-evidence/frame-review/lisa-presentation-generating");
  const manifest = readJson(path.join(reviewDirectory, "review-source-manifest.json"));
  const sourcePath = path.join(reviewDirectory, "source.svg");
  const source = fs.readFileSync(sourcePath, "utf8");
  const baseSourcePath = path.join(packageDirectory, "candidate-evidence/frame-review/lisa-materials-full-reference/source.svg");
  const baseManifest = readJson(path.join(packageDirectory, "candidate-evidence/frame-review/lisa-materials-full-reference/review-source-manifest.json"));
  const baseApproval = readJson(path.join(packageDirectory, "candidate-evidence/frame-review/lisa-materials-full-reference/owner-approval.json"));
  const expectedMessage = "Формирование презентации началось в ЧЧ:ММ и займет не более 20 минут. После завершения презентация будет направлена по электронной почте в SIGMA и OMEGA.";
  if (
    manifest.frame_id !== "lisa-presentation-generating" ||
    manifest.status !== "owner_frame_approved" ||
    manifest.base_frame_id !== "lisa-materials-full-reference" ||
    manifest.base_svg_path !== "candidate-evidence/frame-review/lisa-materials-full-reference/source.svg" ||
    manifest.base_svg_sha256 !== sha256File(baseSourcePath) ||
    manifest.base_owner_approval_path !== "candidate-evidence/frame-review/lisa-materials-full-reference/owner-approval.json" ||
    manifest.base_owner_approved_svg_sha256 !== baseApproval.approved_source_svg_sha256 ||
    manifest.transition_rendering_mode !== "same_screen_dynamic_state" ||
    baseManifest.status !== "owner_frame_approved" ||
    manifest.source_svg_sha256 !== sha256File(sourcePath) ||
    manifest.draft_png_rendered !== true ||
    manifest.draft_png_path !== "candidate-evidence/frame-review/lisa-presentation-generating/draft-current-resolution.png" ||
    manifest.draft_png_dimensions?.width !== 521 ||
    manifest.draft_png_dimensions?.height !== 3226 ||
    manifest.dynamic_footer?.button_translate_y !== -18 ||
    manifest.dynamic_footer?.background_fill !== "rgb(224,227,234)" ||
    manifest.dynamic_footer?.label_fill !== "rgb(143,148,160)" ||
    manifest.dynamic_footer?.status_placement !== "below_disabled_button" ||
    manifest.dynamic_footer?.extension_height !== 82 ||
    manifest.disabled_button?.opacity !== 1 ||
    JSON.stringify(manifest.generation_started_message?.safe_area) !== JSON.stringify({ x: 80, y: 2958, width: 345, height: 64 }) ||
    manifest.generation_started_message?.font_size !== 11.5 ||
    manifest.generation_started_message?.fill !== "rgb(73,80,94)" ||
    manifest.generation_started_message?.inserted_into_existing_frame_group_id !== "button_footer_2.0" ||
    !Array.isArray(manifest.generation_started_message?.line_widths) ||
    manifest.generation_started_message.line_widths.length !== manifest.generation_started_message.display_lines?.length ||
    manifest.generation_started_message.line_widths.some((width) => !Number.isFinite(width) || width < 0 || width > 345)
  ) {
    throw new Error("манифест принятого кадра начала должен привязывать SVG и PNG к принятой полной справке");
  }
  if (
    /<text\b/u.test(source) ||
    source.includes("lisa-edit-") ||
    source.includes("lisa-status-") ||
    !source.includes('data-review-frame-id="lisa-presentation-generating" data-review-transition="same_screen_dynamic_state"') ||
    !source.includes('id="lisa-review-generation-status"') ||
    !source.includes('aria-disabled="true"') ||
    !source.includes('data-review-button-state="disabled"') ||
    !source.includes('transform="translate(0 -18)"') ||
    !source.includes('fill="rgb(224,227,234)"') ||
    !source.includes('fill="rgb(143,148,160)"') ||
    !source.includes(`aria-label="${expectedMessage}"`) ||
    source.indexOf('id="lisa-review-generation-status"') < source.indexOf('id="Home indicator"') ||
    source.includes("7.2 — Длинное название клиента + холдинг.svg")
  ) {
    throw new Error("второй черновой SVG должен быть динамическим продолжением полной справки без накладок");
  }
  for (const groupId of ["general_information", "business_owners", "financial_indicators", "cooperation", "sber_share", "active_deals", "potential", "preapproved_offers", "insights", "meeting_agreements"]) {
    if (!source.includes(`data-review-rendered-group-id="${groupId}"`)) {
      throw new Error("второй черновой SVG должен сохранять все видимые группы принятой полной справки");
    }
  }
}

function validateGeneratingOwnerApprovalEvidence(contractPath) {
  const packageDirectory = path.join(path.dirname(contractPath), "..");
  const reviewDirectory = path.join(packageDirectory, "candidate-evidence/frame-review/lisa-presentation-generating");
  const approval = readJson(path.join(reviewDirectory, "owner-approval.json"));
  const manifest = readJson(path.join(reviewDirectory, "review-source-manifest.json"));
  const expectedSummary = {
    record_path: "candidate-evidence/frame-review/lisa-presentation-generating/owner-approval.json",
    decision: "approved",
    decision_text: "кадр принят",
    decision_source: "Product Owner в рабочем чате",
    approved_at: approval.approved_at,
  };
  if (
    approval.change_order_id !== "CO-2026-003" ||
    approval.frame_id !== "lisa-presentation-generating" ||
    approval.decision !== "approved" ||
    manifest.status !== "owner_frame_approved" ||
    JSON.stringify(manifest.owner_frame_approval) !== JSON.stringify(expectedSummary) ||
    approval.approved_source_svg_sha256 !== manifest.source_svg_sha256 ||
    approval.approved_draft_png_sha256 !== manifest.draft_png_sha256
  ) {
    throw new Error("приёмка кадра начала должна связывать его SVG и PNG с записью владельца");
  }
}

function validateSentReviewEvidence(contractPath) {
  const packageDirectory = path.join(path.dirname(contractPath), "..");
  const reviewDirectory = path.join(packageDirectory, "candidate-evidence/frame-review/lisa-presentation-sent");
  const manifest = readJson(path.join(reviewDirectory, "review-source-manifest.json"));
  const approval = readJson(path.join(reviewDirectory, "owner-approval.json"));
  const sourcePath = path.join(reviewDirectory, "source.svg");
  const source = fs.readFileSync(sourcePath, "utf8");
  const baseSourcePath = path.join(packageDirectory, "candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24/source.svg");
  const phoneStatusTimeDonorPath = path.join(packageDirectory, "editable-sources/7.3 — Презентация.svg");
  const phoneStatusTimeDonor = fs.readFileSync(phoneStatusTimeDonorPath, "utf8");
  const expectedMessage = "Презентация готова и направлена по электронной почте в ЧЧ:ММ.";
  const readPhoneStatusTimePath = (value, label) => {
    const matches = [...value.matchAll(/<path id="Time" d="[^"]+" fill="rgb\(0,0,0\)" fill-rule="nonzero" \/>/gu)];
    if (matches.length !== 1) throw new Error(`SVG ${label} должен содержать один штатный контур системного времени`);
    return matches[0][0];
  };
  if (
    manifest.frame_id !== "lisa-presentation-sent" ||
    manifest.status !== "owner_frame_approved" ||
    JSON.stringify(manifest.owner_frame_approval) !== JSON.stringify({
      record_path: "candidate-evidence/frame-review/lisa-presentation-sent/owner-approval.json",
      decision: "approved",
      decision_text: "кадр принят",
      decision_source: "Product Owner в рабочем чате",
      approval_time_precision: "date_only",
      approved_on: "2026-08-24",
    }) ||
    manifest.base_frame_id !== "lisa-presentation-generating" ||
    manifest.base_svg_sha256 !== sha256File(baseSourcePath) ||
    manifest.base_svg_path !== "candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24/source.svg" ||
    manifest.base_owner_approval_path !== "candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24/owner-approval.json" ||
    manifest.skipped_intermediate_frame_id !== "lisa-presentation-chat-list" ||
    manifest.skipped_intermediate_frame_reason !== "owner_direction_no_rework" ||
    manifest.source_svg_sha256 !== sha256File(sourcePath) ||
    manifest.draft_png_rendered !== true ||
    manifest.draft_png_dimensions?.width !== 521 ||
    manifest.draft_png_dimensions?.height !== 3290 ||
    manifest.dynamic_footer?.generation_message_placement !== "below_disabled_button" ||
    manifest.dynamic_footer?.delivery_success_message_placement !== "below_generation_message" ||
    manifest.mock_phone_status_time_value !== "13:40" ||
    manifest.delivery_success_message?.text !== expectedMessage ||
    JSON.stringify(manifest.delivery_success_message?.display_lines) !== JSON.stringify(["Презентация готова и направлена", "по электронной почте в 13:38."])
  ) {
    throw new Error("манифест кадра успеха должен продолжать принятый кадр начала и хранить состоявшуюся приёмку владельца");
  }
  if (
    approval.change_order_id !== "CO-2026-003" ||
    approval.frame_id !== "lisa-presentation-sent" ||
    approval.decision !== "approved" ||
    approval.approval_time_precision !== "date_only" ||
    approval.approved_on !== "2026-08-24" ||
    !approval.decision_evidence_note ||
    approval.approved_source_svg_sha256 !== manifest.source_svg_sha256 ||
    approval.approved_draft_png_sha256 !== manifest.draft_png_sha256
  ) {
    throw new Error("приёмка кадра успеха должна связывать его SVG и PNG с историческим решением владельца без выдуманного времени");
  }
  if (readPhoneStatusTimePath(source, "кадра успеха") !== readPhoneStatusTimePath(phoneStatusTimeDonor, "канонического донора 13:40")) {
    throw new Error("системное время кадра успеха должно быть заменено штатным контуром 13:40");
  }
  if (
    /<text\b/u.test(source) ||
    source.includes("lisa-edit-") ||
    source.includes("lisa-status-") ||
    !source.includes('id="lisa-review-generation-status"') ||
    !source.includes('id="lisa-review-delivery-success-status"') ||
    !source.includes(`aria-label="${expectedMessage}"`) ||
    source.indexOf('id="lisa-review-delivery-success-status"') < source.indexOf('id="lisa-review-generation-status"') ||
    !source.includes('aria-disabled="true"') ||
    !source.includes('fill="rgb(224,227,234)"')
  ) {
    throw new Error("SVG кадра успеха должен быть продолжением того же экрана без текстовых и визуальных накладок");
  }
}

function validateErrorReviewEvidence(contractPath) {
  const packageDirectory = path.join(path.dirname(contractPath), "..");
  const reviewContract = readJson(path.join(path.dirname(contractPath), "error-frame-review-contract.json"));
  const expectedTexts = new Map([
    ["lisa-order-not-accepted", "Не удалось принять данные для формирования презентации. Вернитесь к диалогу «Справка по клиенту» и уточните данные, либо оформите тикет в сопровождение."],
    ["lisa-delivery-delayed", "Презентация формируется дольше 20 минут. Задача передана в сопровождение; сообщу здесь, если отправка на почту будет подтверждена."],
    ["lisa-delivery-partial", "Презентация сформирована и направлена в OMEGA. Отправка в SIGMA пока не подтверждена. Задача передана в сопровождение; сообщу здесь, если отправка будет подтверждена."],
  ]);
  const expectedDirectories = new Map([
    ["lisa-order-not-accepted", "lisa-order-not-accepted-clock-13-40"],
    ["lisa-delivery-delayed", "lisa-delivery-delayed-clock-13-40"],
    ["lisa-delivery-partial", "lisa-delivery-partial-clock-13-40"],
  ]);

  if (
    reviewContract.status !== "owner_frame_approved" ||
    reviewContract.base_frame_id !== "lisa-presentation-generating" ||
    reviewContract.visual_template_frame_id !== "lisa-presentation-sent" ||
    reviewContract.mock_phone_status_time_value !== "13:40" ||
    reviewContract.transition_rendering_mode !== "same_screen_dynamic_state" ||
    reviewContract.active_release_mutation_prohibited !== true ||
    reviewContract.full_delivery_is_represented_by !== "lisa-delivery-partial" ||
    !sameArray(reviewContract.candidates.map((item) => item.frame_id), [...expectedTexts.keys()])
  ) {
    throw new Error("договор черновых кадров ошибок должен фиксировать три согласованных состояния в 13:40 без изменения действующего выпуска");
  }

  for (const candidate of reviewContract.candidates) {
    const expectedText = expectedTexts.get(candidate.frame_id);
    const directoryName = expectedDirectories.get(candidate.frame_id);
    if (!expectedText || !directoryName || candidate.text !== expectedText) {
      throw new Error("черновой кадр ошибки должен использовать только точный согласованный текст");
    }
    const reviewDirectory = path.join(packageDirectory, "candidate-evidence/frame-review", directoryName);
    const manifestPath = path.join(reviewDirectory, "review-source-manifest.json");
    const sourcePath = path.join(reviewDirectory, "source.svg");
    const draftPath = path.join(reviewDirectory, "draft-current-resolution.png");
    const manifest = readJson(manifestPath);
    const source = fs.readFileSync(sourcePath, "utf8");
    const keepsGenerationMessage = candidate.keeps_generation_message;
    const requiredFullReferenceGroups = ["general_information", "business_owners", "financial_indicators", "cooperation", "sber_share", "active_deals", "potential", "preapproved_offers", "insights", "meeting_agreements"];

    if (
      manifest.frame_id !== candidate.frame_id ||
      manifest.status !== "owner_frame_approved" ||
      manifest.semantic_base_frame_id !== "lisa-presentation-generating" ||
      manifest.visual_template_svg_path !== "candidate-evidence/frame-review/lisa-presentation-sent/source.svg" ||
      manifest.transition_rendering_mode !== "same_screen_dynamic_state" ||
      manifest.mock_phone_status_time_value !== "13:40" ||
      manifest.keeps_generation_message !== keepsGenerationMessage ||
      manifest.error_message?.text !== expectedText ||
      manifest.source_svg_sha256 !== sha256File(sourcePath) ||
      manifest.draft_png_sha256 !== sha256File(draftPath) ||
      manifest.draft_png_dimensions?.width !== 521 ||
      manifest.draft_png_dimensions?.height !== 3290 ||
      manifest.owner_frame_approval?.record_path !== `candidate-evidence/frame-review/${directoryName}/owner-approval.json` ||
      manifest.owner_frame_approval?.decision !== "approved" ||
      manifest.owner_frame_approval?.decision_text !== "Экраны приняты!" ||
      manifest.owner_frame_approval?.decision_source !== "Product Owner в рабочем чате" ||
      manifest.owner_frame_approval?.approval_time_precision !== "date_only" ||
      manifest.owner_frame_approval?.approved_on !== "2026-08-24"
    ) {
      throw new Error("манифест принятого кадра ошибки должен связывать точный текст, SVG, PNG и решение владельца");
    }
    const approval = readJson(path.join(reviewDirectory, "owner-approval.json"));
    if (
      approval.frame_id !== candidate.frame_id ||
      approval.decision !== "approved" ||
      approval.decision_text !== "Экраны приняты!" ||
      approval.approved_source_svg_sha256 !== manifest.source_svg_sha256 ||
      approval.approved_draft_png_sha256 !== manifest.draft_png_sha256
    ) throw new Error("запись приёмки кадра ошибки должна фиксировать фактически принятые SVG и PNG");
    if (
      /<text\b/u.test(source) ||
      source.includes("lisa-status-") ||
      source.includes("lisa-review-success-status") ||
      !source.includes(`aria-label="${expectedText}"`) ||
      !source.includes('aria-disabled="true"') ||
      !source.includes('fill="rgb(224,227,234)"')
    ) {
      throw new Error("SVG кадра ошибки не должен содержать текстовые либо карточные накладки поверх исходного экрана");
    }
    const hasGenerationMessage = source.includes('id="lisa-review-generation-status"');
    if (hasGenerationMessage !== keepsGenerationMessage) {
      throw new Error("кадр непринятия данных заменяет сообщение начала, а кадры доставки продолжают его на том же экране");
    }
    if (requiredFullReferenceGroups.some((groupId) => !source.includes(`data-review-rendered-group-id="${groupId}"`))) {
      throw new Error("каждый кадр ошибки должен сохранять все видимые группы принятой полной справки");
    }
    if (keepsGenerationMessage && (
      !source.includes('filter id="filter_120" width="393.000000" height="224.000000" x="64.000000" y="4952.000000"') ||
      !/clipPath id="clipPath_2083">\s*<rect width="393\.000000" height="224\.000000" x="64\.000000" y="4952\.000000"/u.test(source)
    )) {
      throw new Error("SVG кадров доставки должен расширять область фильтра и отсечения для полного текста без обрезания");
    }
  }
}

function validateGeneratingClockCorrectionApprovalEvidence(contractPath) {
  const packageDirectory = path.join(path.dirname(contractPath), "..");
  const reviewDirectory = path.join(packageDirectory, "candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24");
  const manifest = readJson(path.join(reviewDirectory, "review-source-manifest.json"));
  const approval = readJson(path.join(reviewDirectory, "owner-approval.json"));
  const sourcePath = path.join(reviewDirectory, "source.svg");
  const draftPath = path.join(reviewDirectory, "draft-current-resolution.png");
  const expectedSummary = {
    record_path: "candidate-evidence/frame-review/lisa-presentation-generating-clock-13-24/owner-approval.json",
    decision: "approved",
    decision_text: "кадр принят",
    decision_source: "Product Owner в рабочем чате",
    approved_at: approval.approved_at,
  };
  if (
    manifest.frame_id !== "lisa-presentation-generating" ||
    manifest.status !== "owner_frame_approved" ||
    manifest.mock_phone_status_time_value !== "13:24" ||
    manifest.source_svg_sha256 !== sha256File(sourcePath) ||
    manifest.draft_png_sha256 !== sha256File(draftPath) ||
    JSON.stringify(manifest.owner_frame_approval) !== JSON.stringify(expectedSummary) ||
    approval.change_order_id !== "CO-2026-003" ||
    approval.frame_id !== "lisa-presentation-generating" ||
    approval.decision !== "approved" ||
    approval.approved_source_svg_sha256 !== manifest.source_svg_sha256 ||
    approval.approved_draft_png_sha256 !== manifest.draft_png_sha256
  ) {
    throw new Error("принятая правка системного времени должна стать проверяемой основой продолжения");
  }
}

function validateOwnerApprovalEvidence(contractPath) {
  const reviewDirectory = path.join(
    path.dirname(contractPath),
    "..",
    "candidate-evidence/frame-review/lisa-materials-full-reference",
  );
  const approval = readJson(path.join(reviewDirectory, "owner-approval.json"));
  const manifest = readJson(path.join(reviewDirectory, "review-source-manifest.json"));
  const expectedApprovalSummary = {
    record_path: "candidate-evidence/frame-review/lisa-materials-full-reference/owner-approval.json",
    decision: "approved",
    decision_text: "кадр принят",
    decision_source: "Product Owner в рабочем чате",
    approved_at: "2026-08-20T17:02:02Z",
  };
  if (
    approval.change_order_id !== "CO-2026-003" ||
    approval.frame_id !== "lisa-materials-full-reference" ||
    JSON.stringify(manifest.owner_approval) !== JSON.stringify(expectedApprovalSummary) ||
    manifest.status !== "owner_frame_approved" ||
    approval.approved_source_svg_sha256 !== manifest.source_svg_sha256 ||
    approval.approved_draft_png_sha256 !== manifest.draft_png_sha256
  ) {
    throw new Error("owner approval must bind the accepted first-frame SVG and PNG to the recorded decision");
  }
}

function validateScenario(contract, candidate) {
  assert.deepEqual(contract.scenario_edges, scenarioEdges(candidate), "scenario edges must match prototype revision candidate");
  assert.deepEqual(contract.stakeholder_gallery_order, galleryOrder(candidate), "gallery order must remain separate from scenario transitions");

  const successEdge = contract.scenario_edges.find((edge) =>
    edge.type === "lifecycle" &&
    edge.from === "lisa-presentation-generating" &&
    edge.event === "delivery_confirmed" &&
    edge.to === "lisa-presentation-sent"
  );
  assert.ok(successEdge, "success must remain a direct outcome of lisa-presentation-generating");

  const forbiddenErrorSources = new Set([
    "lisa-presentation-sent",
    "lisa-presentation-email",
    "lisa-presentation-slidedoc",
    "lisa-presentation-sber2025",
    "lisa-presentation-mag",
  ]);
  const errorTargets = new Set(["lisa-order-not-accepted", "lisa-delivery-delayed", "lisa-delivery-partial"]);
  for (const edge of contract.scenario_edges) {
    if (errorTargets.has(edge.to) && forbiddenErrorSources.has(edge.from)) {
      throw new Error("error states must not have incoming edges from success, email, or presentation variant states");
    }
  }
}

function validateTexts(contract, approvedTexts) {
  assertSameArray(
    contract.message_topics.map((topic) => topic.topic_id),
    expectedTopics,
    "message topics must contain exactly five owner-approved topics",
  );
  for (const topic of contract.message_topics) {
    if (topic.status !== "owner_approved" || topic.render_blocker !== true) {
      throw new Error("message topics must remain owner-approved and render blockers until frame approval");
    }
    const forbiddenKeys = ["text", "selected_text", "candidate", "candidates", "hash", "sha256", "approved", "approval"];
    if (forbiddenKeys.some((key) => key in topic)) {
      throw new Error("message topics must not contain selected text, candidates, hashes, or approvals");
    }
  }
  if (
    contract.text_selection_source.path !== "source/owner-approved-texts.json" ||
    contract.text_selection_source.required_topic_count !== expectedTopics.length ||
    contract.text_selection_source.render_blocked_until_all_selected !== true ||
    approvedTexts.status !== "owner_approved" ||
    !sameArray(approvedTexts.selections.map((selection) => selection.topic_id), expectedTopics)
  ) {
    throw new Error("text selection source must be the owner-approved text register");
  }
}

function validateExternalSources(contract) {
  if (JSON.stringify(contract.external_sources) !== JSON.stringify(expectedExternalSources)) {
    throw new Error("external sources must match the three received PDF donors and accepted email visual reference");
  }
}

function validatePresentationPdfDonorRegister(contract, donorRegister) {
  if (
    JSON.stringify(contract.presentation_pdf_donor_register) !== JSON.stringify({
      path: "source/presentation-pdf-donor-register.json",
      raw_pdf_direct_render_prohibited: true,
      all_received_pdf_donors_require_canonical_svg: true,
    })
  ) {
    throw new Error("canonical SVG pipeline must reference the PDF donor register without embedding raw PDF metadata");
  }
  if (
    donorRegister.status !== "owner_attachments_received_pending_canonical_svg_intake" ||
    donorRegister.inputs_committed_to_git !== false ||
    donorRegister.raw_pdf_direct_render_prohibited !== true ||
    donorRegister.existing_historical_pdf_importer_not_invoked !== true ||
    donorRegister.canonical_svg_required_before_draft_render !== true ||
    JSON.stringify(donorRegister.donors) !== JSON.stringify(expectedPresentationPdfDonors)
  ) {
    throw new Error("PDF donor register must preserve received PDF provenance and prohibit direct rendering");
  }
  if (/[A-Za-z]:\\|\/Users\/|file:\/\//u.test(JSON.stringify(donorRegister))) {
    throw new Error("PDF donor register must not contain local absolute paths or raw source paths");
  }
}

function validateClientReferenceSvgUpdate(contract) {
  const expected = {
    source_data_path: "source/client-reference-data.json",
    historical_client_marker: "ГК Достовалова",
    replacement_client_name: "ООО «Водолей Трейд»",
    full_reference_frame_id: "lisa-materials-full-reference",
    source_group_ids_preserved: [
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
    ],
    visible_group_ids: [
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
    ],
    excluded_group_ids: ["dynamic_suggestions", "actions"],
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
  };
  if (JSON.stringify(contract.client_reference_svg_update) !== JSON.stringify(expected)) {
    throw new Error("client reference SVG update must replace ГК Достовалова from the approved client data only");
  }
}

function validateAcceptance(contract) {
  assertSameArray(
    contract.acceptance.frame_flow,
    expectedFrameAcceptanceFlow,
    "frame acceptance flow must match the required SVG-first order",
  );
  assert.deepEqual(
    contract.acceptance.per_frame_review,
    expectedPerFrameReview,
    "per-frame review must replace only one matching frame in an isolated current-prototype copy",
  );
  assertSameArray(
    contract.acceptance.prototype_flow,
    expectedPrototypeAcceptanceFlow,
    "prototype acceptance flow must match the required SVG-first order",
  );
  assertSameArray(
    contract.forbidden_methods,
    expectedForbiddenMethods,
    "forbidden methods must match the five banned methods",
  );
}

function validateReleaseBoundary(contract) {
  const boundary = contract.release_boundary;
  if (
    boundary.candidate_evidence_status !== "pending" ||
    boundary.active_release_switch_status !== "blocked" ||
    boundary.rollback_mode !== "full_bundle_only"
  ) {
    throw new Error("release boundary must remain pending, blocked, and full-bundle rollback only");
  }
  assertSameArray(
    boundary.future_transaction_targets,
    expectedFutureTransactionTargets,
    "future transaction targets must match the inactive contract boundary",
  );
}

function validateActiveRegistry(contract, activeContracts) {
  const registryText = JSON.stringify(activeContracts);
  if (
    contract.active_contract_registry_policy.listed_in_active_contracts !== false ||
    registryText.includes("canonical-svg-frame-pipeline")
  ) {
    throw new Error("canonical SVG frame pipeline contract must not be listed in active-contracts.json");
  }
}

try {
  const { contractPath, activeContractsPath } = parseArguments(process.argv.slice(2));
  const contract = readJson(contractPath);
  const candidate = readJson(siblingPath(contractPath, "prototype-revision-candidate.json"));
  const approvedTexts = readJson(siblingPath(contractPath, "owner-approved-texts.json"));
  const donorRegister = readJson(siblingPath(contractPath, "presentation-pdf-donor-register.json"));
  const activeContracts = readJson(activeContractsPath);

  assertNoRawSourceTraces(contract);
  validateTopLevel(contract);
  validateFrames(contract, candidate);
  validateFrameReviewSession(contract);
  validateOwnerApprovalEvidence(contractPath);
  validateGeneratingReviewEvidence(contractPath);
  validateGeneratingOwnerApprovalEvidence(contractPath);
  validateGeneratingClockCorrectionApprovalEvidence(contractPath);
  validateSentReviewEvidence(contractPath);
  validateEmailReviewEvidence(contractPath);
  validateErrorReviewEvidence(contractPath);
  validateScenario(contract, candidate);
  validateTexts(contract, approvedTexts);
  validatePresentationPdfDonorRegister(contract, donorRegister);
  validateClientReferenceSvgUpdate(contract);
  validateExternalSources(contract);
  validateAcceptance(contract);
  validateReleaseBoundary(contract);
  validateActiveRegistry(contract, activeContracts);
  validateAgainstSchema(contractPath, contract);

  process.stdout.write("Проверка неактивного договора SVG-first кадров CO-2026-003 пройдена.\n");
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "проверка не выполнена"}\n`);
  process.exitCode = 1;
}
