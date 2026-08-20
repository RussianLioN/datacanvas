import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = path.resolve(new URL("../", import.meta.url).pathname);
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const sourcePath = path.join(packagePath, "source");
const candidatePath = path.join(sourcePath, "prototype-revision-candidate.json");
const svgPipelineContractPath = path.join(sourcePath, "canonical-svg-frame-pipeline-contract.json");
const clientDataPath = path.join(sourcePath, "client-reference-data.json");
const presentationPdfDonorRegisterPath = path.join(sourcePath, "presentation-pdf-donor-register.json");
const brainstormingPath = path.join(sourcePath, "brainstorming-contract.json");
const approvedTextsPath = path.join(sourcePath, "owner-approved-texts.json");
const approvedTextsMarkdownPath = path.join(packagePath, "owner-approved-texts.md");
const candidateMarkdownPath = path.join(packagePath, "prototype-revision-candidate.md");
const activeContractsPath = path.join(sourcePath, "active-contracts.json");
const journeyContractPath = path.join(sourcePath, "journey-contract.json");
const unsafeDemoPath = path.join(packagePath, "demo", "unsafe-candidate-reference.js");
const schemaPaths = [
  path.join(sourcePath, "schemas/client-reference-data.schema.json"),
  path.join(sourcePath, "schemas/prototype-revision-candidate.schema.json"),
  path.join(sourcePath, "schemas/brainstorming-contract.schema.json"),
  path.join(sourcePath, "schemas/owner-approved-texts.schema.json"),
  path.join(sourcePath, "schemas/canonical-svg-frame-pipeline-contract.schema.json"),
  path.join(sourcePath, "schemas/presentation-pdf-donor-register.schema.json"),
];
const validatorPath = "scripts/validate-co-2026-003-prototype-revision.mjs";
const negativeFixturePath = "tests/fixtures/co-2026-003-prototype-revision-negative.json";
const localUsersPrefix = `/${"Users"}/`;

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function runValidator(extraArgs = [], cwd = root) {
  return spawnSync(process.execPath, [path.join(root, validatorPath), ...extraArgs], {
    cwd,
    encoding: "utf8",
  });
}

