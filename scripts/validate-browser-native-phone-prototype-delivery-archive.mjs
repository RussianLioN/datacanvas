import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { webkit } from "@playwright/test";

import { readStoredZip } from "./lib/documentation-archive.mjs";

const root = path.resolve(import.meta.dirname, "..");
const contractPath = path.join(root, "docs/release/co-2026-003-prototype-delivery-archive-contract.json");
const browserRoot = "docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/browser-native-phone-prototype";

function fail(message) {
  throw new Error(`browser-native-phone-delivery-archive: ${message}`);
}

function json(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function archiveMemberPath(relativePath) {
  return `repository/${relativePath}`;
}

function safeArchivePath(value) {
  if (!value || path.isAbsolute(value) || value.includes("\\") || value.split("/").includes("..")) fail(`небезопасный путь в архиве: ${value}`);
}

async function main() {
  const contract = json(contractPath);
  const archivePath = path.join(root, contract.output_path);
  if (!fs.existsSync(archivePath)) fail("архив поставки отсутствует");
  const archive = readStoredZip(fs.readFileSync(archivePath));
  const browserContract = json(path.join(root, `${browserRoot.replace("candidate-evidence/browser-native-phone-prototype", "source/browser-native-phone-prototype")}/browser-native-phone-prototype-contract.json`));
  const required = ["index.html", "app.js", "data.js", "styles.css", "manifest.json", "assets/NotoSans[wdth,wght].ttf"];
  for (const stateId of browserContract.external_state_ids) required.push(...browserContract.external_state_rules[stateId].runtime_asset_paths);
  for (const filePath of required) {
    const memberPath = archiveMemberPath(`${browserRoot}/${filePath}`);
    if (!archive.has(memberPath)) fail(`архив не содержит исполняемый ресурс: ${memberPath}`);
  }
  for (const name of archive.keys()) {
    if (/\.pdf$/iu.test(name) || name.includes("/Users/") || name.includes("file://")) fail(`архив содержит запрещённые данные: ${name}`);
  }

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-browser-native-delivery-"));
  let browser;
  let context;
  try {
    for (const [name, content] of archive) {
      safeArchivePath(name);
      const target = path.join(temporaryRoot, name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
    browser = await webkit.launch({ headless: true });
    context = await browser.newContext({ locale: "ru-RU", viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const requests = [];
    const errors = [];
    page.on("request", (request) => requests.push(request.url()));
    page.on("pageerror", (error) => errors.push(error.message));
    const target = pathToFileURL(path.join(temporaryRoot, "repository", browserRoot, "index.html"));
    target.searchParams.set("state", "lisa-presentation-mag");
    await page.goto(target.href, { waitUntil: "load" });
    await page.waitForFunction(() => {
      const image = document.querySelector("[data-testid='external-stage'] img");
      return Boolean(image?.complete && image.naturalWidth === 3840 && image.naturalHeight === 2160);
    });
    if (requests.some((url) => !url.startsWith("file:")) || errors.length > 0) fail("распакованный прототип попытался использовать сеть или завершился ошибкой страницы");
    await page.goto(pathToFileURL(path.join(temporaryRoot, "repository", browserRoot, "index.html")).href, { waitUntil: "load" });
    await page.waitForSelector("[data-testid='phone-assembly']");
    process.stdout.write("Архив поставки открыт в WebKit как самостоятельный браузерный прототип\n");
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

try {
  await main();
} catch (error) {
  process.stderr.write(`ERROR: ${error instanceof Error ? error.message : "проверка переносимости не выполнена"}\n`);
  process.exitCode = 1;
}
