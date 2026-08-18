import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(new URL(relativePath, root), "utf8"));
const readText = (relativePath) => fs.readFileSync(new URL(relativePath, root), "utf8");

test("CO-2026-003 хранит безопасный реестр согласованных формулировок как источник истины", () => {
  const register = readJson("docs/product/change-orders/co-2026-003-authoritative-interview-decision-register.json");
  assert.equal(register.change_order_id, "CO-2026-003");
  assert.equal(register.source_of_truth_policy.interview_precedence, "equal_to_controlled_xlsx");
  assert.ok(register.decisions.length >= 10);
  assert.ok(register.verbatim_wordings.length >= 30);
  assert.equal(register.decisions.at(-1).decision_id, "CO3-DEC-010");
  assert.equal(register.decisions.at(-1).authoritative_wording_id, "CO3-WRD-029");
  assert.equal(
    register.verbatim_wordings.find((wording) => wording.wording_id === "CO3-WRD-026")?.text,
    "Полная недоставка показывается тем же экраном и дословным сообщением, что и частичная доставка; нового текста и отдельного экрана не будет.",
  );
  assert.deepEqual(register.unresolved_authoritative_text_ids, []);
  assert.deepEqual(register.visual_release_gate, {
    content_review_status: "approved_product_owner",
    visual_release_status: "approved_product_owner",
    release_condition: "explicit_product_owner_visual_approval",
  });
  assert.deepEqual(
    register.authoritative_messages,
    [
      {"message_id":"CO3-MSG-001","lifecycle_message_id":"order_started","text":"Начал формировать презентацию в ЧЧ:ММ. Это займет не более 20 минут. Можете переключиться на другие задачи и через 20 минут проверить почту OMEGA и SIGMA: туда будет направлена презентация"},
      {"message_id":"CO3-MSG-002","lifecycle_message_id":"order_not_accepted","text":"Не удалось принять данные для формирования презентации. Вернитесь к диалогу «Справка по клиенту» и уточните данные, либо оформите тикет в сопровождение."},
      {"message_id":"CO3-MSG-003","lifecycle_message_id":"delivery_confirmed","text":"Презентация сформирована и отправлена на почту в ЧЧ:ММ, проверьте почтовый ящик!"},
      {"message_id":"CO3-MSG-004","lifecycle_message_id":"delivery_delayed","text":"Презентация формируется дольше 20 минут. Задача передана в сопровождение; сообщу здесь, если отправка на почту будет подтверждена."},
      {"message_id":"CO3-MSG-005","lifecycle_message_id":"delivery_partial","text":"Презентация сформирована и направлена в {КОНТУР_УСПЕШНОЙ_ОТПРАВКИ}. Отправка в {КОНТУР_НЕПОДТВЕРЖДЁННОЙ_ОТПРАВКИ} пока не подтверждена. Задача передана в сопровождение; сообщу здесь, если отправка будет подтверждена.","contour_display_rule":"by_actual_address_lookup"}
    ],
  );
  assert.equal(JSON.stringify(register).includes("@"), false);
  const journey = readText("docs/product/analysis/presentation-link-lisa-user-journey/user-journey.md");
  assert.match(journey, /Статус содержания: согласовано\. Статус визуального выпуска: согласовано\./);
  assert.match(journey, /Все существующие десять экранов сохраняются в исходном порядке/);
  assert.doesNotMatch(journey, /Статус содержания: ожидается повторное согласование\./);
});

test("входные документы CO-2026-003 отражают одобренные содержание и визуальный выпуск", () => {
  const entrypoints = [
    "docs/product/README.md",
    "docs/product/change-orders/co-2026-003-q4-lisa-profile.md",
    "docs/product/change-orders/co-2026-003-q4-lisa-profile-impact.md",
    "docs/product/analysis/presentation-link-lisa-user-journey/README.md",
  ].map(readText);

  for (const entrypoint of entrypoints) {
    assert.match(entrypoint, /содержание Q4_2026 (?:согласовано|и визуальный выпуск согласованы)/iu);
    assert.match(entrypoint, /(?:визуальная генерация\s+разрешена|визуальный выпуск (?:согласованы|также согласован)|Штатная генерация опубликовала)/iu);
    assert.doesNotMatch(entrypoint, /ожидает повторного согласования содержания/u);
    assert.doesNotMatch(entrypoint, /ещё не\s+согласовано повторно/u);
    assert.doesNotMatch(entrypoint, /Штатная генерация заменит/u);
  }

  const journey = readText("docs/product/analysis/presentation-link-lisa-user-journey/user-journey.md");
  assert.match(journey, /ровно десять исходных состояний в указанном порядке/iu);
  assert.match(journey, /три виртуальных статусных состояния в конце выпуска/iu);
});
