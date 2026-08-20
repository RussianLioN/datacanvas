import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";

const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const sourcePath = `${packagePath}/source`;
const clientDataPath = `${sourcePath}/client-reference-data.json`;
const candidatePath = `${sourcePath}/prototype-revision-candidate.json`;
const brainstormingPath = `${sourcePath}/brainstorming-contract.json`;
const approvedTextsPath = `${sourcePath}/owner-approved-texts.json`;
const candidateMarkdownPath = `${packagePath}/prototype-revision-candidate.md`;
const activeContractsPath = `${sourcePath}/active-contracts.json`;
const journeyContractPath = `${sourcePath}/journey-contract.json`;
const activeReleaseOutputPaths = Object.freeze([
  `${packagePath}/demo`,
  `${packagePath}/derived`,
  `${packagePath}/evidence`,
  "docs/release/co-2026-003-prototype-delivery-archive-contract.json",
  "docs/release/co-2026-003-prototype-delivery-archive.md",
  "docs/release/co-2026-003-q4-lisa-profile-validation-evidence.md",
  "docs/release/co-2026-003-q4-lisa-profile-acceptance-packet.md",
]);
const textFileExtensions = new Set([".css", ".html", ".js", ".json", ".md", ".mjs", ".txt"]);

const expectedGroupIds = Object.freeze([
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

const expectedActiveFutureFrameIds = Object.freeze([
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

const expectedHistoricalInactiveFrameIds = Object.freeze([
  "lisa-materials-summary",
  "lisa-presentation-order",
]);

const expectedTopics = Object.freeze([
  "button_label",
  "generation_started_message",
  "delivery_success_message",
  "email_subject",
  "email_body",
]);
const expectedHistoricalSourcesByTopic = Object.freeze({
  button_label: Object.freeze([]),
  generation_started_message: Object.freeze(["CO3-MSG-001"]),
  delivery_success_message: Object.freeze(["CO3-MSG-003"]),
  email_subject: Object.freeze([]),
  email_body: Object.freeze([]),
});
const expectedApprovedSelections = Object.freeze([
  Object.freeze({
    topic_id: "button_label",
    text: "Создать презентацию по справке",
    team_vote_count: 3,
    selection_method: "team_vote_maximum_plus_exact_candidate",
    historical_candidate_rank: 5,
    candidate_evidence_path: "candidate-evidence/button-label/brainstorming-topic-result.md",
  }),
  Object.freeze({
    topic_id: "generation_started_message",
    text: "Формирование презентации началось в ЧЧ:ММ и займет не более 20 минут. После завершения презентация будет направлена по электронной почте в SIGMA и OMEGA.",
    team_vote_count: 6,
    selection_method: "team_vote_maximum_plus_exact_candidate",
    historical_candidate_rank: 2,
    candidate_evidence_path: "candidate-evidence/generation-started-message/brainstorming-topic-result.md",
  }),
  Object.freeze({
    topic_id: "delivery_success_message",
    text: "Презентация готова и направлена по электронной почте в ЧЧ:ММ.",
    team_vote_count: 6,
    selection_method: "owner_approved_editorial_text_after_team_vote",
    candidate_evidence_path: "candidate-evidence/delivery-success-message/brainstorming-topic-result.md",
  }),
  Object.freeze({
    topic_id: "email_subject",
    text: "Презентация по справке ООО «Водолей Трейд»",
    team_vote_count: 4,
    selection_method: "owner_tie_break_after_team_vote",
    candidate_evidence_path: "candidate-evidence/email-subject/brainstorming-topic-result.md",
  }),
  Object.freeze({
    topic_id: "email_body",
    text: "Во вложении презентация по Справке по клиенту ООО «Водолей Трейд».",
    team_vote_count: 4,
    selection_method: "owner_approved_editorial_text_after_team_vote",
    candidate_evidence_path: "candidate-evidence/email-body/brainstorming-topic-result.md",
  }),
]);

const expectedExternalSourceIds = Object.freeze([
  "presentation_variant_slidedoc_editable_source",
  "presentation_variant_sber2025_editable_source",
  "presentation_variant_mag_editable_source",
  "email_frame_canonical_svg_source",
]);
const expectedFrameFlow = Object.freeze([
  "owner_text_selected",
  "canonical_svg_existing_group_updated",
  "svg_visual_check",
  "draft_png_current_resolution_rendered",
  "owner_frame_approval",
]);
const expectedPrototypeFlow = Object.freeze([
  "all_frames_approved",
  "draft_full_prototype_current_resolution_rendered",
  "owner_full_prototype_approval",
  "high_resolution_render_from_approved_svg_sources",
  "final_owner_approval",
]);
const expectedForbiddenMethods = Object.freeze([
  "html_overlay",
  "css_overlay",
  "png_text_overlay",
  "additional_svg_message_overlay",
  "draft_png_upscale_for_final",
]);
const expectedSemanticEdges = Object.freeze([
  "lifecycle:lisa-materials-full-reference:order_button_clicked:validating",
  "lifecycle:validating:data_not_accepted:lisa-order-not-accepted",
  "lifecycle:lisa-order-not-accepted:retry_after_data_correction:lisa-materials-full-reference",
  "lifecycle:validating:data_accepted:lisa-presentation-generating",
  "lifecycle:lisa-presentation-generating:delivery_confirmed:lisa-presentation-sent",
  "lifecycle:lisa-presentation-generating:delivery_delayed:lisa-delivery-delayed",
  "lifecycle:lisa-presentation-generating:delivery_partial_or_unconfirmed:lisa-delivery-partial",
  "inspection:lisa-presentation-sent:open_chat_list:lisa-presentation-chat-list",
  "inspection:lisa-presentation-chat-list:return_to_same_chat:lisa-presentation-sent",
  "inspection:lisa-presentation-sent:open_delivery_email:lisa-presentation-email",
  "inspection:lisa-presentation-email:open_attachment_slidedoc:lisa-presentation-slidedoc",
  "inspection:lisa-presentation-slidedoc:back_to_email:lisa-presentation-email",
  "inspection:lisa-presentation-email:open_attachment_sber2025:lisa-presentation-sber2025",
  "inspection:lisa-presentation-sber2025:back_to_email:lisa-presentation-email",
  "inspection:lisa-presentation-email:open_attachment_mag:lisa-presentation-mag",
  "inspection:lisa-presentation-mag:back_to_email:lisa-presentation-email",
]);
const expectedExternalSources = Object.freeze([
  Object.freeze({
    source_id: "presentation_variant_slidedoc_editable_source",
    required_for_frame_id: "lisa-presentation-slidedoc",
    required_format: "editable_presentation_source",
    canonical_svg_required_before_render: true,
  }),
  Object.freeze({
    source_id: "presentation_variant_sber2025_editable_source",
    required_for_frame_id: "lisa-presentation-sber2025",
    required_format: "editable_presentation_source",
    canonical_svg_required_before_render: true,
  }),
  Object.freeze({
    source_id: "presentation_variant_mag_editable_source",
    required_for_frame_id: "lisa-presentation-mag",
    required_format: "editable_presentation_source",
    canonical_svg_required_before_render: true,
  }),
  Object.freeze({
    source_id: "email_frame_canonical_svg_source",
    required_for_frame_id: "lisa-presentation-email",
    required_format: "canonical_svg_source",
    canonical_svg_required_before_render: true,
  }),
]);
const localUsersPrefix = `/${"Users"}/`;
const localPathPattern = new RegExp(`${localUsersPrefix}|file://|[A-Za-z]:\\\\`, "u");
const forbiddenTraceKeyPattern = /^(?:source_sha256|sha256|file_name|source_file_name|source_file_path|source_path)$/u;
const sha256ValuePattern = /\b[a-f0-9]{64}\b/iu;
const docxValuePattern = /\.docx\b/iu;

function parseArguments(args) {
  if (args.length === 0) return { root: process.cwd() };
  if (args.length === 2 && args[0] === "--root") return { root: path.resolve(args[1]) };
  throw new Error("использование: node scripts/validate-co-2026-003-prototype-revision.mjs [--root <path>]");
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function readText(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function listTextFiles(absolutePath) {
  if (!fs.existsSync(absolutePath)) return [];
  const entry = fs.statSync(absolutePath);
  if (entry.isFile()) return textFileExtensions.has(path.extname(absolutePath).toLowerCase()) ? [absolutePath] : [];
  if (!entry.isDirectory()) return [];
  const files = [];
  for (const child of fs.readdirSync(absolutePath, { withFileTypes: true })) {
    if (child.isSymbolicLink()) continue;
    files.push(...listTextFiles(path.join(absolutePath, child.name)));
  }
  return files;
}

function formatAjvErrors(errors) {
  return (errors || []).map((error) => `${error.instancePath || "/"}: ${error.message}`).join("; ");
}

function sameArray(actual, expected) {
  return Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index]);
}

function sortedSameArray(actual, expected) {
  if (!Array.isArray(actual) || actual.length !== expected.length) return false;
  return [...actual].sort().join("\u0000") === [...expected].sort().join("\u0000");
}

function assertNoLocalOrRawSourcePaths(value) {
  const text = JSON.stringify(value);
  if (localPathPattern.test(text)) {
    throw new Error("must not contain local absolute paths or raw source paths");
  }
}

function isAllowedExcludedMetadataPath(pathSegments) {
  return pathSegments.length === 3 &&
    pathSegments[0] === "source_control" &&
    pathSegments[1] === "excluded_metadata" &&
    Number.isInteger(Number(pathSegments[2]));
}

function assertNoRawSourceTracesInJson(value, pathSegments = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoRawSourceTracesInJson(item, [...pathSegments, String(index)]));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      const nestedPath = [...pathSegments, key];
      if (!isAllowedExcludedMetadataPath(nestedPath) && forbiddenTraceKeyPattern.test(key)) {
        throw new Error("raw source traces are forbidden outside source_control.excluded_metadata");
      }
      assertNoRawSourceTracesInJson(nested, nestedPath);
    }
    return;
  }
  if (typeof value !== "string") return;
  if (isAllowedExcludedMetadataPath(pathSegments)) return;
  if (docxValuePattern.test(value) || sha256ValuePattern.test(value) || localPathPattern.test(value)) {
    throw new Error("raw source traces are forbidden outside source_control.excluded_metadata");
  }
}

function assertNoRawSourceTracesInText(text) {
  if (docxValuePattern.test(text) || sha256ValuePattern.test(text) || localPathPattern.test(text)) {
    throw new Error("raw source traces are forbidden outside source_control.excluded_metadata");
  }
}

function validateAgainstSchema(root, relativeDataPath, relativeSchemaPath) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const schema = readJson(root, relativeSchemaPath);
  const data = readJson(root, relativeDataPath);
  const validate = ajv.compile(schema);
  if (!validate(data)) {
    throw new Error(`${relativeDataPath} does not match ${relativeSchemaPath}: ${formatAjvErrors(validate.errors)}`);
  }
  return data;
}