function writeJson(directory, relativePath, value) {
  const target = path.join(directory, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(directory, relativePath, value) {
  const target = path.join(directory, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value);
}

function applyMutation(base, scenario) {
  const data = structuredClone(base);
  if (scenario.mutation === "old_client") {
    data[clientDataPath].client.short_name = "ГК Достовалова";
  } else if (scenario.mutation === "not_11_frames") {
    data[candidatePath].active_future_frame_ids = data[candidatePath].active_future_frame_ids.slice(0, 10);
  } else if (scenario.mutation === "multiple_active_buttons") {
    data[candidatePath].active_button.count = 2;
    data[candidatePath].frames.find((frame) => frame.id === "lisa-presentation-generating").action_ids = ["order-presentation"];
  } else if (scenario.mutation === "invalid_brainstorming_phases") {
    data[brainstormingPath].topics[0].phase_1.consolidated_candidate_count = 29;
  } else if (scenario.mutation === "raw_source_path") {
    data[clientDataPath].source_control.notes.push("сырой источник: file://redacted-source");
  } else if (scenario.mutation === "release_without_selection") {
    data[candidatePath].visual_release_gate.owner_selection_complete = false;
    data[candidatePath].visual_release_gate.release_status = "blocked_until_canonical_svg_sources_and_frame_approval";
  } else if (scenario.mutation === "ready_for_render_with_pending_sources") {
    data[candidatePath].visual_release_gate.owner_selection_complete = true;
    data[candidatePath].visual_release_gate.all_external_visual_donors_received = true;
    data[candidatePath].visual_release_gate.release_status = "ready_for_visual_render";
    data[candidatePath].visual_release_gate.render_allowed = true;
  } else if (scenario.mutation === "visual_render_without_editable_sources") {
    data[candidatePath].visual_release_gate.owner_selection_complete = true;
    data[candidatePath].visual_release_gate.all_external_visual_donors_received = true;
    data[candidatePath].visual_release_gate.required_external_visual_donors = data[candidatePath].visual_release_gate.required_external_visual_donors.slice(0, 3);
    data[candidatePath].visual_release_gate.release_status = "ready_for_visual_render";
    data[candidatePath].visual_release_gate.render_allowed = true;
  } else if (scenario.mutation === "missing_svg_first_step") {
    data[candidatePath].visual_acceptance_contract.frame_flow = data[candidatePath].visual_acceptance_contract.frame_flow.map((step) =>
      step === "svg_visual_check" ? "svg_visual_check_removed" : step
    );
  } else if (scenario.mutation === "reordered_svg_first_step") {
    data[candidatePath].visual_acceptance_contract.frame_flow = [
      "owner_text_selected",
      "svg_visual_check",
      "canonical_svg_existing_group_updated",
      "draft_png_current_resolution_rendered",
      "owner_frame_approval",
    ];
  } else if (scenario.mutation === "removed_forbidden_method") {
    data[candidatePath].visual_acceptance_contract.forbidden_methods = data[candidatePath].visual_acceptance_contract.forbidden_methods.filter((method) => method !== "html_overlay");
  } else if (scenario.mutation === "extra_semantic_edge") {
    data[candidatePath].semantic_graphs.find((graph) => graph.graph_type === "semantic_transition").edges.push({
      type: "inspection",
      from: "lisa-delivery-delayed",
      event: "open_delivery_email",
      to: "lisa-presentation-email",
    });
  } else if (scenario.mutation === "wrong_external_source_format") {
    data[candidatePath].visual_release_gate.required_external_visual_donors[0].required_format = "canonical_svg_source";
  } else if (scenario.mutation === "wrong_external_source_frame") {
    data[candidatePath].visual_release_gate.required_external_visual_donors[1].required_for_frame_id = "lisa-presentation-mag";
  } else if (scenario.mutation === "missing_presentation_canonical_svg_gate") {
    delete data[candidatePath].visual_release_gate.required_external_visual_donors[2].canonical_svg_required_before_render;
  } else if (scenario.mutation === "docx_in_client_note") {
    data[clientDataPath].source_control.notes.push("сырой документ source.docx не должен храниться");
  } else if (scenario.mutation === "sha_in_candidate") {
    data[candidatePath].frames[0].note = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  } else if (scenario.mutation === "forbidden_key_in_candidate") {
    data[candidatePath].frames[0].source_sha256 = "redacted";
  } else if (scenario.mutation === "docx_in_markdown") {
    data[candidateMarkdownPath] = `${data[candidateMarkdownPath]}\n\nВременная ссылка на source.docx.\n`;
  } else if (scenario.mutation === "candidate_added_to_active_contracts") {
    data[activeContractsPath].active_contracts.push({
      id: "prototype-revision-candidate",
      path: "source/prototype-revision-candidate.json",
      schema: "source/schemas/prototype-revision-candidate.schema.json",
    });
  } else if (scenario.mutation === "active_journey_contract_drift") {
    data[journeyContractPath].actions[0].source_state_ids = ["lisa-materials-full-reference"];
  } else if (scenario.mutation === "wrong_delivery_success_historical_source") {
    data[candidatePath].message_topics.find((topic) => topic.topic_id === "delivery_success_message").preserved_historical_sources = ["CO3-MSG-005"];
  } else if (scenario.mutation === "candidate_evidence_wired_into_demo") {
    data[unsafeDemoPath] = "const source = 'candidate-evidence/button-label';\n";
  } else if (scenario.mutation === "approved_text_drift") {
    data[approvedTextsPath].selections.find((selection) => selection.topic_id === "delivery_success_message").text = "Другой текст";
  } else if (scenario.mutation === "stale_svg_pipeline_text_selection") {
    data[svgPipelineContractPath].message_topics[0].status = "pending_owner_selection";
  } else {
    throw new Error(`неизвестная мутация ${scenario.mutation}`);
  }
  return data;
}

test("кандидат пересборки CO-2026-003 фиксирует клиентские данные, маршрут, брейншторм и запрет визуального выпуска", () => {
  for (const relativePath of [clientDataPath, candidatePath, svgPipelineContractPath, presentationPdfDonorRegisterPath, brainstormingPath]) {
    assert.equal(fs.existsSync(path.join(root, relativePath)), true, `отсутствует ${relativePath}`);
  }

  const clientData = readJson(clientDataPath);
  const candidate = readJson(candidatePath);
  const svgPipeline = readJson(svgPipelineContractPath);
  const presentationPdfDonorRegister = readJson(presentationPdfDonorRegisterPath);
  const brainstorming = readJson(brainstormingPath);

  assert.equal(clientData.client.short_name, "ООО «Водолей Трейд»");
  assert.equal(JSON.stringify(clientData).includes("ГК Достовалова"), false, "новая модель не должна сохранять старого клиента");
  assert.equal(JSON.stringify(clientData).includes(localUsersPrefix), false, "модель не должна хранить локальный путь к исходнику");
  assert.doesNotMatch(JSON.stringify(clientData), /s[0-9]{6}/u, "модель не должна хранить локальные метаданные исходника");

  assert.deepEqual(
    candidate.active_future_frame_ids,
    [
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
    ],
  );
  assert.deepEqual(candidate.historical_inactive_frame_ids, ["lisa-materials-summary", "lisa-presentation-order"]);
  assert.equal(candidate.active_button.count, 1);
  assert.equal(candidate.active_button.source_state_id, "lisa-materials-full-reference");
  assert.equal(candidate.visual_release_gate.required_external_visual_donors.length, 4);
  assert.equal(candidate.visual_release_gate.release_status, "blocked_until_canonical_svg_sources_and_frame_approval");
  assert.equal(candidate.visual_release_gate.owner_selection_complete, true);
  assert.equal(svgPipeline.status, "inactive_pending_canonical_svg_sources_and_frame_approval");
  assert.equal(svgPipeline.text_selection_source.path, "source/owner-approved-texts.json");
  assert.ok(svgPipeline.message_topics.every((topic) => topic.status === "owner_approved"));
  assert.deepEqual(svgPipeline.client_reference_svg_update, {
    source_data_path: "source/client-reference-data.json",
    historical_client_marker: "ГК Достовалова",
    replacement_client_name: "ООО «Водолей Трейд»",
    full_reference_frame_id: "lisa-materials-full-reference",
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
  assert.equal(presentationPdfDonorRegister.status, "owner_attachments_received_pending_canonical_svg_intake");
  assert.equal(presentationPdfDonorRegister.raw_pdf_direct_render_prohibited, true);
  assert.deepEqual(presentationPdfDonorRegister.donors.map((donor) => donor.frame_id), [
    "lisa-presentation-slidedoc",
    "lisa-presentation-sber2025",
    "lisa-presentation-mag",
  ]);
  assert.ok(presentationPdfDonorRegister.donors.every((donor) => donor.page_count === 3));
  assert.deepEqual(svgPipeline.acceptance.frame_flow, [
    "owner_text_selected",
    "canonical_svg_existing_group_updated",
    "svg_visual_check",
    "draft_png_current_resolution_rendered",
    "owner_frame_approval",
  ]);
  assert.deepEqual(svgPipeline.acceptance.per_frame_review, {
    required: true,
    review_surface: "isolated_current_prototype_copy",
    allowed_changed_frame_count: 1,
    candidate_must_replace_same_frame_id: true,
    next_frame_blocked_until_owner_approval: true,
    active_release_mutation_prohibited: true,
  });
  assert.deepEqual(
    Object.fromEntries(candidate.message_topics.map((topic) => [topic.topic_id, topic.preserved_historical_sources])),
    {
      button_label: [],
      generation_started_message: ["CO3-MSG-001"],
      delivery_success_message: ["CO3-MSG-003"],
      email_subject: [],
      email_body: [],
    },
    "исторический текст успеха должен ссылаться только на CO3-MSG-003, а не на сообщение частичной доставки",
  );

  assert.deepEqual(
    brainstorming.topics.map((topic) => topic.topic_id),
    ["button_label", "generation_started_message", "delivery_success_message", "email_subject", "email_body"],
  );
  for (const topic of brainstorming.topics) {
    assert.equal(topic.status, "pending_owner_selection");
    assert.equal(topic.phase_1.participant_count, 19);
    assert.equal(topic.phase_1.minimum_raw_variants_per_participant, 20);
    assert.equal(topic.phase_1.consolidated_candidate_count, 30);
    assert.equal(topic.phase_2.participant_count, 19);
    assert.equal(topic.phase_2.final_candidate_count, 5);
    assert.deepEqual(topic.generated_candidate_texts, []);
  }

  const result = runValidator();
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
});

test("согласованные владельцем тексты хранятся отдельно от исторического пакета голосования", () => {
  for (const relativePath of [approvedTextsPath, approvedTextsMarkdownPath, path.join(sourcePath, "schemas/owner-approved-texts.schema.json")]) {
    assert.equal(fs.existsSync(path.join(root, relativePath)), true, `отсутствует ${relativePath}`);
  }

  const approvedTexts = readJson(approvedTextsPath);
  assert.equal(approvedTexts.status, "owner_approved");
  assert.equal(approvedTexts.change_order_id, "CO-2026-003");
  assert.deepEqual(approvedTexts.selections.map((selection) => [selection.topic_id, selection.text]), [
    ["button_label", "Создать презентацию по справке"],
    ["generation_started_message", "Формирование презентации началось в ЧЧ:ММ и займет не более 20 минут. После завершения презентация будет направлена по электронной почте в SIGMA и OMEGA."],
    ["delivery_success_message", "Презентация готова и направлена по электронной почте в ЧЧ:ММ."],
    ["email_subject", "Презентация по справке ООО «Водолей Трейд»"],
    ["email_body", "Во вложении презентация по Справке по клиенту ООО «Водолей Трейд»."],
  ]);
  assert.equal(approvedTexts.selections.find((selection) => selection.topic_id === "email_subject")?.selection_method, "owner_tie_break_after_team_vote");
  assert.equal(approvedTexts.selections.find((selection) => selection.topic_id === "button_label")?.historical_candidate_rank, 5);
  assert.equal(approvedTexts.selections.find((selection) => selection.topic_id === "delivery_success_message")?.historical_candidate_rank, undefined);
  assert.equal(approvedTexts.visual_release_boundary.render_allowed, false);
  assert.equal(approvedTexts.visual_release_boundary.archive_allowed, false);
  assert.equal(JSON.stringify(approvedTexts).includes(".docx"), false);
  assert.equal(JSON.stringify(approvedTexts).includes(localUsersPrefix), false);

  const candidate = readJson(candidatePath);
  assert.equal(candidate.approved_texts_source, "source/owner-approved-texts.json");
  assert.equal(candidate.visual_release_gate.owner_selection_complete, true);
  assert.equal(candidate.visual_release_gate.render_allowed, false);
});

test("узкий валидатор отклоняет известные нарушения кандидата пересборки прототипа", () => {
  const fixture = readJson(negativeFixturePath);
  const base = {
    [clientDataPath]: readJson(clientDataPath),
    [presentationPdfDonorRegisterPath]: readJson(presentationPdfDonorRegisterPath),
    [candidatePath]: readJson(candidatePath),
    [svgPipelineContractPath]: readJson(svgPipelineContractPath),
    [brainstormingPath]: readJson(brainstormingPath),
    [approvedTextsPath]: readJson(approvedTextsPath),
    [activeContractsPath]: readJson(activeContractsPath),
    [journeyContractPath]: readJson(journeyContractPath),
    [candidateMarkdownPath]: fs.readFileSync(path.join(root, candidateMarkdownPath), "utf8"),
    [unsafeDemoPath]: "",
  };
  for (const schemaPath of schemaPaths) {
    base[schemaPath] = readJson(schemaPath);
  }

  for (const scenario of fixture.scenarios) {
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "co-2026-003-prototype-revision-"));
    try {
      const mutated = applyMutation(base, scenario);
      for (const [relativePath, value] of Object.entries(mutated)) {
        if (typeof value === "string") writeText(temporaryDirectory, relativePath, value);
        else writeJson(temporaryDirectory, relativePath, value);
      }

      const result = runValidator(["--root", temporaryDirectory], temporaryDirectory);
      assert.notEqual(result.status, 0, `${scenario.id}: валидатор должен был отклонить нарушение`);
      assert.match(result.stderr, new RegExp(scenario.expected_error), `${scenario.id}: ${result.stderr}`);
    } finally {
      fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  }
});
