import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { validateQ4TraceabilityReferences } from "../scripts/validate-ba-sa-artifacts.mjs";

const root = new URL("../", import.meta.url);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(new URL(relativePath, root), "utf8"));

const fixture = readJson("tests/fixtures/spec-task-prompt-q4-lisa-profile.json");

test("Q4_2026 SSD-пакет содержит две функции и четыре проверяемые задачи", () => {
  for (const spec of fixture.spec_sets) {
    for (const path of [spec.feature_path, spec.task_path, spec.prompt_path]) {
      assert.ok(fs.existsSync(new URL(path, root)), `отсутствует ${path}`);
    }
    assert.equal(readJson(spec.feature_path).feature_id, spec.feature_id);
    assert.equal(readJson(spec.task_path).task_id, spec.task_id);
    assert.equal(readJson(spec.prompt_path).prompt_id, spec.prompt_id);
  }
});

test("Q4_2026 SSD-пакет хранит полный ожидаемый состав безопасной трассировки", () => {
  const actualStoryIds = new Set();
  const actualAcceptanceScenarioIds = new Set();
  const expectedByPath = new Map(fixture.expected_traceability_by_path.map((entry) => [entry.path, entry]));

  for (const spec of fixture.spec_sets) {
    for (const path of [spec.feature_path, spec.task_path, spec.prompt_path]) {
      assert.ok(fs.existsSync(new URL(path, root)), `отсутствует ${path}`);
      const refs = readJson(path).traceability_refs;
      assert.ok(refs, `${path} не содержит traceability_refs`);
      assert.deepEqual(refs.change_order_ids, [fixture.change_order_id]);
      for (const key of fixture.required_traceability_keys) {
        assert.ok(refs[key]?.length, `${path} не содержит ${key}`);
      }
      const expected = expectedByPath.get(path);
      assert.ok(expected, `${path} не зарегистрирован в полном наборе ожидаемой трассировки`);
      assert.deepEqual(refs.story_ids, expected.story_ids, `${path} содержит неверные story_ids`);
      assert.deepEqual(refs.acceptance_scenario_ids, expected.acceptance_scenario_ids, `${path} содержит неверные acceptance_scenario_ids`);
      refs.story_ids.forEach((storyId) => actualStoryIds.add(storyId));
      refs.acceptance_scenario_ids.forEach((scenarioId) => actualAcceptanceScenarioIds.add(scenarioId));
    }
  }

  assert.deepEqual([...actualStoryIds].sort(), [...fixture.required_q4_story_ids].sort());
  assert.deepEqual([...actualAcceptanceScenarioIds].sort(), [...fixture.required_q4_acceptance_scenario_ids].sort());
});

test("Q4_2026 SSD-пакет зарегистрирован в манифесте и трассе без журнала интервью", () => {
  const manifest = readJson("docs/product/specs/generated-spec-package-manifest.json");
  const expectedSets = fixture.spec_sets.map(({ feature_path, task_path, prompt_path }) => ({
    feature_spec_path: feature_path,
    task_spec_path: task_path,
    prompt_spec_path: prompt_path,
  }));
  assert.ok(Array.isArray(manifest.spec_sets), "манифест не содержит spec_sets");
  assert.deepEqual(manifest.spec_sets.slice(1), expectedSets);
  const validationResults = new Map(manifest.validation_results.map((result) => [result.command, result.status]));
  for (const command of fixture.required_validation_commands) {
    assert.equal(validationResults.get(command), "passed", `манифест не подтверждает успешную проверку: ${command}`);
  }

  const trace = readJson("docs/product/specs/interview-to-spec-trace.json");
  for (const link of fixture.required_trace_links) {
    assert.ok(trace.links.some((candidate) => Object.entries(link).every(([key, value]) => candidate[key] === value)));
  }
  assert.equal(JSON.stringify(trace).includes("raw_answer"), false);
});

test("Q4_2026 валидатор отклоняет неизвестные историю и сценарий приемки", () => {
  const knownStories = new Set(fixture.required_q4_story_ids);
  const knownScenarios = new Set(fixture.required_q4_acceptance_scenario_ids);

  assert.throws(
    () => validateQ4TraceabilityReferences({ story_ids: ["DC-ST-999"], acceptance_scenario_ids: ["q4_lisa_order"] }, knownStories, knownScenarios, "test"),
    /unknown story/u,
  );
  assert.throws(
    () => validateQ4TraceabilityReferences({ story_ids: ["DC-ST-23"], acceptance_scenario_ids: ["unknown_scenario"] }, knownStories, knownScenarios, "test"),
    /unknown acceptance scenario/u,
  );
});