function validateClientData(clientData) {
  assertNoLocalOrRawSourcePaths(clientData);
  assertNoRawSourceTracesInJson(clientData);
  if (clientData.client.short_name !== "ООО «Водолей Трейд»") {
    throw new Error("client short_name must be ООО «Водолей Трейд»");
  }
  if (JSON.stringify(clientData).includes("ГК Достовалова")) {
    throw new Error("client model must not contain the previous client ГК Достовалова");
  }
  if (clientData.source_control.raw_source_path_stored !== false || clientData.source_control.raw_source_metadata_stored !== false) {
    throw new Error("raw source path and metadata must remain unstored");
  }

  const actualGroupIds = clientData.data_groups.map((group) => group.group_id);
  if (!sortedSameArray(actualGroupIds, expectedGroupIds)) {
    throw new Error("client reference data must contain every required source group");
  }
  if (!sortedSameArray(clientData.coverage.required_group_ids, expectedGroupIds)) {
    throw new Error("client coverage required_group_ids must match source groups");
  }
  if (!sortedSameArray(clientData.coverage.full_reference_covered_group_ids, expectedGroupIds)) {
    throw new Error("full reference must cover every source group");
  }
  for (const variant of clientData.coverage.presentation_variants) {
    if (variant.page_count !== 3 || variant.pages.length !== 3) {
      throw new Error(`presentation variant ${variant.variant_id} must contain exactly three pages`);
    }
    if (!sortedSameArray(variant.aggregate_covered_group_ids, expectedGroupIds)) {
      throw new Error(`presentation variant ${variant.variant_id} must cover every source group across three pages`);
    }
  }
}

