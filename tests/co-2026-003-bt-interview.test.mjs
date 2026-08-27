import assert from "node:assert/strict";
import test from "node:test";

import {
  loadBtInterviewArtifacts,
  validateBtInterviewArtifacts,
} from "../scripts/validate-co-2026-003-bt-interview.mjs";

test("CO-2026-003 фиксирует ровно девять действующих историй 2026 года", () => {
  const artifacts = loadBtInterviewArtifacts();

  assert.doesNotThrow(() => validateBtInterviewArtifacts(artifacts));
  assert.deepEqual(artifacts.scope.active_story_ids, [
    "DC-ST-09",
    "DC-ST-23",
    "DC-ST-24",
    "DC-ST-25",
    "DC-ST-26",
    "DC-ST-27",
    "DC-ST-28",
    "DC-ST-29",
    "DC-ST-30",
  ]);
  assert.equal(artifacts.scope.resource_data_used, false);
  assert.equal(artifacts.scope.source.original_sha256, "9b7d6e2bfb19eb943ad5a989c76a83ac58b63cfefecaaa33c6644dd1352fbfc5");
});

test("CO-2026-003 не принимает будущую историю в границу 2026 года", () => {
  const artifacts = loadBtInterviewArtifacts();
  const invalidArtifacts = structuredClone(artifacts);
  invalidArtifacts.scope.active_story_ids.push("DC-ST-31");

  assert.throws(
    () => validateBtInterviewArtifacts(invalidArtifacts),
    /exactly nine active 2026 stories/i,
  );
});

test("CO-2026-003 хранит согласованное правило повторов и разные исходы доставки", () => {
  const artifacts = loadBtInterviewArtifacts();
  const transcript = artifacts.transcript;

  for (const expectedText of [
    "Отправка презентации в SIGMA задерживается. В течение часа будут выполнены повторные попытки. Сообщу здесь, если отправка будет подтверждена.",
    "Презентация готова и направлена по электронной почте в SIGMA в ЧЧ:ММ.",
    "Презентация сформирована, но отправка по электронной почте в SIGMA и OMEGA не подтверждена. Задача передана в сопровождение.",
  ]) {
    assert.ok(transcript.includes(expectedText), `в стенограмме отсутствует согласованный текст: ${expectedText}`);
  }
  assert.match(transcript, /пять повторных попыток.*десять минут.*один час/iu);
  assert.match(transcript, /ошибк[ае] почтового сервиса.*без повторных попыток/iu);
});
