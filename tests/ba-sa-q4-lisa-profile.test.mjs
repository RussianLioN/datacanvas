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
const taskSpec = readJson("../docs/product/specs/task-spec-q4-profile-mail-delivery.json");
const promptSpec = readJson("../docs/product/specs/agent-prompt-spec-q4-profile-mail-delivery.json");
const ownerApprovedTexts = readJson("../docs/product/analysis/presentation-link-lisa-user-journey/source/owner-approved-texts.json");

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

test("Q4_2026 BA/SA фиксирует обязательные SIGMA и OMEGA без одного контура для «Справки по клиенту»", () => {
  const text = JSON.stringify({ baSpec, saSpec, taskSpec, promptSpec });

  assert.match(text, /Справка по клиенту[^"]*обязательн[^"]*SIGMA[^"]*OMEGA/iu);
  assert.doesNotMatch(text, /Справка по клиенту[^"]*(?:один или два|одному или двум)[^"]*контур/iu);
  assert.doesNotMatch(text, /доставки PPTX и PDF по допустимому одному или двум контурам/iu);
});

test("BA-спецификация сохраняет роли BT-015, BT-016 и BT-017 из утверждённых БТ", () => {
  const requirements = new Map(baSpec.requirements.map((item) => [item.requirement_id, item]));

  assert.match(requirements.get("BT-015").summary, /заказ/iu);
  assert.match(requirements.get("BT-015").summary, /сеанс/iu);
  assert.match(requirements.get("BT-015").summary, /пользовател/iu);
  assert.match(requirements.get("BT-015").summary, /вызывающ/iu);
  assert.deepEqual(requirements.get("BT-015").acceptance_refs, ["q4_lisa_order"]);

  assert.match(requirements.get("BT-016").summary, /Профиль сотрудника/iu);
  assert.match(requirements.get("BT-016").summary, /адрес/iu);
  assert.match(requirements.get("BT-016").summary, /SIGMA[^.]*OMEGA|OMEGA[^.]*SIGMA/iu);
  assert.doesNotMatch(requirements.get("BT-016").summary, /входн[^.]*пакет/iu);
  assert.deepEqual(requirements.get("BT-016").acceptance_refs, ["q4_profile_addresses"]);

  assert.match(requirements.get("BT-017").summary, /недоверенн|недостаточн|непол/iu);
  assert.match(requirements.get("BT-017").summary, /до принятия/iu);
  assert.match(requirements.get("BT-017").summary, /не переходит[^.]*подготовк/iu);
  assert.deepEqual(requirements.get("BT-017").acceptance_refs, ["q4_lisa_order"]);
  assert.deepEqual(requirements.get("BT-019").acceptance_refs, ["q4_profile_email_delivery", "q4_delayed_or_partial_delivery"]);
});

test("Q4_2026 BA/SA задаёт ровно пять повторов SIGMA через 10 минут в пределах часа", () => {
  const text = JSON.stringify({ baSpec, businessRules, saSpec, stateModel, errorTaxonomy, taskSpec, promptSpec });

  assert.match(text, /SIGMA[^"]*(?:пять|5)[^"]*повтор/iu);
  assert.match(text, /(?:10|десять)[^"]*минут/iu);
  assert.match(text, /(?:одного|один)[^"]*час/iu);
  assert.doesNotMatch(text, /числ(?:о|овое)[^"]*(?:повторов|число повторов)[^"]*(?:не определ|не добавл|не фиксир)/iu);
  assert.doesNotMatch(text, /внешн(?:ая|ей)\s+политик[аеи][^"]*повтор/iu);
});

test("реестр утверждённых текстов содержит дополнительные тексты задержки и успеха после повтора SIGMA", () => {
  const selectionsByTopic = new Map(ownerApprovedTexts.delivery_status_texts.map((item) => [item.topic_id, item]));

  assert.equal(
    selectionsByTopic.get("sigma_delivery_delayed_message")?.text,
    "Отправка презентации в SIGMA задерживается. В течение часа будут выполнены повторные попытки. Сообщу здесь, если отправка будет подтверждена.",
  );
  assert.equal(
    selectionsByTopic.get("sigma_retry_success_message")?.text,
    "Презентация готова и направлена по электронной почте в SIGMA в ЧЧ:ММ.",
  );
  assert.equal(
    selectionsByTopic.get("delivery_full_failure_message")?.text,
    "Презентация сформирована, но отправка по электронной почте в SIGMA и OMEGA не подтверждена. Задача передана в сопровождение.",
  );
});