function validateBrainstorming(brainstorming) {
  assertNoLocalOrRawSourcePaths(brainstorming);
  assertNoRawSourceTracesInJson(brainstorming);
  if (!sameArray(brainstorming.topics.map((topic) => topic.topic_id), expectedTopics)) {
    throw new Error("brainstorming contract must contain exactly five independent topics in canonical order");
  }
  if (brainstorming.phase_1_roles.length !== 19 || brainstorming.phase_2_roles.length !== 19) {
    throw new Error("brainstorming contract must keep two 19-role groups");
  }
  for (const topic of brainstorming.topics) {
    if (topic.status !== "pending_owner_selection") {
      throw new Error(`brainstorming topic ${topic.topic_id} must wait for owner selection`);
    }
    if (topic.phase_1.participant_count !== 19) {
      throw new Error(`brainstorming topic ${topic.topic_id} phase_1 must use 19 participants`);
    }
    if (topic.phase_1.minimum_raw_variants_per_participant < 20) {
      throw new Error(`brainstorming topic ${topic.topic_id} phase_1 must request at least 20 variants per participant`);
    }
    if (topic.phase_1.consolidated_candidate_count !== 30) {
      throw new Error(`brainstorming topic ${topic.topic_id} phase_1 must consolidate exactly 30 candidates`);
    }
    if (topic.phase_2.participant_count !== 19 || topic.phase_2.final_candidate_count !== 5) {
      throw new Error(`brainstorming topic ${topic.topic_id} phase_2 must use 19 reviewers and produce exactly 5 candidates`);
    }
    if (topic.generated_candidate_texts.length !== 0) {
      throw new Error(`brainstorming topic ${topic.topic_id} must not contain generated candidate texts before owner input`);
    }
  }
}

