import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { buildDocumentationArchive, readStoredZip, resolveArchiveMembers } from "./lib/documentation-archive.mjs";

const root = process.cwd();
const contractPath = "docs/process/universal-documentation-workflow/documentation-archive-contract.json";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

const contract = readJson(contractPath);
const schema = readJson("schemas/documentation-archive-contract.schema.json");
const chain = readJson(contract.source_chain_path);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);
if (!validate(contract)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("контракт архива не соответствует схеме");
}

const outputPath = path.join(root, contract.output_path);
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
