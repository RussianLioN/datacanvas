import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { buildDocumentationArchive } from "./lib/documentation-archive.mjs";

const DEFAULT_CONTRACT_PATH = "docs/process/universal-documentation-workflow/documentation-archive-contract.json";
const LISA_PROTOTYPE_CHECK = "presentation_link_lisa_user_journey";
const LISA_PROTOTYPE_CHECK_COMMAND = ["scripts/generate-presentation-link-lisa-user-journey.mjs", "--check"];

function fail(message) {
  throw new Error(message);
}

function assertSafeRelativePath(root, relativePath, description) {
  if (typeof relativePath !== "string" || !relativePath || path.isAbsolute(relativePath) || relativePath.includes("\\")) {
    fail(`небезопасный путь ${description}: ${relativePath}`);
  }
  const normalized = path.posix.normalize(relativePath);
  if (normalized !== relativePath || normalized === "." || normalized === ".." || normalized.startsWith("../")) {
    fail(`путь ${description} выходит за корень рабочей копии: ${relativePath}`);
  }
  const rootPath = path.resolve(root);
  const resolved = path.resolve(rootPath, relativePath);
  if (!resolved.startsWith(`${rootPath}${path.sep}`)) fail(`путь ${description} выходит за корень рабочей копии: ${relativePath}`);
  return resolved;
}

function parseArguments(arguments_) {
  let check = false;
  let contractPath = DEFAULT_CONTRACT_PATH;
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--check") {
      check = true;
    } else if (argument === "--contract") {
      if (contractPath !== DEFAULT_CONTRACT_PATH) fail("аргумент --contract указан больше одного раза");
      const suppliedPath = arguments_[index + 1];
      if (!suppliedPath || suppliedPath.startsWith("--")) fail("после --contract требуется относительный путь");
      contractPath = suppliedPath;
      index += 1;
    } else {
      fail(`неизвестный аргумент: ${argument}`);
    }
  }
  return { check, contractPath };
}

function readRegularFile(root, relativePath, description) {
  const absolutePath = assertSafeRelativePath(root, relativePath, description);
  const stat = fs.lstatSync(absolutePath);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${description} не является обычным файлом: ${relativePath}`);
  return absolutePath;
}

function readJson(root, relativePath, description) {
  return JSON.parse(fs.readFileSync(readRegularFile(root, relativePath, description), "utf8"));
}

function assertReleaseGate(root, contract) {
  if (!contract.release_gate) return;
  const gate = contract.release_gate;
  const journeyContract = readJson(root, gate.journey_contract_path, "договор пути пользователя");
  const lifecycle = journeyContract.lifecycle ?? {};
  const mismatches = [
    ["content_review_status", gate.required_content_review_status],
    ["visual_release_status", gate.required_visual_release_status],
  ].filter(([field, expected]) => lifecycle[field] !== expected)
    .map(([field, expected]) => `${field}: ${String(lifecycle[field])} (требуется ${expected})`);
  if (mismatches.length > 0) {
    fail(`статусы договора пути пользователя не прошли выпускной барьер: ${mismatches.join("; ")}`);
  }
  if (gate.prototype_check !== LISA_PROTOTYPE_CHECK) {
    fail(`неподдерживаемая встроенная проверка прототипа: ${String(gate.prototype_check)}`);
  }
  readRegularFile(root, LISA_PROTOTYPE_CHECK_COMMAND[0], "встроенная проверка прототипа");
  const check = spawnSync("node", LISA_PROTOTYPE_CHECK_COMMAND, { cwd: root, encoding: "utf8" });
  if (check.error) fail(`не удалось запустить встроенную проверку прототипа: ${check.error.message}`);
  if (check.status !== 0) {
    const details = `${check.stdout}${check.stderr}`.trim();
    fail(`встроенная проверка прототипа не пройдена${details ? `:\n${details}` : ""}`);
  }
}

function main() {
  const root = process.cwd();
  const { check, contractPath } = parseArguments(process.argv.slice(2));
  const contract = readJson(root, contractPath, "контракта архива");
  const chain = readJson(root, contract.source_chain_path, "цепочки исходных материалов");
  assertReleaseGate(root, contract);
  const expected = buildDocumentationArchive(root, contract, chain);
  const outputPath = assertSafeRelativePath(root, contract.output_path, "выходного архива");

  if (check) {
    const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath) : null;
    if (!current || !current.equals(expected)) {
      console.error(`ERROR: архив документации устарел: ${contract.output_path}`);
      console.error("Запустите команду генерации, указанную в договоре архива.");
      process.exitCode = 1;
      return;
    }
    console.log("архив документации актуален");
    return;
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, expected);
  console.log(`архив документации записан: ${contract.output_path}`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "сборка архива не выполнена"}\n`);
  process.exitCode = 1;
}
