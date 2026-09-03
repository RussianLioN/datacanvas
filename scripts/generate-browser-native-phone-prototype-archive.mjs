import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";

import {
  createMoscowReleaseTimestamp,
  createStoredZip,
  dosTimestampFromMoscowReleaseTime,
  readStoredZipWithMetadata,
} from "./lib/documentation-archive.mjs";
import { assertDocumentationArchiveReleaseGate } from "./lib/documentation-archive-release-gate.mjs";

const contractPath = "docs/release/co-2026-003-browser-native-phone-prototype-archive-contract.json";
const schemaPath = "schemas/co-2026-003-browser-native-phone-prototype-archive-contract.schema.json";
const runtimeFiles = Object.freeze([
  "index.html",
  "app.js",
  "data.js",
  "styles.css",
  "manifest.json",
  "assets/NotoSans[wdth,wght].ttf",
]);

function fail(message) {
  throw new Error(message);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function safeRelativePath(value) {
  if (typeof value !== "string" || !value || path.isAbsolute(value) || value.includes("\\") || value.split("/").includes("..") || /[\u0000-\u001f\u007f]/u.test(value)) {
    fail(`небезопасный путь архива: ${String(value)}`);
  }
  return value;
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, safeRelativePath(relativePath)), "utf8"));
}

function readRegularFile(root, relativePath, description) {
  const absolutePath = path.join(root, safeRelativePath(relativePath));
  const stat = fs.lstatSync(absolutePath);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${description} не является обычным файлом: ${relativePath}`);
  return absolutePath;
}

function loadContract(root) {
  const contract = readJson(root, contractPath);
  const schema = readJson(root, schemaPath);
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  if (!validate(contract)) fail(`договор ZIP прототипа не соответствует схеме: ${JSON.stringify(validate.errors)}`);
  return contract;
}

function resolveRuntimeEntries(root, contract) {
  const manifest = readJson(root, `${contract.runtime_root}/manifest.json`);
  const externalFiles = Object.values(manifest.external_asset_sha256 ?? {}).flatMap((assets) => Object.keys(assets));
  const names = [...runtimeFiles, ...externalFiles];
  if (new Set(names).size !== names.length) fail("манифест прототипа содержит дублирующийся внешний ресурс");
  const entries = names.map((name) => {
    safeRelativePath(name);
    const source = path.join(root, contract.runtime_root, name);
    const stat = fs.lstatSync(source);
    if (!stat.isFile() || stat.isSymbolicLink()) fail(`исполняемый ресурс прототипа недоступен: ${name}`);
    return { name, content: fs.readFileSync(source) };
  });
  const license = fs.readFileSync(path.join(root, contract.font_license_path));
  return { entries, manifest, license };
}

function sourceFingerprint(contract, entries, manifest, license) {
  return sha256(Buffer.from(JSON.stringify({
    contract,
    candidate_fingerprint: manifest.candidate_fingerprint,
    entries: entries.map((entry) => ({ name: entry.name, sha256: sha256(entry.content) })),
    license_sha256: sha256(license),
  }), "utf8"));
}

function resolveTimestamp(current, fingerprint, check) {
  if (current) {
    const { entries, timestamp } = readStoredZipWithMetadata(current);
    const archiveManifest = JSON.parse(entries.get("archive-manifest.json")?.toString("utf8") ?? "null");
    if (archiveManifest?.archive_created_at && archiveManifest.source_fingerprint === fingerprint) {
      const expected = dosTimestampFromMoscowReleaseTime(archiveManifest.archive_created_at);
      if (expected.dosTime !== timestamp.dosTime || expected.dosDate !== timestamp.dosDate) fail("время ZIP не совпадает с archive-manifest.json");
      return archiveManifest.archive_created_at;
    }
    if (check) {
      if (!archiveManifest?.archive_created_at) fail("активный ZIP требует выпуска с датой и временем Europe/Moscow");
      return archiveManifest.archive_created_at;
    }
  }
  if (check) fail("ZIP прототипа отсутствует или устарел");
  return createMoscowReleaseTimestamp();
}

function buildArchive(root, contract, archiveCreatedAt) {
  const { entries: runtimeEntries, manifest, license } = resolveRuntimeEntries(root, contract);
  const fingerprint = sourceFingerprint(contract, runtimeEntries, manifest, license);
  const archiveManifest = Buffer.from(`${JSON.stringify({
    version: contract.version,
    archive_id: contract.archive_id,
    archive_created_at: archiveCreatedAt,
    source_fingerprint: fingerprint,
    candidate_fingerprint: manifest.candidate_fingerprint,
    entries: [...runtimeEntries, { name: "OFL.txt", content: license }].map((entry) => ({
      path: entry.name,
      sha256: sha256(entry.content),
      size: entry.content.length,
    })),
  }, null, 2)}\n`, "utf8");
  const readme = Buffer.from("# Браузерный прототип заказа презентации\n\nРаспакуйте архив и откройте `index.html` в обычном браузере. Сеть, исходные PDF и дополнительные материалы не требуются.\n", "utf8");
  return {
    bytes: createStoredZip([
      ...runtimeEntries,
      { name: "OFL.txt", content: license },
      { name: "README.md", content: readme },
      { name: "archive-manifest.json", content: archiveManifest },
    ], { timestamp: dosTimestampFromMoscowReleaseTime(archiveCreatedAt) }),
    fingerprint,
  };
}

function main() {
  const arguments_ = process.argv.slice(2);
  const check = arguments_.length === 1 && arguments_[0] === "--check";
  if (arguments_.length > 0 && !check) fail("поддерживается только аргумент --check");
  const root = process.cwd();
  const contract = loadContract(root);
  assertDocumentationArchiveReleaseGate({
    root,
    contract,
    readJson: (targetRoot, relativePath) => readJson(targetRoot, relativePath),
    readRegularFile,
  });
  const outputPath = path.join(root, contract.output_path);
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath) : null;
  const { entries, manifest, license } = resolveRuntimeEntries(root, contract);
  const fingerprint = sourceFingerprint(contract, entries, manifest, license);
  const archiveCreatedAt = resolveTimestamp(current, fingerprint, check);
  const expected = buildArchive(root, contract, archiveCreatedAt).bytes;
  if (check) {
    if (!current || !current.equals(expected)) fail("ZIP прототипа устарел; выполните команду генерации");
    process.stdout.write("ZIP прототипа актуален\n");
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
  process.stdout.write(`ZIP прототипа записан: ${contract.output_path}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "ZIP прототипа не создан"}\n`);
  process.exitCode = 1;
}
