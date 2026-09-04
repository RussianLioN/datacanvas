import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

import {
  buildDocumentationArchive,
  publishDocumentationArchiveCandidate,
  resolveActiveArchiveCreatedAt,
} from "./lib/documentation-archive.mjs";
import { assertDocumentationArchiveReleaseGate } from "./lib/documentation-archive-release-gate.mjs";

const DEFAULT_CONTRACT_PATH = "docs/process/universal-documentation-workflow/documentation-archive-contract.json";

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

function validateCandidate(root, contractPath, contract, candidatePath) {
  const relativeCandidatePath = path.relative(root, candidatePath).split(path.sep).join("/");
  const commands = [[
    path.join(import.meta.dirname, "validate-documentation-archive.mjs"),
    ["--contract", contractPath, "--archive", relativeCandidatePath],
  ]];
  if (contract.release_gate?.prototype_check === "browser_native_phone_prototype") {
    commands.push([
      path.join(import.meta.dirname, "validate-browser-native-phone-prototype-delivery-archive.mjs"),
      ["--archive", relativeCandidatePath],
    ]);
  }
  for (const [scriptPath, arguments_] of commands) {
    const result = spawnSync(process.execPath, [scriptPath, ...arguments_], { cwd: root, encoding: "utf8" });
    if (result.status !== 0) {
      throw new Error(`кандидат ZIP не прошёл проверку ${path.basename(scriptPath)}:\n${result.stdout}${result.stderr}`);
    }
  }
}

function main() {
  const root = process.cwd();
  const { check, contractPath } = parseArguments(process.argv.slice(2));
  const contract = readJson(root, contractPath, "контракта архива");
  const chain = readJson(root, contract.source_chain_path, "цепочки исходных материалов");
  assertDocumentationArchiveReleaseGate({ root, contract, readJson, readRegularFile });
  const outputPath = assertSafeRelativePath(root, contract.output_path, "выходного архива");
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath) : null;
  const archiveCreatedAt = resolveActiveArchiveCreatedAt({ root, contract, chain, currentArchive: current, check });
  const expected = buildDocumentationArchive(root, contract, chain, { archiveCreatedAt });

  if (check) {
    if (!current || !current.equals(expected)) {
      console.error(`ERROR: архив документации устарел: ${contract.output_path}`);
      console.error("Запустите команду генерации, указанную в договоре архива.");
      process.exitCode = 1;
      return;
    }
    console.log("архив документации актуален");
    return;
  }
  publishDocumentationArchiveCandidate({
    outputPath,
    content: expected,
    validateCandidate: (candidatePath) => validateCandidate(root, contractPath, contract, candidatePath),
  });
  console.log(`архив документации записан: ${contract.output_path}`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "сборка архива не выполнена"}\n`);
  process.exitCode = 1;
}
