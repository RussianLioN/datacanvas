import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";

const root = path.resolve(new URL("../", import.meta.url).pathname);
const packagePath = "docs/product/analysis/presentation-link-lisa-user-journey";
const ledgerPath = "docs/product/change-orders/co-2026-003-release-approval-ledger.json";
const interviewStatePath = "docs/product/change-orders/co-2026-003-q4-lisa-profile-bt-interview-state.json";
const candidatePath = `${packagePath}/source/prototype-revision-candidate.json`;
const validatorPath = "scripts/validate-co-2026-003-release-state.mjs";
const generatorPath = "scripts/generate-presentation-link-lisa-user-journey.mjs";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJson(directory, relativePath, value) {
  const target = path.join(directory, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function validateLedgerAgainstSchema(ledger) {
  const schema = readJson("schemas/co-2026-003-release-approval-ledger.schema.json");
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  return {
    valid: validate(ledger),
    errors: validate.errors,
  };
}

function writeReleaseValidatorFixture(directory, ledger, interviewState) {
  writeJson(directory, ledgerPath, ledger);
  writeJson(directory, "schemas/co-2026-003-release-approval-ledger.schema.json", readJson("schemas/co-2026-003-release-approval-ledger.schema.json"));
  writeJson(directory, candidatePath, readJson(candidatePath));
  writeJson(directory, `${packagePath}/source/client-reference-data.json`, readJson(`${packagePath}/source/client-reference-data.json`));
  writeJson(directory, `${packagePath}/source/visual-components-contract.json`, readJson(`${packagePath}/source/visual-components-contract.json`));
  writeJson(directory, interviewStatePath, interviewState);
  writeJson(directory, ledger.final_release.prototype_package_manifest_path, {
    candidate_fingerprint: { sha256: ledger.final_release.candidate_fingerprint },
  });
  writeJson(directory, ledger.final_release.fresh_evidence_path, {
    candidate_fingerprint: { sha256: ledger.final_release.candidate_fingerprint },
  });
  for (const frame of ledger.frame_approvals) {
    if (frame.review_manifest_path === null) continue;
    writeJson(directory, frame.review_manifest_path, {
      frame_id: frame.frame_id,
      status: "owner_frame_approved",
      owner_frame_approval: {
        record_path: frame.owner_approval_record_path?.replace(`${packagePath}/`, "") ?? null,
      },
    });
  }
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

test("CO-2026-003 хранит итоговое решение выпуска раздельно от исторического черновика", () => {
  const ledger = readJson(ledgerPath);

  assert.deepEqual(ledger.release_decisions.draft_archive, {
    status: "not_release_allowed",
    release_allowed: false,
    owner_decision: "11 кадров черновика приняты только для каскадного обновления документации.",
    release_effect: "Не разрешает чистовой прототип, высокоразрешённый рендер или архив поставки.",
  });
  assert.deepEqual(ledger.release_decisions.delivery_archive, {
    status: "owner_final_approved",
    public_allowed: true,
    creation_allowed: true,
    owner_decision: "Владелец принял браузерный прототип как финальный чистовой результат и разрешил архив поставки.",
    creation_blocker: null,
  });
  assert.deepEqual(ledger.release_decisions.publicity, {
    status: "owner_allowed_public",
    public_allowed: true,
    owner_decision: "Публичность согласованных демонстрационных данных и визуальных производных является отдельным решением владельца.",
  });
  assert.deepEqual(ledger.release_decisions.active_release_switch, {
    status: "owner_final_approved",
    switch_allowed: true,
    owner_decision: "Владелец принял браузерный прототип как финальный чистовой результат и разрешил основной маршрут просмотра.",
    blocking_reason: null,
  });
  assert.deepEqual(ledger.release_decisions.high_resolution_render, {
    status: "owner_final_approved",
    render_allowed: true,
    owner_decision: "Владелец принял внешние 4K-экраны как часть финального чистового результата.",
    current_render_allowed: true,
  });
  assert.equal(ledger.final_release.delivery_archive_allowed, true);
  assert.equal(ledger.final_release.high_resolution_render_allowed, true);
});

test("готовность документации не понижает принятое финальное визуальное решение", () => {
  const ledger = readJson(ledgerPath);

  assert.deepEqual(ledger.documentation_readiness, {
    status: "reconciliation_in_progress",
    scope_source_path: "docs/product/sources/co-2026-003-current-2026-scope.json",
    historical_snapshot_path: interviewStatePath,
    external_dependencies: [],
  });
  assert.equal(ledger.final_release.status, "owner_final_approved");
  assert.equal(ledger.final_release.active_release_switch_allowed, true);
  assert.equal(ledger.final_release.high_resolution_render_allowed, true);
  assert.equal(ledger.final_release.delivery_archive_allowed, true);
});

test("валидатор допускает финальный визуальный выпуск при заблокированных внешних договорах документации", () => {
  const ledger = readJson(ledgerPath);
  const interviewState = readJson(interviewStatePath);
  const fixtureLedger = structuredClone(ledger);
  fixtureLedger.documentation_readiness.status = "blocked_external_contracts";
  fixtureLedger.documentation_readiness.external_dependencies = ["почтовый договор"];

  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "co-2026-003-documentation-readiness-"));
  try {
    writeReleaseValidatorFixture(temporaryDirectory, fixtureLedger, interviewState);

    const result = spawnSync(process.execPath, [path.join(root, validatorPath)], {
      cwd: temporaryDirectory,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("валидатор отклоняет финальный визуальный выпуск без роли исторического снимка", () => {
  const ledger = readJson(ledgerPath);
  const interviewState = readJson(interviewStatePath);
  const fixtureLedger = structuredClone(ledger);
  fixtureLedger.documentation_readiness = {
    status: "reconciliation_in_progress",
    scope_source_path: "docs/product/sources/co-2026-003-current-2026-scope.json",
    historical_snapshot_path: interviewStatePath,
    external_dependencies: [],
  };
  const snapshotWithoutRole = structuredClone(interviewState);
  delete snapshotWithoutRole.state_role;
  delete snapshotWithoutRole.current_release_approval_ledger_path;

  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "co-2026-003-historical-snapshot-"));
  try {
    writeReleaseValidatorFixture(temporaryDirectory, fixtureLedger, snapshotWithoutRole);

    const result = spawnSync(process.execPath, [path.join(root, validatorPath)], {
      cwd: temporaryDirectory,
      encoding: "utf8",
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /историческ.*сним.*роль/iu);
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("реестр хранит 11 принятых экранов и итоговое разрешение чистового выпуска", () => {
  const ledger = readJson(ledgerPath);

  assert.equal(ledger.frame_approvals.length, 11);
  assert.ok(
    ledger.frame_approvals.every((frame) => frame.status === "owner_frame_approved"),
    "все 11 кадров черновика должны иметь статус owner_frame_approved",
  );
  assert.ok(
    ledger.frame_approvals.every((frame) => frame.approval_source_path === "docs/product/change-orders/co-2026-003-q4-lisa-profile-bt-interview-transcript.md"),
    "у каждого принятого кадра должен быть указан источник приёмки из стенограммы",
  );
  assert.equal(ledger.release_decisions.high_resolution_render.current_render_allowed, true);
  assert.equal(ledger.final_release.high_resolution_render_allowed, true);
  assert.equal(ledger.final_release.active_release_switch_allowed, true);
});

test("схема не связывает итоговое подтверждение владельца с независимыми флагами выпуска", () => {
  const ledger = readJson(ledgerPath);
  const finallyApprovedButBlocked = structuredClone(ledger);
  finallyApprovedButBlocked.final_release = {
    ...finallyApprovedButBlocked.final_release,
    status: "owner_final_approved",
    active_release_switch_allowed: false,
    high_resolution_render_allowed: false,
    delivery_archive_allowed: false,
    candidate_fingerprint: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    fresh_evidence_path: "docs/product/analysis/presentation-link-lisa-user-journey/evidence/fresh-final-approval.json",
  };

  const result = validateLedgerAgainstSchema(finallyApprovedButBlocked);
  assert.equal(
    result.valid,
    true,
    `owner_final_approved не должен автоматически требовать active_release_switch_allowed, high_resolution_render_allowed и delivery_archive_allowed: ${JSON.stringify(result.errors)}`,
  );
});

test("валидатор отклоняет итоговое подтверждение без равных ему разрешений выпуска", () => {
  const ledger = readJson(ledgerPath);
  const finallyApprovedButBlocked = structuredClone(ledger);
  finallyApprovedButBlocked.documentation_cascade.execution_status = "completed";
  finallyApprovedButBlocked.documentation_cascade.candidate_fingerprint = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  finallyApprovedButBlocked.final_release = {
    ...finallyApprovedButBlocked.final_release,
    status: "owner_final_approved",
    active_release_switch_allowed: false,
    high_resolution_render_allowed: false,
    delivery_archive_allowed: false,
    candidate_fingerprint: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    fresh_evidence_path: "docs/product/analysis/presentation-link-lisa-user-journey/evidence/fresh-final-approval.json",
  };

  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "co-2026-003-release-state-"));
  try {
    writeJson(temporaryDirectory, ledgerPath, finallyApprovedButBlocked);
    writeJson(temporaryDirectory, "schemas/co-2026-003-release-approval-ledger.schema.json", readJson("schemas/co-2026-003-release-approval-ledger.schema.json"));
    writeJson(temporaryDirectory, candidatePath, readJson(candidatePath));
    writeJson(temporaryDirectory, `${packagePath}/source/client-reference-data.json`, readJson(`${packagePath}/source/client-reference-data.json`));
    writeJson(temporaryDirectory, `${packagePath}/source/visual-components-contract.json`, readJson(`${packagePath}/source/visual-components-contract.json`));
    writeJson(temporaryDirectory, finallyApprovedButBlocked.final_release.prototype_package_manifest_path, {
      candidate_fingerprint: { sha256: finallyApprovedButBlocked.final_release.candidate_fingerprint },
    });
    writeJson(temporaryDirectory, finallyApprovedButBlocked.final_release.fresh_evidence_path, {
      candidate_fingerprint: { sha256: finallyApprovedButBlocked.final_release.candidate_fingerprint },
    });
    for (const frame of finallyApprovedButBlocked.frame_approvals) {
      if (frame.review_manifest_path === null) continue;
      writeJson(temporaryDirectory, frame.review_manifest_path, {
        frame_id: frame.frame_id,
        status: "owner_frame_approved",
        owner_frame_approval: {
          record_path: frame.owner_approval_record_path?.replace(`${packagePath}/`, "") ?? null,
        },
      });
    }

    const result = spawnSync(process.execPath, [path.join(root, validatorPath)], {
      cwd: temporaryDirectory,
      encoding: "utf8",
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /разрешения чистового выпуска должны совпадать/u);
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("валидатор запрещает active release switch без отдельного решения", () => {
  const ledger = readJson(ledgerPath);
  const activeSwitchWithoutDecision = structuredClone(ledger);
  activeSwitchWithoutDecision.documentation_cascade.execution_status = "completed";
  activeSwitchWithoutDecision.documentation_cascade.candidate_fingerprint = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  activeSwitchWithoutDecision.final_release = {
    ...activeSwitchWithoutDecision.final_release,
    status: "owner_final_approved",
    active_release_switch_allowed: true,
    high_resolution_render_allowed: false,
    delivery_archive_allowed: false,
    candidate_fingerprint: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    fresh_evidence_path: "docs/product/analysis/presentation-link-lisa-user-journey/evidence/fresh-final-approval.json",
  };
  activeSwitchWithoutDecision.release_decisions.active_release_switch = {
    ...activeSwitchWithoutDecision.release_decisions.active_release_switch,
    switch_allowed: false,
  };

  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "co-2026-003-active-switch-"));
  try {
    writeJson(temporaryDirectory, ledgerPath, activeSwitchWithoutDecision);
    writeJson(temporaryDirectory, "schemas/co-2026-003-release-approval-ledger.schema.json", readJson("schemas/co-2026-003-release-approval-ledger.schema.json"));
    writeJson(temporaryDirectory, candidatePath, readJson(candidatePath));
    writeJson(temporaryDirectory, `${packagePath}/source/client-reference-data.json`, readJson(`${packagePath}/source/client-reference-data.json`));
    writeJson(temporaryDirectory, `${packagePath}/source/visual-components-contract.json`, readJson(`${packagePath}/source/visual-components-contract.json`));
    writeJson(temporaryDirectory, activeSwitchWithoutDecision.final_release.prototype_package_manifest_path, {
      candidate_fingerprint: { sha256: activeSwitchWithoutDecision.final_release.candidate_fingerprint },
    });
    writeJson(temporaryDirectory, activeSwitchWithoutDecision.final_release.fresh_evidence_path, {
      candidate_fingerprint: { sha256: activeSwitchWithoutDecision.final_release.candidate_fingerprint },
    });
    for (const frame of activeSwitchWithoutDecision.frame_approvals) {
      if (frame.review_manifest_path === null) continue;
      writeJson(temporaryDirectory, frame.review_manifest_path, {
        frame_id: frame.frame_id,
        status: "owner_frame_approved",
        owner_frame_approval: {
          record_path: frame.owner_approval_record_path?.replace(`${packagePath}/`, "") ?? null,
        },
      });
    }

    const result = spawnSync(process.execPath, [path.join(root, validatorPath)], {
      cwd: temporaryDirectory,
      encoding: "utf8",
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /разрешения чистового выпуска должны совпадать/u);
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("CO-2026-003 связывает завершённый каскад, браузерный прототип и итоговое решение", () => {
  assert.equal(
    fs.existsSync(path.join(root, ledgerPath)),
    true,
    "нужен единый реестр разрешений и приёмок CO-2026-003",
  );

  const ledger = readJson(ledgerPath);
  const candidate = readJson(candidatePath);

  assert.equal(ledger.documentation_cascade.scope_acceptance_status, "owner_approved");
  assert.equal(ledger.documentation_cascade.execution_status, "completed");
  assert.equal(ledger.final_release.status, "owner_final_approved");
  assert.equal(ledger.final_release.active_release_switch_allowed, true);
  assert.equal(ledger.final_release.delivery_archive_allowed, true);
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
      ["lisa-presentation-chat-list", "owner_frame_approved"],
      ["lisa-presentation-sent", "owner_frame_approved"],
      ["lisa-presentation-email", "owner_frame_approved"],
      ["lisa-order-not-accepted", "owner_frame_approved"],
      ["lisa-delivery-delayed", "owner_frame_approved"],
      ["lisa-delivery-partial", "owner_frame_approved"],
      ["lisa-presentation-slidedoc", "owner_frame_approved"],
      ["lisa-presentation-sber2025", "owner_frame_approved"],
      ["lisa-presentation-mag", "owner_frame_approved"],
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

test("CO-2026-003 подтверждает чистовой браузерный прототип после итоговой приёмки", () => {
  const result = spawnSync(process.execPath, [path.join(root, "scripts/validate-browser-native-phone-prototype.mjs")], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
});
