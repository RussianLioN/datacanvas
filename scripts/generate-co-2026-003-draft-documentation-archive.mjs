import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  buildCo2026003DraftDocumentationArchive,
  readCo2026003DraftDocumentationArchiveContract,
} from "./lib/co-2026-003-draft-documentation-archive.mjs";

function fail(message) {
  throw new Error(message);
}

function main() {
  const argumentsList = process.argv.slice(2);
  if (argumentsList.some((argument) => argument !== "--check")) fail("использование: node scripts/generate-co-2026-003-draft-documentation-archive.mjs [--check]");
  const check = argumentsList.includes("--check");
  const root = process.cwd();
  const contract = readCo2026003DraftDocumentationArchiveContract(root);
  const expected = buildCo2026003DraftDocumentationArchive(root, contract);
  const outputPath = path.resolve(root, contract.output_path);
  if (!outputPath.startsWith(`${root}${path.sep}`)) fail("выходной путь архива выходит за корень рабочей копии");
  if (check) {
    if (!fs.existsSync(outputPath) || !fs.readFileSync(outputPath).equals(expected)) fail("архивный снимок черновика отсутствует или устарел");
    console.log("архивный снимок черновика актуален");
    return;
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true, mode: 0o755 });
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporaryPath, expected, { mode: 0o644 });
    const written = fs.readFileSync(temporaryPath);
    if (!written.equals(expected)) fail("временный архив не прошёл побайтную проверку");
    fs.renameSync(temporaryPath, outputPath);
  } finally {
    if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath, { force: true });
  }
  console.log(`архивный снимок черновика записан: ${contract.output_path}`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "архивный снимок не собран"}\n`);
  process.exitCode = 1;
}
