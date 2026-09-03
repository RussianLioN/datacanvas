import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { buildDocumentationArchive, resolveActiveArchiveCreatedAt } from "./lib/documentation-archive.mjs";
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
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const temporaryPath = path.join(path.dirname(outputPath), `.${path.basename(outputPath)}.${process.pid}.tmp`);
  try {
    fs.writeFileSync(temporaryPath, expected, { flag: "wx" });
    fs.renameSync(temporaryPath, outputPath);
  } finally {
    if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath, { force: true });
  }
  console.log(`архив документации записан: ${contract.output_path}`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "сборка архива не выполнена"}\n`);
  process.exitCode = 1;
}
