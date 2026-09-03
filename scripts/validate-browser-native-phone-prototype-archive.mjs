import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";
import { chromium, webkit } from "@playwright/test";

import { readStoredZipWithMetadata } from "./lib/documentation-archive.mjs";
import { assertDocumentationArchiveReleaseGate } from "./lib/documentation-archive-release-gate.mjs";

const root = path.resolve(import.meta.dirname, "..");
const contractPath = "docs/release/co-2026-003-browser-native-phone-prototype-archive-contract.json";

function fail(message) {
  throw new Error(`browser-native-phone-prototype-archive: ${message}`);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function readRegularFile(targetRoot, relativePath, description) {
  const normalized = path.posix.normalize(relativePath);
  if (!relativePath || path.isAbsolute(relativePath) || normalized !== relativePath || normalized.startsWith("../") || relativePath.includes("\\")) {
    fail(`небезопасный путь ${description}: ${relativePath}`);
  }
  const target = path.resolve(targetRoot, relativePath);
  if (!target.startsWith(`${path.resolve(targetRoot)}${path.sep}`)) fail(`путь выходит за рабочую копию: ${relativePath}`);
  const stat = fs.lstatSync(target);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${description} не является обычным файлом: ${relativePath}`);
  return target;
}

function safeTarget(directory, name) {
  if (!name || path.isAbsolute(name) || name.includes("\\") || name.split("/").includes("..")) fail(`небезопасный путь в ZIP: ${name}`);
  const target = path.resolve(directory, name);
  if (!target.startsWith(`${path.resolve(directory)}${path.sep}`)) fail(`путь выходит за каталог распаковки: ${name}`);
  return target;
}

async function verifyBrowser(kind, executable, temporaryRoot, contract) {
  const browser = await executable.launch({ headless: true });
  let context;
  try {
    context = await browser.newContext({ locale: "ru-RU", viewport: { width: 3840, height: 2160 } });
    const page = await context.newPage();
    const requests = [];
    const errors = [];
    page.on("request", (request) => requests.push(request.url()));
    page.on("pageerror", (error) => errors.push(error.message));
    const runtimeManifest = readJson(`${contract.runtime_root}/manifest.json`);
    const phoneStates = runtimeManifest.phone_state_ids;
    const externalStates = runtimeManifest.external_state_ids;
    for (const state of phoneStates) {
      const url = pathToFileURL(path.join(temporaryRoot, "index.html"));
      url.searchParams.set("state", state);
      await page.goto(url.href, { waitUntil: "load" });
      await page.waitForSelector("[data-testid='phone-assembly']");
    }
    for (const state of externalStates) {
      const pages = state === "lisa-presentation-email" ? 1 : 3;
      for (let index = 0; index < pages; index += 1) {
        const url = pathToFileURL(path.join(temporaryRoot, "index.html"));
        url.searchParams.set("state", state);
        url.searchParams.set("page", String(index));
        await page.goto(url.href, { waitUntil: "load" });
        await page.waitForSelector("[data-testid='external-stage'] img");
      }
    }
    if (requests.some((url) => !url.startsWith("file:")) || errors.length > 0) fail(`${kind}: прототип использует сеть или завершился ошибкой`);
  } finally {
    if (context) await context.close();
    await browser.close();
  }
}

async function main() {
  const contract = readJson(contractPath);
  assertDocumentationArchiveReleaseGate({
    root,
    contract,
    readJson: (targetRoot, relativePath) => JSON.parse(fs.readFileSync(readRegularFile(targetRoot, relativePath, "JSON-источник"), "utf8")),
    readRegularFile,
  });
  const archivePath = path.join(root, contract.output_path);
  if (!fs.existsSync(archivePath)) fail("ZIP отсутствует");
  const { entries, timestamp } = readStoredZipWithMetadata(fs.readFileSync(archivePath));
  const archiveManifest = JSON.parse(entries.get("archive-manifest.json")?.toString("utf8") ?? "null");
  if (!archiveManifest?.archive_created_at || !timestamp.archive_created_at) fail("не задано время выпуска Europe/Moscow");
  if (entries.has("repository/index.html") || [...entries.keys()].some((name) => /(^|\/)(docs|source|derived|frame-review)(\/|$)|\.pdf$/iu.test(name))) fail("ZIP содержит посторонние материалы");
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-prototype-archive-"));
  try {
    for (const [name, content] of entries) {
      const target = safeTarget(temporaryRoot, name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
    await verifyBrowser("Chromium", chromium, temporaryRoot, contract);
    await verifyBrowser("WebKit", webkit, temporaryRoot, contract);
    process.stdout.write("ZIP прототипа проверен: корневой запуск, 11 кадров и все страницы презентаций\n");
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

try {
  await main();
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "проверка ZIP не выполнена"}\n`);
  process.exitCode = 1;
}