function validateApprovedTexts(approvedTexts) {
  assertNoLocalOrRawSourcePaths(approvedTexts);
  assertNoRawSourceTracesInJson(approvedTexts);
  if (approvedTexts.status !== "owner_approved") {
    throw new Error("approved texts must have owner_approved status");
  }
  if (approvedTexts.change_order_id !== "CO-2026-003") {
    throw new Error("approved texts must belong to CO-2026-003");
  }
  if (!sameArray(approvedTexts.selections.map((selection) => selection.topic_id), expectedTopics)) {
    throw new Error("approved texts must contain the five topics in canonical order");
  }
  for (let index = 0; index < expectedApprovedSelections.length; index += 1) {
    const actual = approvedTexts.selections[index];
    const expected = expectedApprovedSelections[index];
    for (const field of ["topic_id", "text", "team_vote_count", "selection_method", "candidate_evidence_path"]) {
      if (actual[field] !== expected[field]) {
        throw new Error(`approved text ${expected.topic_id} must preserve the confirmed ${field}`);
      }
    }
    if ((expected.historical_candidate_rank ?? null) !== (actual.historical_candidate_rank ?? null)) {
      throw new Error(`approved text ${expected.topic_id} must preserve the confirmed historical_candidate_rank`);
    }
  }
  const boundary = approvedTexts.visual_release_boundary;
  if (boundary.candidate_is_generator_input !== false || boundary.render_allowed !== false || boundary.archive_allowed !== false) {
    throw new Error("approved texts must not activate generator input, render, or archive");
  }
}

