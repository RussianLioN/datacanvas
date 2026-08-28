import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(new URL("../", import.meta.url).pathname);
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const ledgerPath = "docs/product/change-orders/co-2026-003-release-approval-ledger.json";
const candidatePath = `${packagePath}/source/prototype-revision-candidate.json`;
const validatorPath = "scripts/validate-co-2026-003-release-state.mjs";
const generatorPath = "scripts/generate-presentation-link-lisa-user-journey.mjs";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

test("стенограмма закрепляет текст полной неподтверждённой доставки и снимает ложную блокировку выбора", () => {
  const ledger = readJson(ledgerPath);

  assert.deepEqual(ledger.pending_text_selections, []);
  assert.deepEqual(ledger.accepted_text_decisions, [
    {
      topic_id: "delivery_full_failure_message",
      status: "owner_selected",
      selected_text:
        "Презентация сформирована, но отправка по электронной почте в SIGMA и OMEGA не подтверждена. Задача передана в сопровождение.",
      decision_source:
        "Стенограмма интервью имеет приоритет над устаревшей записью журнала по решению владельца продукта в рабочем чате.",
    },
  ]);
});

test("CO-2026-003 хранит решения выпуска раздельно и не подменяет архив поставки черновым архивом", () => {
  const ledger = readJson(ledgerPath);

  assert.deepEqual(ledger.release_decisions.draft_archive, {
    status: "not_release_allowed",
    owner_decision: "11 кадров черновика приняты только для каскадного обновления документации.",
    release_effect: "Не разрешает чистовой прототип, высокоразрешённый рендер или архив поставки.",
  });
  assert.deepEqual(ledger.release_decisions.delivery_archive, {
    status: "owner_allowed_public_but_creation_blocked",
    owner_decision: "Архив поставки разрешён и публичен по решению владельца.",
    creation_blocker: "Создание архива поставки блокируется до отдельного входа в чистовой визуальный выпуск.",
  });
  assert.deepEqual(ledger.release_decisions.publicity, {
    status: "owner_allowed_public",
    owner_decision: "Публичность согласованных демонстрационных данных и визуальных производных является отдельным решением владельца.",
  });
  assert.deepEqual(ledger.release_decisions.high_resolution_render, {
    status: "waiting_owner_input",
    owner_decision: "Высокоразрешённый рендер ожидает отдельные вводные владельца.",
    current_render_allowed: false,
  });
  assert.equal(ledger.final_release.delivery_archive_allowed, false);
  assert.equal(ledger.final_release.high_resolution_render_allowed, false);
});

test("CO-2026-003 separates the accepted documentation cascade from frame and final-release approval", () => {
  assert.equal(
    fs.existsSync(path.join(root, ledgerPath)),
    true,
    "нужен единый реестр разрешений и приёмок CO-2026-003",
  );

  const ledger = readJson(ledgerPath);
  const candidate = readJson(candidatePath);

  assert.equal(ledger.documentation_cascade.scope_acceptance_status, "owner_approved");
  assert.equal(ledger.documentation_cascade.execution_status, "in_progress");
  assert.equal(ledger.final_release.status, "pending_owner_approval");
  assert.equal(ledger.final_release.active_release_switch_allowed, false);
  assert.equal(ledger.final_release.delivery_archive_allowed, false);
  assert.equal(ledger.public_data_authorization.allow_public_repository_and_archives, true);
  assert.equal(ledger.public_data_authorization.raw_external_pdf_tracking_allowed, false);
  const visualContract = readJson(`${packagePath}/source/visual-components-contract.json`);
  assert.deepEqual(visualContract.release_scope, {
    applies_to: "historical_active_release_only",
    successor_contract_path: "source/canonical-svg-frame-pipeline-contract.json",
    future_candidate_use: "forbidden",
  });

  assert.deepEqual(
    ledger.frame_approvals.map((frame) => [frame.frame_id, frame.status]),
    [
      ["lisa-materials-full-reference", "owner_frame_approved"],
      ["lisa-presentation-generating", "owner_frame_approved"],
      ["lisa-presentation-sent", "owner_frame_approved"],
      ["lisa-presentation-email", "owner_frame_approved"],
      ["lisa-order-not-accepted", "owner_frame_approved"],
      ["lisa-delivery-delayed", "owner_frame_approved"],
      ["lisa-delivery-partial", "owner_frame_approved"],
      ["lisa-presentation-slidedoc", "pending_owner_approval"],
      ["lisa-presentation-sber2025", "pending_owner_approval"],
      ["lisa-presentation-mag", "pending_owner_approval"],
    ],
  );

  assert.deepEqual(candidate.historical_inactive_frame_ids, []);
  assert.deepEqual(candidate.active_future_frame_ids, [
    "lisa-materials-summary",
    "lisa-materials-full-reference",
    "lisa-presentation-order",
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

  const result = spawnSync(process.execPath, [path.join(root, validatorPath)], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
});

test("CO-2026-003 blocks the full publication command before any historical package check until final approval", () => {
  const result = spawnSync(process.execPath, [path.join(root, generatorPath)], {
    cwd: root,
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /итоговая приёмка владельца/u);
  assert.doesNotMatch(result.stderr, /договоров не пройдена/u);
});
