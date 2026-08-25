import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

import {
  PACKAGE_PATH,
  compareGeneratedPackage,
  validateGeneratedPackage,
} from "./lib/presentation-link-lisa-user-journey.mjs";
import {
  recoverFullPackageReleaseTransaction,
  runFullPackageReleaseTransaction,
} from "./lib/presentation-link-lisa-full-package-transaction.mjs";
import { validateEvidencePackage } from "./validate-presentation-link-lisa-user-journey-evidence.mjs";

function parseArguments(arguments_) {
  const allowed = new Set(["--check", "--recover"]);
  const unknown = arguments_.filter((argument) => !allowed.has(argument));
  if (unknown.length > 0) throw new Error(`неизвестные аргументы: ${unknown.join(", ")}`);
  const checkMode = arguments_.includes("--check");
  const recoverMode = arguments_.includes("--recover");
  if (recoverMode && checkMode) {
    throw new Error("восстановление нельзя сочетать с проверкой");
  }
  return { checkMode, recoverMode };
}

function assertReleaseState(root) {
  const result = spawnSync("node", ["scripts/validate-co-2026-003-release-state.mjs", "--require-final-release"], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.error) throw new Error(`не удалось проверить состояние выпуска: ${result.error.message}`);
  if (result.status !== 0) {
    const details = `${result.stdout}${result.stderr}`.trim();
    throw new Error(`чистовой выпуск запрещён текущим реестром приёмок${details ? `:\n${details}` : ""}`);
  }
}

function formatIssues(issues) {
  return issues.length === 0 ? "" : `:\n- ${issues.join("\n- ")}`;
}

try {
  const { checkMode, recoverMode } = parseArguments(process.argv.slice(2));
  const root = process.cwd();
  const packageRoot = path.join(root, PACKAGE_PATH);

  if (recoverMode) {
    const result = recoverFullPackageReleaseTransaction({ packageRoot });
    process.stdout.write(`восстановление полного выпуска: ${result.status}.\n`);
  } else if (checkMode) {
    const issues = [
      ...compareGeneratedPackage(root),
      ...validateGeneratedPackage(root, root),
      ...validateEvidencePackage({
        toolchainRoot: root,
        contractRoot: root,
        packageRoot,
        evidenceRoot: path.join(packageRoot, "evidence"),
        allowActivePackage: true,
        requireCandidate: false,
      }),
    ];
    if (issues.length > 0) throw new Error(`сохранённый полный пакет устарел или повреждён${formatIssues(issues)}`);
    process.stdout.write("Сохранённый полный пакет и его доказательства актуальны.\n");
  } else {
    assertReleaseState(root);
    const result = await runFullPackageReleaseTransaction({ root, packageRoot });
    process.stdout.write(`полный пакет опубликован восстановимой транзакцией: ${result.status}.\n`);
  }
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "сборка не выполнена"}\n`);
  process.exitCode = 1;
}
