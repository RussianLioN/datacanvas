import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  acquireFullPackageReleaseLock,
  createFullPackageCandidate,
  disposeFullPackageCandidate,
  fullPackageReleaseJournalPath,
  recoverFullPackageReleaseTransaction,
  releaseFullPackageReleaseLock,
  runFullPackageReleaseTransaction,
  sameFullPackageInputSnapshots,
  snapshotFullPackageInputs,
} from "../scripts/lib/presentation-link-lisa-full-package-transaction.mjs";

test("общая блокировка выпуска находится вне активного пакета и исключает второй запуск", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-full-transaction-lock-"));
  const packageRoot = path.join(root, "package");
  fs.mkdirSync(packageRoot, { recursive: true });
  try {
    const first = acquireFullPackageReleaseLock({ packageRoot });
    assert.equal(path.dirname(first.path), root);
    assert.equal(first.path.startsWith(`${packageRoot}${path.sep}`), false);
    assert.throws(
      () => acquireFullPackageReleaseLock({ packageRoot }),
      /блокировка.*занята/u,
    );
    releaseFullPackageReleaseLock(first);

    const second = acquireFullPackageReleaseLock({ packageRoot });
    releaseFullPackageReleaseLock(second);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("кандидат сохраняет ручные входы и весь source, но не переносит старые generated-выходы", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-full-transaction-candidate-"));
  const packageRoot = path.join(root, "package");
  const toolchainPath = "scripts/transaction-tool.mjs";
  fs.mkdirSync(path.join(packageRoot, "source", "deferred-q4"), { recursive: true });
  fs.mkdirSync(path.join(packageRoot, "demo"), { recursive: true });
  fs.mkdirSync(path.join(packageRoot, "derived"), { recursive: true });
  fs.mkdirSync(path.join(packageRoot, "evidence"), { recursive: true });
  fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(packageRoot, "README.md"), "ручной README\n");
  fs.writeFileSync(path.join(packageRoot, "user-journey.md"), "ручной путь\n");
  fs.writeFileSync(path.join(packageRoot, "donor-options.md"), "ручный паспорт\n");
  fs.writeFileSync(path.join(packageRoot, ".DS_Store"), "пользовательская служебная запись");
  fs.writeFileSync(path.join(packageRoot, "source", "deferred-q4", "preview.md"), "P3/P4 остаётся будущим объёмом\n");
  fs.writeFileSync(path.join(packageRoot, "demo", "old.txt"), "старый demo\n");
  fs.writeFileSync(path.join(packageRoot, "derived", "old.txt"), "старый derived\n");
  fs.writeFileSync(path.join(packageRoot, "evidence", "old.txt"), "старый evidence\n");
  fs.writeFileSync(path.join(root, toolchainPath), "export const marker = 'toolchain';\n");

  try {
    const before = snapshotFullPackageInputs({ root, packageRoot, toolchainPaths: [toolchainPath] });
    const candidate = createFullPackageCandidate({ root, packageRoot, toolchainPaths: [toolchainPath] });
    assert.equal(fs.readFileSync(path.join(candidate.packageRoot, "README.md"), "utf8"), "ручной README\n");
    assert.equal(fs.readFileSync(path.join(candidate.packageRoot, ".DS_Store"), "utf8"), "пользовательская служебная запись");
    assert.equal(
      fs.readFileSync(path.join(candidate.packageRoot, "source", "deferred-q4", "preview.md"), "utf8"),
      "P3/P4 остаётся будущим объёмом\n",
    );
    assert.equal(fs.existsSync(path.join(candidate.packageRoot, "demo")), false);
    assert.equal(fs.existsSync(path.join(candidate.packageRoot, "derived")), false);
    assert.equal(fs.existsSync(path.join(candidate.packageRoot, "evidence")), false);
    assert.equal(
      fs.readFileSync(path.join(candidate.root, toolchainPath), "utf8"),
      "export const marker = 'toolchain';\n",
    );
    const after = snapshotFullPackageInputs({ root, packageRoot, toolchainPaths: [toolchainPath] });
    assert.equal(sameFullPackageInputSnapshots(before, after), true);
    disposeFullPackageCandidate(candidate);
    assert.equal(fs.existsSync(candidate.root), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function createReleaseFixture(label) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `datacanvas-lisa-full-transaction-${label}-`));
  const packageRoot = path.join(root, "package");
  fs.mkdirSync(path.join(packageRoot, "source", "deferred-q4"), { recursive: true });
  fs.mkdirSync(path.join(packageRoot, "demo"), { recursive: true });
  fs.mkdirSync(path.join(packageRoot, "derived"), { recursive: true });
  fs.mkdirSync(path.join(packageRoot, "evidence"), { recursive: true });
  fs.writeFileSync(path.join(packageRoot, "README.md"), "ручной README\n");
  fs.writeFileSync(path.join(packageRoot, "user-journey.md"), "ручной путь\n");
  fs.writeFileSync(path.join(packageRoot, "donor-options.md"), "ручный паспорт\n");
  fs.writeFileSync(path.join(packageRoot, "source", "deferred-q4", "preview.md"), "будущий P3/P4\n");
  fs.writeFileSync(path.join(packageRoot, "demo", "marker.txt"), "old-demo\n");
  fs.writeFileSync(path.join(packageRoot, "derived", "marker.txt"), "old-derived\n");
  fs.writeFileSync(path.join(packageRoot, "evidence", "marker.txt"), "old-evidence\n");
  return { root, packageRoot };
}

function fakeReleaseDependencies(calls) {
  return {
    async generatePrototypeCandidate({ sourceRoot, outputRoot, packageRoot, diagnosticRoot }) {
      calls.generator = { sourceRoot, outputRoot, packageRoot, diagnosticRoot };
      fs.mkdirSync(path.join(packageRoot, "demo"), { recursive: true });
      fs.mkdirSync(path.join(packageRoot, "derived"), { recursive: true });
      fs.writeFileSync(path.join(packageRoot, "demo", "marker.txt"), "new-demo\n");
      fs.writeFileSync(path.join(packageRoot, "derived", "marker.txt"), "new-derived\n");
      return { status: "candidate-generated" };
    },
    async generateEvidence({ root, contractRoot, packageRoot, evidenceRoot, toolchainRoot }) {
      calls.evidence = { root, contractRoot, packageRoot, evidenceRoot, toolchainRoot };
      fs.mkdirSync(evidenceRoot, { recursive: true });
      fs.writeFileSync(path.join(evidenceRoot, "marker.txt"), "new-evidence\n");
      return { status: "evidence-generated" };
    },
    validateGeneratedPackage(...args) {
      calls.generatedValidation = args;
      return [];
    },
    validateEvidencePackage(...args) {
      calls.evidenceValidation = args;
      return [];
    },
    validatePublishedPackage(...args) {
      calls.publishedValidation = args;
      return [];
    },
  };
}

test("единая транзакция публикует полный кандидат и передаёт evidence два корня кандидата", async () => {
  const { root, packageRoot } = createReleaseFixture("publish");
  const calls = {};
  try {
    const result = await runFullPackageReleaseTransaction({
      root,
      packageRoot,
      toolchainPaths: [],
      dependencies: fakeReleaseDependencies(calls),
    });

    assert.equal(result.status, "COMMITTED");
    assert.equal(result.mode, "recoverable-switch");
    assert.equal(fs.readFileSync(path.join(packageRoot, "demo", "marker.txt"), "utf8"), "new-demo\n");
    assert.equal(fs.readFileSync(path.join(packageRoot, "derived", "marker.txt"), "utf8"), "new-derived\n");
    assert.equal(fs.readFileSync(path.join(packageRoot, "evidence", "marker.txt"), "utf8"), "new-evidence\n");
    assert.equal(fs.readFileSync(path.join(packageRoot, "README.md"), "utf8"), "ручной README\n");
    assert.equal(fs.readFileSync(path.join(packageRoot, "user-journey.md"), "utf8"), "ручной путь\n");
    assert.equal(fs.readFileSync(path.join(packageRoot, "donor-options.md"), "utf8"), "ручный паспорт\n");
    assert.equal(fs.readFileSync(path.join(packageRoot, "source", "deferred-q4", "preview.md"), "utf8"), "будущий P3/P4\n");
    assert.equal(fs.readFileSync(path.join(result.backupRoot, "demo", "marker.txt"), "utf8"), "old-demo\n");
    assert.equal(calls.generator.sourceRoot, calls.generator.outputRoot);
    assert.equal(calls.generator.diagnosticRoot, root);
    assert.equal(calls.evidence.root, calls.evidence.contractRoot);
    assert.equal(calls.evidence.toolchainRoot, root);
    assert.notEqual(calls.evidence.root, calls.evidence.toolchainRoot);
    assert.equal(calls.evidence.packageRoot, calls.generator.packageRoot);
    assert.equal(calls.evidence.evidenceRoot, path.join(calls.generator.packageRoot, "evidence"));
    assert.deepEqual(calls.generatedValidation, [calls.generator.sourceRoot, calls.generator.outputRoot]);
    assert.deepEqual(calls.evidenceValidation, [calls.evidence.root, {
      contractRoot: calls.evidence.contractRoot,
      packageRoot: calls.evidence.packageRoot,
      evidenceRoot: calls.evidence.evidenceRoot,
      toolchainRoot: calls.evidence.toolchainRoot,
    }]);
    assert.deepEqual(calls.publishedValidation, [{ root, packageRoot }]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("неполный инвентарь evidence или P3/P4 в generated-кандидате останавливает атомарное переключение до переноса резерва", async () => {
  for (const scenario of ["incomplete-evidence", "p3-p4-output"]) {
    const { root, packageRoot } = createReleaseFixture(`atomic-${scenario}`);
    const calls = {};
    const dependencies = fakeReleaseDependencies(calls);
    if (scenario === "incomplete-evidence") {
      dependencies.validateEvidencePackage = (candidateRoot, options) => {
        assert.notEqual(options.packageRoot, packageRoot, "проверка evidence обязана читать временный кандидат, не активный пакет");
        assert.equal(options.evidenceRoot, path.join(options.packageRoot, "evidence"));
        assert.equal(
          fs.existsSync(path.join(options.evidenceRoot, "screenshots", "webkit")),
          false,
          "фикстура намеренно не создаёт полный WebKit-инвентарь",
        );
        return ["инвентарь evidence неполон: отсутствует обязательный WebKit PNG"];
      };
    } else {
      const originalGenerate = dependencies.generatePrototypeCandidate;
      dependencies.generatePrototypeCandidate = async (options) => {
        await originalGenerate(options);
        fs.writeFileSync(
          path.join(options.packageRoot, "demo", "presentation-preview.html"),
          "P3/P4 запрещён в активном MVP\n",
        );
      };
      dependencies.validateGeneratedPackage = (candidateRoot, outputRoot) => {
        const forbidden = path.join(
          outputRoot,
          path.relative(root, packageRoot),
          "demo",
          "presentation-preview.html",
        );
        assert.equal(candidateRoot, outputRoot);
        assert.equal(fs.existsSync(forbidden), true, "фикстура намеренно создаёт запрещённый P3/P4-выход");
        return ["P3/P4 запрещён в generated-кандидате MVP"];
      };
    }
    try {
      await assert.rejects(
        runFullPackageReleaseTransaction({
          root,
          packageRoot,
          toolchainPaths: [],
          dependencies,
        }),
        /проверка (?:generated|evidence)-кандидата не пройдена/u,
      );
      assert.equal(fs.readFileSync(path.join(packageRoot, "demo", "marker.txt"), "utf8"), "old-demo\n", scenario);
      assert.equal(fs.readFileSync(path.join(packageRoot, "derived", "marker.txt"), "utf8"), "old-derived\n", scenario);
      assert.equal(fs.readFileSync(path.join(packageRoot, "evidence", "marker.txt"), "utf8"), "old-evidence\n", scenario);
      assert.equal(
        fs.readFileSync(path.join(packageRoot, "source", "deferred-q4", "preview.md"), "utf8"),
        "будущий P3/P4\n",
        scenario,
      );
      assert.equal(
        fs.readdirSync(root).some((name) => name.startsWith(".presentation-link-lisa-full-package-backup-")),
        false,
        `${scenario}: резерв не должен переноситься до успешной полной проверки кандидата`,
      );
      assert.equal(
        fs.readdirSync(root).some((name) => name.startsWith(".presentation-link-lisa-full-package-candidate-")),
        false,
        `${scenario}: временный кандидат должен быть удалён после безопасного отказа`,
      );
      if (scenario === "p3-p4-output") {
        assert.equal(calls.evidence, undefined, "evidence не должен запускаться после отказа generated-инвентаря");
      }
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test("тайм-аут runtime browser-worker до переключения откатывает PREPARED, сохраняет active и снимает блокировку", async () => {
  const { root, packageRoot } = createReleaseFixture("runtime-worker-timeout");
  const calls = {};
  const dependencies = fakeReleaseDependencies(calls);
  const oldBrowserReportPath = path.join(packageRoot, "evidence", "browser-report.json");
  const oldAcceptanceReportPath = path.join(packageRoot, "evidence", "acceptance-report.json");
  fs.writeFileSync(oldBrowserReportPath, "active-browser-report-before-timeout\n");
  fs.writeFileSync(oldAcceptanceReportPath, "active-acceptance-report-before-timeout\n");
  dependencies.generateEvidence = async ({ root: candidateRoot, packageRoot: candidatePackageRoot, evidenceRoot, toolchainRoot }) => {
    calls.evidence = { candidateRoot, candidatePackageRoot, evidenceRoot, toolchainRoot };
    const stagingRoot = path.join(candidatePackageRoot, ".evidence-staging-runtime-worker-timeout");
    fs.mkdirSync(stagingRoot, { recursive: true });
    fs.writeFileSync(path.join(stagingRoot, "partial-browser-report.json"), "непубликуемый частичный ответ\n");
    const diagnosticPath = path.join(
      toolchainRoot,
      "test-results",
      "presentation-link-lisa-user-journey",
      "runtime-capture",
      "run-fixture-timeout",
      "chromium.json",
    );
    fs.mkdirSync(path.dirname(diagnosticPath), { recursive: true });
    fs.writeFileSync(
      diagnosticPath,
      `${JSON.stringify({
        version: "1.0.0",
        status: "failed",
        browser: "chromium",
        last_viewport: "mobile-390x844",
        last_state_id: "lisa-client-answer",
        last_stage: "runtime",
        elapsed_ms: 48_000,
        termination: "worker-timeout",
        network_attempts: [],
        console_errors: [],
        page_errors: [],
        stderr: "worker deadline exceeded",
      })}\n`,
      "utf8",
    );
    throw new Error("runtime browser-worker timeout: chromium");
  };

  try {
    await assert.rejects(
      runFullPackageReleaseTransaction({
        root,
        packageRoot,
        toolchainPaths: [],
        dependencies,
      }),
      /runtime browser-worker timeout: chromium/u,
    );
    assert.ok(calls.evidence, "runtime timeout должен возникнуть при работе с временным кандидатом");
    assert.notEqual(calls.evidence.candidatePackageRoot, packageRoot);
    assert.equal(calls.evidence.evidenceRoot, path.join(calls.evidence.candidatePackageRoot, "evidence"));
    assert.equal(calls.evidence.toolchainRoot, root);
    assert.equal(fs.readFileSync(path.join(packageRoot, "demo", "marker.txt"), "utf8"), "old-demo\n");
    assert.equal(fs.readFileSync(path.join(packageRoot, "derived", "marker.txt"), "utf8"), "old-derived\n");
    assert.equal(fs.readFileSync(path.join(packageRoot, "evidence", "marker.txt"), "utf8"), "old-evidence\n");
    assert.equal(fs.readFileSync(oldBrowserReportPath, "utf8"), "active-browser-report-before-timeout\n");
    assert.equal(fs.readFileSync(oldAcceptanceReportPath, "utf8"), "active-acceptance-report-before-timeout\n");
    assert.equal(
      fs.readdirSync(root).some((name) => name.startsWith(".presentation-link-lisa-full-package-candidate-")),
      false,
      "кандидат и его staging должны быть удалены после отказа до cutover",
    );
    assert.equal(
      fs.readdirSync(root).some((name) => name.startsWith(".presentation-link-lisa-full-package-backup-")),
      false,
      "до тайм-аута browser-worker резерв активного пакета не должен переноситься",
    );
    const journal = JSON.parse(fs.readFileSync(fullPackageReleaseJournalPath({ packageRoot }), "utf8"));
    assert.equal(journal.phase, "ROLLED_BACK");
    assert.equal(
      fs.readFileSync(
        path.join(
          root,
          "test-results",
          "presentation-link-lisa-user-journey",
          "runtime-capture",
          "run-fixture-timeout",
          "chromium.json",
        ),
        "utf8",
      ).includes("worker deadline exceeded"),
      true,
      "непубликуемая диагностика должна пережить удаление кандидата",
    );
    const retryLock = acquireFullPackageReleaseLock({ packageRoot });
    releaseFullPackageReleaseLock(retryLock);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("изменение входа после сборки отменяет выпуск до переключения", async () => {
  const { root, packageRoot } = createReleaseFixture("mutation");
  try {
    await assert.rejects(
      runFullPackageReleaseTransaction({
        root,
        packageRoot,
        toolchainPaths: [],
        dependencies: fakeReleaseDependencies({}),
        hooks: {
          afterCandidateBuilt() {
            fs.appendFileSync(path.join(packageRoot, "README.md"), "внешняя правка\n");
          },
        },
      }),
      /входы полного выпуска изменились/u,
    );
    assert.equal(fs.readFileSync(path.join(packageRoot, "demo", "marker.txt"), "utf8"), "old-demo\n");
    assert.equal(fs.readFileSync(path.join(packageRoot, "derived", "marker.txt"), "utf8"), "old-derived\n");
    assert.equal(fs.readFileSync(path.join(packageRoot, "evidence", "marker.txt"), "utf8"), "old-evidence\n");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("диагностика PREPARED сохраняется вне временного кандидата", async () => {
  const { root, packageRoot } = createReleaseFixture("prepared-diagnostic");
  const dependencies = fakeReleaseDependencies({});
  dependencies.generatePrototypeCandidate = async ({ diagnosticRoot }) => {
    const diagnosticPath = path.join(
      diagnosticRoot,
      "test-results",
      "presentation-link-lisa-user-journey",
      "raster-mismatch",
      "sha256.json",
    );
    fs.mkdirSync(path.dirname(diagnosticPath), { recursive: true });
    fs.writeFileSync(diagnosticPath, "диагностика PREPARED\n");
    throw new Error("инъекция сбоя канонического растра");
  };
  try {
    await assert.rejects(
      runFullPackageReleaseTransaction({
        root,
        packageRoot,
        toolchainPaths: [],
        dependencies,
      }),
      /инъекция сбоя канонического растра/u,
    );
    assert.equal(
      fs.readFileSync(
        path.join(root, "test-results", "presentation-link-lisa-user-journey", "raster-mismatch", "sha256.json"),
        "utf8",
      ),
      "диагностика PREPARED\n",
    );
    assert.equal(fs.readFileSync(path.join(packageRoot, "demo", "marker.txt"), "utf8"), "old-demo\n");
    assert.equal(
      fs.readdirSync(root).some((name) => name.startsWith(".presentation-link-lisa-full-package-candidate-")),
      false,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("изменение инструмента во время сборки отменяет выпуск до переключения", async () => {
  const { root, packageRoot } = createReleaseFixture("toolchain-mutation");
  const toolchainPath = "scripts/release-tool.mjs";
  fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(root, toolchainPath), "export const version = 1;\n");
  try {
    await assert.rejects(
      runFullPackageReleaseTransaction({
        root,
        packageRoot,
        toolchainPaths: [toolchainPath],
        dependencies: fakeReleaseDependencies({}),
        hooks: {
          afterCandidateBuilt() {
            fs.appendFileSync(path.join(root, toolchainPath), "export const changed = true;\n");
          },
        },
      }),
      /входы полного выпуска изменились/u,
    );
    assert.equal(fs.readFileSync(path.join(packageRoot, "demo", "marker.txt"), "utf8"), "old-demo\n");
    assert.equal(fs.readFileSync(path.join(packageRoot, "derived", "marker.txt"), "utf8"), "old-derived\n");
    assert.equal(fs.readFileSync(path.join(packageRoot, "evidence", "marker.txt"), "utf8"), "old-evidence\n");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("изменение входа после VALIDATED отменяет выпуск до переноса резерва", async () => {
  const { root, packageRoot } = createReleaseFixture("cutover-mutation");
  try {
    await assert.rejects(
      runFullPackageReleaseTransaction({
        root,
        packageRoot,
        toolchainPaths: [],
        dependencies: fakeReleaseDependencies({}),
        hooks: {
          onPhase(phase) {
            if (phase === "VALIDATED") {
              fs.appendFileSync(path.join(packageRoot, "source", "deferred-q4", "preview.md"), "внешняя правка\n");
            }
          },
        },
      }),
      /изменились перед переключением/u,
    );
    assert.equal(fs.readFileSync(path.join(packageRoot, "demo", "marker.txt"), "utf8"), "old-demo\n");
    assert.equal(fs.readFileSync(path.join(packageRoot, "derived", "marker.txt"), "utf8"), "old-derived\n");
    assert.equal(fs.readFileSync(path.join(packageRoot, "evidence", "marker.txt"), "utf8"), "old-evidence\n");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("сбой в каждой фазе переключения восстанавливает полный прежний пакет", async () => {
  for (const phase of ["PREPARED", "VALIDATED", "BACKUP_MOVED", "ACTIVATED", "POST_VALIDATED"]) {
    const { root, packageRoot } = createReleaseFixture(`rollback-${phase}`);
    try {
      await assert.rejects(
        runFullPackageReleaseTransaction({
          root,
          packageRoot,
          toolchainPaths: [],
          dependencies: fakeReleaseDependencies({}),
          hooks: {
            onPhase(observedPhase) {
              if (observedPhase === phase) throw new Error(`инъекция сбоя ${phase}`);
            },
          },
        }),
        new RegExp(`инъекция сбоя ${phase}`, "u"),
      );
      assert.equal(fs.readFileSync(path.join(packageRoot, "demo", "marker.txt"), "utf8"), "old-demo\n", phase);
      assert.equal(fs.readFileSync(path.join(packageRoot, "derived", "marker.txt"), "utf8"), "old-derived\n", phase);
      assert.equal(fs.readFileSync(path.join(packageRoot, "evidence", "marker.txt"), "utf8"), "old-evidence\n", phase);
      assert.equal(fs.readFileSync(path.join(packageRoot, "source", "deferred-q4", "preview.md"), "utf8"), "будущий P3/P4\n", phase);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test("отказ послепубликационной проверки возвращает полный прежний пакет", async () => {
  const { root, packageRoot } = createReleaseFixture("post-validation");
  const dependencies = fakeReleaseDependencies({});
  dependencies.validatePublishedPackage = () => ["инъекция отказа послепубликационной проверки"];
  try {
    await assert.rejects(
      runFullPackageReleaseTransaction({
        root,
        packageRoot,
        toolchainPaths: [],
        dependencies,
      }),
      /послепубликационная проверка полного выпуска не пройдена/u,
    );
    assert.equal(fs.readFileSync(path.join(packageRoot, "demo", "marker.txt"), "utf8"), "old-demo\n");
    assert.equal(fs.readFileSync(path.join(packageRoot, "derived", "marker.txt"), "utf8"), "old-derived\n");
    assert.equal(fs.readFileSync(path.join(packageRoot, "evidence", "marker.txt"), "utf8"), "old-evidence\n");
    const quarantined = fs.readdirSync(root).find((name) => name.startsWith(".presentation-link-lisa-full-package-failed-"));
    assert.ok(quarantined, "новый кандидат должен быть сохранён в карантине для диагностики");
    assert.equal(
      fs.readFileSync(path.join(root, quarantined, "demo", "marker.txt"), "utf8"),
      "new-demo\n",
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("восстановление после BACKUP_MOVED возвращает полный прежний пакет", () => {
  const { root, packageRoot } = createReleaseFixture("recover-backup");
  const backupRoot = path.join(root, ".backup-before-activation");
  const failedRoot = path.join(root, ".failed-before-activation");
  try {
    fs.renameSync(packageRoot, backupRoot);
    fs.writeFileSync(
      fullPackageReleaseJournalPath({ packageRoot }),
      `${JSON.stringify({
        version: "1.0.0",
        phase: "BACKUP_MOVED",
        active_package_root: packageRoot,
        backup_root: backupRoot,
        failed_root: failedRoot,
      })}\n`,
    );

    const result = recoverFullPackageReleaseTransaction({ packageRoot });
    assert.equal(result.status, "RECOVERED");
    assert.equal(fs.readFileSync(path.join(packageRoot, "demo", "marker.txt"), "utf8"), "old-demo\n");
    assert.equal(fs.existsSync(backupRoot), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("восстановление после ACTIVATED изолирует новый кандидат и возвращает прежний пакет", () => {
  const { root, packageRoot } = createReleaseFixture("recover-activated");
  const backupRoot = path.join(root, ".backup-after-activation");
  const failedRoot = path.join(root, ".failed-after-activation");
  try {
    fs.renameSync(packageRoot, backupRoot);
    fs.mkdirSync(path.join(packageRoot, "demo"), { recursive: true });
    fs.mkdirSync(path.join(packageRoot, "derived"), { recursive: true });
    fs.mkdirSync(path.join(packageRoot, "evidence"), { recursive: true });
    fs.writeFileSync(path.join(packageRoot, "demo", "marker.txt"), "new-demo\n");
    fs.writeFileSync(path.join(packageRoot, "derived", "marker.txt"), "new-derived\n");
    fs.writeFileSync(path.join(packageRoot, "evidence", "marker.txt"), "new-evidence\n");
    fs.writeFileSync(
      fullPackageReleaseJournalPath({ packageRoot }),
      `${JSON.stringify({
        version: "1.0.0",
        phase: "ACTIVATED",
        active_package_root: packageRoot,
        backup_root: backupRoot,
        failed_root: failedRoot,
      })}\n`,
    );

    const result = recoverFullPackageReleaseTransaction({ packageRoot });
    assert.equal(result.status, "RECOVERED");
    assert.equal(fs.readFileSync(path.join(packageRoot, "demo", "marker.txt"), "utf8"), "old-demo\n");
    assert.equal(fs.readFileSync(path.join(failedRoot, "demo", "marker.txt"), "utf8"), "new-demo\n");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("восстановление не перезаписывает занятый карантин кандидата", () => {
  const { root, packageRoot } = createReleaseFixture("recover-occupied-quarantine");
  const backupRoot = path.join(root, ".backup-occupied-quarantine");
  const failedRoot = path.join(root, ".failed-occupied-quarantine");
  try {
    fs.renameSync(packageRoot, backupRoot);
    fs.mkdirSync(path.join(packageRoot, "demo"), { recursive: true });
    fs.writeFileSync(path.join(packageRoot, "demo", "marker.txt"), "new-demo\n");
    fs.mkdirSync(failedRoot);
    fs.writeFileSync(path.join(failedRoot, "do-not-overwrite.txt"), "пользовательский материал\n");
    fs.writeFileSync(
      fullPackageReleaseJournalPath({ packageRoot }),
      `${JSON.stringify({
        version: "1.0.0",
        phase: "ACTIVATED",
        active_package_root: packageRoot,
        backup_root: backupRoot,
        failed_root: failedRoot,
      })}\n`,
    );

    assert.throws(
      () => recoverFullPackageReleaseTransaction({ packageRoot }),
      /карантин кандидата уже существует/u,
    );
    assert.equal(fs.readFileSync(path.join(failedRoot, "do-not-overwrite.txt"), "utf8"), "пользовательский материал\n");
    assert.equal(fs.readFileSync(path.join(packageRoot, "demo", "marker.txt"), "utf8"), "new-demo\n");
    assert.equal(fs.readFileSync(path.join(backupRoot, "demo", "marker.txt"), "utf8"), "old-demo\n");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("символическая ссылка во входах останавливает создание кандидата до публикации", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-full-transaction-symlink-"));
  const packageRoot = path.join(root, "package");
  const externalPath = path.join(root, "external.txt");
  fs.mkdirSync(packageRoot, { recursive: true });
  fs.writeFileSync(externalPath, "внешний материал\n");
  fs.symlinkSync(externalPath, path.join(packageRoot, "source-link"));
  try {
    assert.throws(
      () => createFullPackageCandidate({ root, packageRoot, toolchainPaths: [] }),
      /символическая ссылка запрещена/u,
    );
    assert.equal(fs.existsSync(path.join(packageRoot, "source-link")), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("кандидат на другом файловом устройстве останавливает выпуск до копирования", { concurrency: false }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-lisa-full-transaction-device-"));
  const packageRoot = path.join(root, "package");
  fs.mkdirSync(packageRoot, { recursive: true });
  fs.writeFileSync(path.join(packageRoot, "README.md"), "ручной README\n");
  const originalStatSync = fs.statSync;
  try {
    fs.statSync = function statSyncWithOtherCandidateDevice(target, ...args) {
      const stat = originalStatSync(target, ...args);
      if (path.basename(String(target)).startsWith(".presentation-link-lisa-full-package-candidate-")) {
        return { ...stat, dev: Number(stat.dev) + 1 };
      }
      return stat;
    };
    assert.throws(
      () => createFullPackageCandidate({ root, packageRoot, toolchainPaths: [] }),
      /той же файловой системе/u,
    );
  } finally {
    fs.statSync = originalStatSync;
    assert.equal(
      fs.readdirSync(root).some((name) => name.startsWith(".presentation-link-lisa-full-package-candidate-")),
      false,
    );
    fs.rmSync(root, { recursive: true, force: true });
  }
});