function validateCandidate(candidate, approvedTexts) {
  assertNoLocalOrRawSourcePaths(candidate);
  assertNoRawSourceTracesInJson(candidate);
  if (!sameArray(candidate.active_future_frame_ids, expectedActiveFutureFrameIds)) {
    throw new Error("candidate active future frame list must contain exactly 11 frames");
  }
  if (!sameArray(candidate.historical_inactive_frame_ids, expectedHistoricalInactiveFrameIds)) {
    throw new Error("candidate must mark two legacy frames as historical inactive");
  }
  const activeFrames = candidate.frames.filter((frame) => frame.status === "active_future");
  const activeButtons = activeFrames.flatMap((frame) => frame.action_ids.map((actionId) => ({ actionId, frameId: frame.id })));
  if (
    candidate.active_button.count !== 1 ||
    candidate.active_button.source_state_id !== "lisa-materials-full-reference" ||
    activeButtons.length !== 1 ||
    activeButtons[0].frameId !== "lisa-materials-full-reference"
  ) {
    throw new Error("candidate must keep exactly one active order button");
  }

  const semanticGraph = candidate.semantic_graphs.find((graph) => graph.graph_type === "semantic_transition");
  const galleryGraph = candidate.semantic_graphs.find((graph) => graph.graph_type === "gallery_order");
  if (!semanticGraph || !galleryGraph) {
    throw new Error("candidate must contain semantic transition graph and gallery order graph");
  }
  const edges = semanticGraph.edges.map((edge) => `${edge.type}:${edge.from}:${edge.event}:${edge.to}`);
  if (!sameArray(edges, expectedSemanticEdges)) {
    throw new Error("semantic graph must contain exactly the required lifecycle and inspection edges");
  }
  if (galleryGraph.is_user_scenario_transition !== false || !sameArray(galleryGraph.ordered_state_ids, expectedActiveFutureFrameIds)) {
    throw new Error("gallery order must show successful path first and errors last without becoming a scenario transition");
  }

  if (!sameArray(candidate.message_topics.map((topic) => topic.topic_id), expectedTopics)) {
    throw new Error("candidate message topics must match brainstorming topics");
  }
  if (candidate.message_topics.some((topic) => topic.status !== "owner_approved")) {
    throw new Error("candidate message topics must be owner_approved after the recorded selection");
  }
  for (const topic of candidate.message_topics) {
    if (!sameArray(topic.preserved_historical_sources, expectedHistoricalSourcesByTopic[topic.topic_id])) {
      throw new Error("candidate historical message sources must preserve the matching lifecycle message");
    }
  }

  const visual = candidate.visual_acceptance_contract;
  if (!sameArray(visual.frame_flow, expectedFrameFlow)) {
    throw new Error("frame_flow must exactly match SVG-first acceptance steps");
  }
  if (!sameArray(visual.prototype_flow, expectedPrototypeFlow)) {
    throw new Error("prototype_flow must exactly match SVG-first prototype steps");
  }
  if (!sameArray(visual.forbidden_methods, expectedForbiddenMethods)) {
    throw new Error("forbidden_methods must exactly match the five banned overlay and upscale methods");
  }

  const gate = candidate.visual_release_gate;
  if (
    gate.release_status !== "blocked_until_editable_sources_and_frame_approval" ||
    gate.render_allowed !== false ||
    gate.owner_selection_complete !== true ||
    gate.all_external_editable_sources_received !== false
  ) {
    throw new Error("prototype revision candidate must remain blocked until editable sources and frame approval");
  }
  const sourceIds = gate.required_external_editable_sources.map((source) => source.source_id);
  if (!sameArray(sourceIds, expectedExternalSourceIds)) {
    throw new Error("visual render requires four external editable sources");
  }
  for (let index = 0; index < expectedExternalSources.length; index += 1) {
    const actual = gate.required_external_editable_sources[index];
    const expected = expectedExternalSources[index];
    if (actual.required_for_frame_id !== expected.required_for_frame_id) {
      throw new Error(`external source ${expected.source_id} must target ${expected.required_for_frame_id}`);
    }
    if (actual.required_format !== expected.required_format) {
      throw new Error(`external source ${expected.source_id} must use required format ${expected.required_format}`);
    }
    if (actual.canonical_svg_required_before_render !== expected.canonical_svg_required_before_render) {
      throw new Error("external presentation sources must require canonical SVG before render");
    }
    if (actual.status !== "pending_owner_attachment") {
      throw new Error(`external source ${expected.source_id} must remain pending_owner_attachment`);
    }
  }
  if (gate.render_allowed && !gate.all_external_editable_sources_received) {
    throw new Error("visual render must remain blocked until all editable sources are received");
  }
  if (!gate.render_allowed && gate.release_status !== "blocked_until_editable_sources_and_frame_approval") {
    throw new Error("blocked visual gate must keep blocked_until_editable_sources_and_frame_approval status");
  }
  if (candidate.approved_texts_source !== "source/owner-approved-texts.json" || approvedTexts.selections.length !== expectedTopics.length) {
    throw new Error("candidate must reference the approved texts register");
  }
}

