import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  validateOpenExternalQ4Interfaces,
  validateQ4DeliveryProblemClosure,
} from "../scripts/validate-ba-sa-artifacts.mjs";

const readJson = (relativePath) => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), "utf8"));
const fixture = readJson("./fixtures/ba-sa-q4-lisa-profile.json");
const baSpec = readJson("../docs/product/analysis/ba/ba-spec.json");
const businessRules = readJson("../docs/product/analysis/ba/business-rules.json");
const saSpec = readJson("../docs/architecture/system-analysis/sa-spec.json");
const stateModel = readJson("../docs/architecture/system-analysis/datacanvas-lifecycle-state-model.json");
const errorTaxonomy = readJson("../docs/architecture/system-analysis/error-taxonomy.json");

test("Q4_2026 BA/SA-контур содержит согласованные правила и утверждения", () => {
  const claims = new Set(baSpec.claims.map(({ claim_id }) => claim_id));
  const rules = new Set(baSpec.business_rules.map(({ rule_id }) => rule_id));
  for (const id of fixture.required_claim_ids) assert.ok(claims.has(id), `отсутствует ${id}`);
  for (const id of fixture.required_rule_ids) assert.ok(rules.has(id), `отсутствует ${id}`);
});

test("Q4_2026 системная модель сохраняет открытые внешние контракты и терминальные состояния", () => {
  const interfaces = new Map(saSpec.interfaces.map((item) => [item.interface_id, item]));
  for (const id of fixture.required_interface_ids) assert.ok(interfaces.has(id), `отсутствует ${id}`);
  assert.match(interfaces.get("IF-008").contract_status, /прямой маршрут DataCanvas в Лису не утвержден/);
  assert.match(interfaces.get("IF-009").contract_status, /прямую доставку DataCanvas в Лису этот контракт не фиксирует/);

  const stateNames = new Set(stateModel.states.map(({ name }) => name));
  for (const name of fixture.required_state_names) assert.ok(stateNames.has(name), `отсутствует ${name}`);
  const errorIds = new Set(errorTaxonomy.errors.map(({ error_id }) => error_id));
  for (const id of fixture.required_error_ids) assert.ok(errorIds.has(id), `отсутствует ${id}`);
});

test("IF-006 и IF-007 сохраняют открытые вопросы и не закрепляют внешний договор", () => {
  const interfaces = saSpec.interfaces.filter(({ interface_id }) => ["IF-006", "IF-007"].includes(interface_id));
  assert.doesNotThrow(() => validateOpenExternalQ4Interfaces(interfaces));

  const invalidInterfaces = readJson("./fixtures/ba-sa-q4-lisa-profile-invalid-interface-claims.json").interfaces;
  assert.throws(
    () => validateOpenExternalQ4Interfaces(invalidInterfaces),
    /must not define a precise API, authentication, or protocol claim/i,
  );

  const interfacesWithoutOpenQuestions = structuredClone(interfaces);
  interfacesWithoutOpenQuestions[0].open_questions = [];
  assert.throws(
    () => validateOpenExternalQ4Interfaces(interfacesWithoutOpenQuestions),
    /must keep open questions/i,
  );
});

test("задержанная доставка закрывает сеанс и не допускает новый заказ", () => {
  assert.doesNotThrow(() => validateQ4DeliveryProblemClosure({
    baSpec,
    businessRules,
    saSpec,
    stateModel,
    errorTaxonomy,
  }));
});
