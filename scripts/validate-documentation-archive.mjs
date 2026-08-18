import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { buildDocumentationArchive, readStoredZip, resolveArchiveMembers } from "./lib/documentation-archive.mjs";

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
  let contractPath = DEFAULT_CONTRACT_PATH;
  for (let index = 0; index < arguments_.length; index += 1) {
    if (arguments_[index] !== "--contract") fail(`неизвестный аргумент: ${arguments_[index]}`);
    if (contractPath !== DEFAULT_CONTRACT_PATH) fail("аргумент --contract указан больше одного раза");
    const suppliedPath = arguments_[index + 1];
    if (!suppliedPath || suppliedPath.startsWith("--")) fail("после --contract требуется относительный путь");
    contractPath = suppliedPath;
    index += 1;
  }
  return contractPath;
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

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function main() {
  const root = process.cwd();
  const contractPath = parseArguments(process.argv.slice(2));
  const contract = readJson(root, contractPath, "контракта архива");
  const schema = readJson(root, "schemas/documentation-archive-contract.schema.json", "схемы контракта архива");
  const chain = readJson(root, contract.source_chain_path, "цепочки исходных материалов");
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(contract)) fail(`контракт архива не соответствует схеме:\n${JSON.stringify(validate.errors, null, 2)}`);
  assertReleaseGate(root, contract);

  const outputPath = assertSafeRelativePath(root, contract.output_path, "выходного архива");
  if (!fs.existsSync(outputPath)) fail(`архив отсутствует: ${contract.output_path}`);
  const current = fs.readFileSync(outputPath);
  const expected = buildDocumentationArchive(root, contract, chain);
  if (!current.equals(expected)) fail("архив не соответствует текущим входным файлам");

  const archive = readStoredZip(current);
  const members = resolveArchiveMembers(root, contract, chain);
  const expectedNames = new Set([
    ...contract.embedded_navigation,
    ...members.map((entry) => `${contract.archive_root}/${entry.path}`),
  ]);
  if (archive.size !== expectedNames.size) fail("архив содержит лишние или дублирующиеся файлы");
  for (const name of expectedNames) if (!archive.has(name)) fail(`в архиве отсутствует файл: ${name}`);

  const manifest = JSON.parse(archive.get("manifest.json").toString("utf8"));
  if (manifest.entries.length !== members.length) fail("манифест архива содержит неверное число входов");
  for (const entry of manifest.entries) {
    const content = archive.get(`${contract.archive_root}/${entry.path}`);
    if (!content) fail(`манифест ссылается на отсутствующий файл: ${entry.path}`);
    if (entry.size !== content.length || entry.sha256 !== sha256(content)) fail(`неверная целостность файла: ${entry.path}`);
  }

  for (const navigationName of ["index.html", "README.md"]) {
    const navigation = archive.get(navigationName).toString("utf8");
    const linkPattern = navigationName.endsWith(".html") ? /href="([^"]+)"/gu : /\[[^\]]+\]\(([^)]+)\)/gu;
    for (const match of navigation.matchAll(linkPattern)) {
      if (!archive.has(match[1])) fail(`${navigationName} содержит неработающую ссылку: ${match[1]}`);
    }
  }

  console.log(`архив документации проверен: ${members.length} входов, ${archive.size} членов ZIP`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "проверка архива не выполнена"}\n`);
  process.exitCode = 1;
}
