import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";

import {
  loadBtInterviewArtifacts,
  validateBtInterviewArtifacts,
} from "../scripts/validate-co-2026-003-bt-interview.mjs";

const scopePath = new URL("../docs/product/sources/co-2026-003-current-2026-scope.json", import.meta.url);
const scopeSchemaPath = new URL("../schemas/co-2026-003-current-2026-scope.schema.json", import.meta.url);

function loadScopeSchemaValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  return ajv.compile(JSON.parse(fs.readFileSync(scopeSchemaPath, "utf8")));
}

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

test("CO-2026-003 сохраняет интервью как исторический снимок с указателем на актуальный реестр", () => {
  const artifacts = loadBtInterviewArtifacts();

  assert.equal(artifacts.state.state_role, "historical_stage_snapshot");
  assert.equal(
    artifacts.state.current_release_approval_ledger_path,
    "docs/product/change-orders/co-2026-003-release-approval-ledger.json",
  );
  assert.equal(artifacts.state.documentation_cascade.prototype, "accepted_11_frame_draft_unchanged");
  assert.equal(artifacts.state.documentation_cascade.final_release, "pending");
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

test("схема границы 2026 года отклоняет подмену, перестановку и дрейф исключений", () => {
  const scope = JSON.parse(fs.readFileSync(scopePath, "utf8"));
  const validate = loadScopeSchemaValidator();

  assert.equal(validate(scope), true, JSON.stringify(validate.errors));

  const candidates = [
    {
      label: "подмена DC-ST-09 будущей историей",
      mutate(candidate) {
        candidate.active_story_ids[0] = "DC-ST-31";
      },
    },
    {
      label: "перестановка действующих историй",
      mutate(candidate) {
        [candidate.active_story_ids[0], candidate.active_story_ids[1]] = [candidate.active_story_ids[1], candidate.active_story_ids[0]];
      },
    },
    {
      label: "дрейф исключённых историй",
      mutate(candidate) {
        candidate.excluded_story_ids = ["DC-ST-31", "DC-ST-33", "DC-ST-34"];
      },
    },
    {
      label: "перестановка объектов подробного списка stories",
      mutate(candidate) {
        [candidate.stories[0], candidate.stories[1]] = [candidate.stories[1], candidate.stories[0]];
      },
    },
    {
      label: "подмена story_id объекта stories при неизменном active_story_ids",
      mutate(candidate) {
        candidate.stories[0].story_id = "DC-ST-31";
      },
    },
  ];

  for (const { label, mutate } of candidates) {
    const candidate = structuredClone(scope);
    mutate(candidate);
    assert.equal(validate(candidate), false, label);
  }
});

test("CO-2026-003 не принимает дрейф порядка подробного списка или исключений", () => {
  const artifacts = loadBtInterviewArtifacts();

  const reorderedStories = structuredClone(artifacts);
  reorderedStories.scope.stories.reverse();
  assert.throws(
    () => validateBtInterviewArtifacts(reorderedStories),
    /stories must contain exactly nine active 2026 stories in the approved order/i,
  );

  const changedExclusions = structuredClone(artifacts);
  changedExclusions.scope.excluded_story_ids = ["DC-ST-31", "DC-ST-33", "DC-ST-34"];
  assert.throws(
    () => validateBtInterviewArtifacts(changedExclusions),
    /scope must preserve exactly the approved excluded future stories/i,
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
