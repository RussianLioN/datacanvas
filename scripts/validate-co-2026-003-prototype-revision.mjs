import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";

const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const sourcePath = `${packagePath}/source`;
const clientDataPath = `${sourcePath}/client-reference-data.json`;
const candidatePath = `${sourcePath}/prototype-revision-candidate.json`;
const brainstormingPath = `${sourcePath}/brainstorming-contract.json`;

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

const expectedExternalSourceIds = Object.freeze([
  "presentation_variant_slidedoc_editable_source",
  "presentation_variant_sber2025_editable_source",
  "presentation_variant_mag_editable_source",
  "email_frame_canonical_svg_source",
]);
const localUsersPrefix = `/${"Users"}/`;
const localPathPattern = new RegExp(`${localUsersPrefix}|file://|[A-Za-z]:\\\\`, "u");

function parseArguments(args) {
  if (args.length === 0) return { root: process.cwd() };
  if (args.length === 2 && args[0] === "--root") return { root: path.resolve(args[1]) };
  throw new Error("использование: node scripts/validate-co-2026-003-prototype-revision.mjs [--root <path>]");
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
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

function validateCandidate(candidate) {
  assertNoLocalOrRawSourcePaths(candidate);
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
  const edges = semanticGraph.edges.map((edge) => `${edge.from}:${edge.event}:${edge.to}`);
  for (const expectedEdge of [
    "lisa-materials-full-reference:order_button_clicked:validating",
    "validating:data_not_accepted:lisa-order-not-accepted",
    "lisa-order-not-accepted:retry_after_data_correction:lisa-materials-full-reference",
    "validating:data_accepted:lisa-presentation-generating",
    "lisa-presentation-generating:delivery_confirmed:lisa-presentation-sent",
    "lisa-presentation-generating:delivery_delayed:lisa-delivery-delayed",
    "lisa-presentation-generating:delivery_partial_or_unconfirmed:lisa-delivery-partial",
  ]) {
    if (!edges.includes(expectedEdge)) throw new Error(`candidate semantic graph is missing ${expectedEdge}`);
  }
  if (galleryGraph.is_user_scenario_transition !== false || !sameArray(galleryGraph.ordered_state_ids, expectedActiveFutureFrameIds)) {
    throw new Error("gallery order must show successful path first and errors last without becoming a scenario transition");
  }

  if (!sameArray(candidate.message_topics.map((topic) => topic.topic_id), expectedTopics)) {
    throw new Error("candidate message topics must match brainstorming topics");
  }
  if (candidate.message_topics.some((topic) => topic.status !== "pending_owner_selection")) {
    throw new Error("candidate message topics must remain pending_owner_selection");
  }

  const gate = candidate.visual_release_gate;
  const sourceIds = gate.required_external_editable_sources.map((source) => source.source_id);
  if (!sameArray(sourceIds, expectedExternalSourceIds)) {
    throw new Error("visual render requires four external editable sources");
  }
  if (gate.render_allowed && !gate.owner_selection_complete) {
    throw new Error("visual render must remain blocked until owner selections are complete");
  }
  if (gate.render_allowed && !gate.all_external_editable_sources_received) {
    throw new Error("visual render must remain blocked until all editable sources are received");
  }
  if (!gate.render_allowed && gate.release_status !== "blocked_until_owner_selection_and_editable_sources") {
    throw new Error("blocked visual gate must keep blocked_until_owner_selection_and_editable_sources status");
  }
}

try {
  const { root } = parseArguments(process.argv.slice(2));
  const clientData = validateAgainstSchema(root, clientDataPath, `${sourcePath}/schemas/client-reference-data.schema.json`);
  const candidate = validateAgainstSchema(root, candidatePath, `${sourcePath}/schemas/prototype-revision-candidate.schema.json`);
  const brainstorming = validateAgainstSchema(root, brainstormingPath, `${sourcePath}/schemas/brainstorming-contract.schema.json`);

  validateClientData(clientData);
  validateBrainstorming(brainstorming);
  validateCandidate(candidate);

  process.stdout.write("Проверка кандидата пересборки прототипа CO-2026-003 пройдена.\n");
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "проверка не выполнена"}\n`);
  process.exitCode = 1;
}
