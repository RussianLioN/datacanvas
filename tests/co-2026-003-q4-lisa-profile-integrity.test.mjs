import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  validateQ4DeliveryProblemClosure,
  validateQ4ReferenceBoundary,
  validateQ4TraceabilityReferences,
} from "../scripts/validate-ba-sa-artifacts.mjs";
import { loadSevenScreenContracts } from "../scripts/lib/presentation-link-lisa-seven-screen-prototype.mjs";

const root = new URL("../", import.meta.url);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(new URL(relativePath, root), "utf8"));
const fixture = readJson("tests/fixtures/co-2026-003-q4-lisa-profile-integrity.json");
const negativeReferences = readJson("tests/fixtures/co-2026-003-q4-lisa-profile-negative-references.json");

const baSpec = readJson("docs/product/analysis/ba/ba-spec.json");
const businessRules = readJson("docs/product/analysis/ba/business-rules.json");
const saSpec = readJson("docs/architecture/system-analysis/sa-spec.json");
const stateModel = readJson("docs/architecture/system-analysis/datacanvas-lifecycle-state-model.json");
const errorTaxonomy = readJson("docs/architecture/system-analysis/error-taxonomy.json");
const traceability = readJson("docs/product/requirements/traceability-matrix.json");
const register = readJson(fixture.interview_register_path);
const storyCatalog = fs.readFileSync(new URL("docs/product/requirements/user-stories.md", root), "utf8");

test("Q4_2026 связывает безопасный Excel, требования, BA/SA, SSD и исходный договор пути", () => {
  for (const path of [fixture.controlled_xlsx.path, fixture.controlled_xlsx.golden_path, fixture.interview_register_path, fixture.journey_contract_path]) {
    assert.equal(fs.existsSync(new URL(path, root)), true, `отсутствует ${path}`);
  }
  assert.equal(register.change_order_id, fixture.change_order_id);
  assert.deepEqual(register.visual_release_gate, fixture.visual_release_gate);
  assert.equal(JSON.stringify(register).includes("@"), false, "реестр не должен содержать адреса электронной почты");

  const linksByRequirement = new Map(traceability.links.map((link) => [link.requirement_id, link]));
  for (const expected of fixture.required_requirement_links) {
    const actual = linksByRequirement.get(expected.requirement_id);
    assert.ok(actual, `матрица трассировки не содержит ${expected.requirement_id}`);
    assert.deepEqual(actual.story_ids, expected.story_ids, `${expected.requirement_id}: неверные истории`);
    assert.deepEqual(actual.acceptance_scenarios, expected.acceptance_scenarios, `${expected.requirement_id}: неверные сценарии приёмки`);
  }
  for (const expected of fixture.required_story_priorities) {
    const row = storyCatalog
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.startsWith(`| ${expected.story_id} |`));
    assert.ok(row, `каталог не содержит ${expected.story_id}`);
    assert.equal(row.split("|").map((value) => value.trim())[3], expected.priority, `${expected.story_id}: приоритет должен совпадать с Excel и решением Product Owner`);
  }

  assert.deepEqual(
    fixture.required_interface_ids.filter((id) => !saSpec.interfaces.some((item) => item.interface_id === id)),
    [],
    "BA/SA не содержит обязательный интерфейс",
  );
  assert.deepEqual(
    fixture.required_lifecycle_state_ids.filter((id) => !stateModel.states.some((item) => item.name === id)),
    [],
    "модель жизненного цикла не содержит обязательное состояние",
  );
  assert.deepEqual(
    fixture.required_error_ids.filter((id) => !errorTaxonomy.errors.some((item) => item.error_id === id)),
    [],
    "таксономия не содержит обязательную ошибку",
  );

  assert.doesNotThrow(() => loadSevenScreenContracts(new URL("../", import.meta.url).pathname));
});

test("Q4_2026 отклоняет неизвестные ссылки SSD на требования, решения, интерфейсы и правила", () => {
  const knownStories = new Set(["DC-ST-34"]);
  const knownScenarios = new Set(["q4_lisa_order"]);
  const knownReferences = {
    knownDecisionIds: new Set(["CO3-DEC-001"]),
    knownInterfaceIds: new Set(["IF-006"]),
    knownBusinessRuleIds: new Set(["BRULE-004"]),
  };

  assert.throws(
    () => validateQ4TraceabilityReferences(negativeReferences.story, knownStories, knownScenarios, "fixture/story"),
    /unknown story/u,
  );
  assert.throws(
    () => validateQ4TraceabilityReferences(negativeReferences.acceptance_scenario, knownStories, knownScenarios, "fixture/scenario"),
    /unknown acceptance scenario/u,
  );
  assert.throws(
    () => validateQ4ReferenceBoundary(negativeReferences.decision, knownReferences, "fixture/decision"),
    /unknown authoritative decision/u,
  );
  assert.throws(
    () => validateQ4ReferenceBoundary(negativeReferences.interface, knownReferences, "fixture/interface"),
    /unknown interface/u,
  );
  assert.throws(
    () => validateQ4ReferenceBoundary(negativeReferences.business_rule, knownReferences, "fixture/rule"),
    /unknown business rule/u,
  );
});

test("Q4_2026 отклоняет разрыв жизненного цикла задержанной доставки", () => {
  const brokenStateModel = structuredClone(stateModel);
  brokenStateModel.states.find((state) => state.name === "delayed").exit_condition = "Завершить без сопровождения.";

  assert.throws(
    () => validateQ4DeliveryProblemClosure({
      baSpec,
      businessRules,
      saSpec,
      stateModel: brokenStateModel,
      errorTaxonomy,
    }),
    /delayed must transfer to support_pending/u,
  );
});
