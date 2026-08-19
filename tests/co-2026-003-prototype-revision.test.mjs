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
const clientDataPath = path.join(sourcePath, "client-reference-data.json");
const brainstormingPath = path.join(sourcePath, "brainstorming-contract.json");
const schemaPaths = [
  path.join(sourcePath, "schemas/client-reference-data.schema.json"),
  path.join(sourcePath, "schemas/prototype-revision-candidate.schema.json"),
  path.join(sourcePath, "schemas/brainstorming-contract.schema.json"),
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
    data[candidatePath].visual_release_gate.release_status = "ready_for_visual_render";
    data[candidatePath].visual_release_gate.render_allowed = true;
  } else if (scenario.mutation === "visual_render_without_editable_sources") {
    data[candidatePath].visual_release_gate.owner_selection_complete = true;
    data[candidatePath].visual_release_gate.all_external_editable_sources_received = true;
    data[candidatePath].visual_release_gate.required_external_editable_sources = data[candidatePath].visual_release_gate.required_external_editable_sources.slice(0, 3);
    data[candidatePath].visual_release_gate.release_status = "ready_for_visual_render";
    data[candidatePath].visual_release_gate.render_allowed = true;
  } else {
    throw new Error(`неизвестная мутация ${scenario.mutation}`);
  }
  return data;
}

test("кандидат пересборки CO-2026-003 фиксирует клиентские данные, маршрут, брейншторм и запрет визуального выпуска", () => {
  for (const relativePath of [clientDataPath, candidatePath, brainstormingPath]) {
    assert.equal(fs.existsSync(path.join(root, relativePath)), true, `отсутствует ${relativePath}`);
  }

  const clientData = readJson(clientDataPath);
  const candidate = readJson(candidatePath);
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
  assert.equal(candidate.visual_release_gate.required_external_editable_sources.length, 4);
  assert.equal(candidate.visual_release_gate.release_status, "blocked_until_owner_selection_and_editable_sources");

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

test("узкий валидатор отклоняет известные нарушения кандидата пересборки прототипа", () => {
  const fixture = readJson(negativeFixturePath);
  const base = {
    [clientDataPath]: readJson(clientDataPath),
    [candidatePath]: readJson(candidatePath),
    [brainstormingPath]: readJson(brainstormingPath),
  };
  for (const schemaPath of schemaPaths) {
    base[schemaPath] = readJson(schemaPath);
  }

  for (const scenario of fixture.scenarios) {
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "co-2026-003-prototype-revision-"));
    const mutated = applyMutation(base, scenario);
    for (const [relativePath, value] of Object.entries(mutated)) {
      writeJson(temporaryDirectory, relativePath, value);
    }

    const result = runValidator(["--root", temporaryDirectory], temporaryDirectory);
    assert.notEqual(result.status, 0, `${scenario.id}: валидатор должен был отклонить нарушение`);
    assert.match(result.stderr, new RegExp(scenario.expected_error), `${scenario.id}: ${result.stderr}`);
  }
});