function validateInactiveCandidateBoundary(root) {
  const activeContracts = readJson(root, activeContractsPath);
  const activeContractText = JSON.stringify(activeContracts);
  if (activeContractText.includes("prototype-revision-candidate")) {
    throw new Error("prototype revision candidate must not be listed in active-contracts.json");
  }

  const journey = readJson(root, journeyContractPath);
  const expectedActiveStateIds = [
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
  ];
  const expectedActionSources = [
    "lisa-materials-summary",
    "lisa-materials-full-reference",
    "lisa-presentation-order",
  ];
  if (
    !sameArray(journey.state_ids, expectedActiveStateIds) ||
    !Array.isArray(journey.actions) ||
    journey.actions.length !== 1 ||
    !sameArray(journey.actions[0].source_state_ids, expectedActionSources)
  ) {
    throw new Error("active journey contract must keep the temporary 13-frame and 3-action-source invariant");
  }

  for (const releasePath of activeReleaseOutputPaths) {
    for (const filePath of listTextFiles(path.join(root, releasePath))) {
      if (fs.readFileSync(filePath, "utf8").includes("candidate-evidence/")) {
        throw new Error("candidate evidence must not be wired into active release outputs");
      }
    }
  }
}

try {
  const { root } = parseArguments(process.argv.slice(2));
  const clientData = validateAgainstSchema(root, clientDataPath, `${sourcePath}/schemas/client-reference-data.schema.json`);
  const candidate = validateAgainstSchema(root, candidatePath, `${sourcePath}/schemas/prototype-revision-candidate.schema.json`);
  const brainstorming = validateAgainstSchema(root, brainstormingPath, `${sourcePath}/schemas/brainstorming-contract.schema.json`);
  const approvedTexts = validateAgainstSchema(root, approvedTextsPath, `${sourcePath}/schemas/owner-approved-texts.schema.json`);
  const candidateMarkdown = readText(root, candidateMarkdownPath);

  validateClientData(clientData);
  validateBrainstorming(brainstorming);
  validateApprovedTexts(approvedTexts);
  validateCandidate(candidate, approvedTexts);
  assertNoRawSourceTracesInText(candidateMarkdown);
  validateInactiveCandidateBoundary(root);

  process.stdout.write("Проверка кандидата пересборки прототипа CO-2026-003 пройдена.\n");
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "проверка не выполнена"}\n`);
  process.exitCode = 1;
}
