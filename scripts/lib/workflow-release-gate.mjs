import fs from "node:fs";
import path from "node:path";

function assertSafeRelativePath(root, relativePath, description) {
  if (typeof relativePath !== "string" || !relativePath || path.isAbsolute(relativePath) || relativePath.includes("\\")) {
    throw new Error(`небезопасный путь ${description}: ${relativePath}`);
  }
  const normalized = path.posix.normalize(relativePath);
  if (normalized !== relativePath || normalized === "." || normalized === ".." || normalized.startsWith("../")) {
    throw new Error(`путь ${description} выходит за корень рабочей копии: ${relativePath}`);
  }
  const rootPath = path.resolve(root);
  const resolved = path.resolve(rootPath, relativePath);
  if (!resolved.startsWith(`${rootPath}${path.sep}`)) {
    throw new Error(`путь ${description} выходит за корень рабочей копии: ${relativePath}`);
  }
  return resolved;
}

function readJson(root, relativePath, description) {
  const absolutePath = assertSafeRelativePath(root, relativePath, description);
  const stat = fs.lstatSync(absolutePath);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`${description} не является обычным файлом: ${relativePath}`);
  }
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

export function readReleaseGateState(root, archiveContractPath) {
  const archiveContract = readJson(root, archiveContractPath, "контракта архива с выпускным барьером");
  const gate = archiveContract.release_gate;
  if (!gate) {
    throw new Error(`в контракте отсутствует выпускной барьер: ${archiveContractPath}`);
  }
  const journeyContract = readJson(root, gate.journey_contract_path, "договора пути пользователя");
  const lifecycle = journeyContract.lifecycle;
  if (!lifecycle || typeof lifecycle !== "object") {
    throw new Error(`в договоре пути пользователя отсутствует lifecycle: ${gate.journey_contract_path}`);
  }
  const mismatches = [
    ["content_review_status", gate.required_content_review_status],
    ["visual_release_status", gate.required_visual_release_status],
  ].filter(([field, expected]) => lifecycle[field] !== expected)
    .map(([field, expected]) => `${field}: ${String(lifecycle[field])} (требуется ${expected})`);
  return mismatches.length === 0
    ? { approved: true, summary: "выпуск разрешён" }
    : { approved: false, summary: mismatches.join("; ") };
}
