import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";
import { webkit } from "@playwright/test";

import { readStoredZip } from "./lib/documentation-archive.mjs";

const root = path.resolve(import.meta.dirname, "..");
const contractPath = "docs/release/co-2026-003-prototype-delivery-archive-contract.json";
const browserRoot = "docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/browser-native-phone-prototype";

function fail(message) {
  throw new Error(`browser-native-phone-delivery-archive: ${message}`);
}

function safeRelativePath(value, description) {
  if (!value || path.isAbsolute(value) || value.includes("\\") || value.split("/").includes("..")) {
    fail(`небезопасный путь ${description}: ${value}`);
  }
  return value;
}

function json(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, safeRelativePath(relativePath, "JSON")), "utf8"));
}

function parseArguments(arguments_) {
  let archivePath = null;
  for (let index = 0; index < arguments_.length; index += 1) {
    if (arguments_[index] !== "--archive") fail(`неизвестный аргумент: ${arguments_[index]}`);
    if (archivePath !== null) fail("аргумент --archive указан больше одного раза");
    const value = arguments_[index + 1];
    if (!value || value.startsWith("--")) fail("после --archive требуется относительный путь");
    archivePath = value;
    index += 1;
  }
  return archivePath;
}

function archiveMemberPath(relativePath) {
  return `repository/${relativePath}`;
}

function safeExtractionPath(directory, name) {
  safeRelativePath(name, "в ZIP");
  const target = path.resolve(directory, name);
  if (!target.startsWith(`${path.resolve(directory)}${path.sep}`)) fail(`путь выходит за каталог распаковки: ${name}`);
  return target;
}

async function verifyRootLaunch(page, temporaryRoot, browserContract) {
  await page.goto(pathToFileURL(path.join(temporaryRoot, "index.html")).href, { waitUntil: "load" });
  const expectedState = browserContract.phone_state_ids[0];
  await page.waitForFunction((stateId) => {
    const phone = document.querySelector("[data-testid='phone-assembly']");
    return phone?.dataset.stateId === stateId;
  }, expectedState);
}

async function verifyPhoneStates(page, runtimeIndex, browserContract) {
  for (const stateId of browserContract.phone_state_ids) {
    const target = pathToFileURL(runtimeIndex);
    target.searchParams.set("state", stateId);
    await page.goto(target.href, { waitUntil: "load" });
    await page.waitForFunction((expectedStateId) => {
      const phone = document.querySelector("[data-testid='phone-assembly']");
      return phone?.dataset.stateId === expectedStateId;
    }, stateId);
  }
}

async function verifyExternalStates(page, runtimeIndex, browserContract) {
  let checkedPages = 0;
  for (const stateId of browserContract.external_state_ids) {
    const rule = browserContract.external_state_rules[stateId];
    if (!rule) fail(`в договоре нет правила внешнего состояния: ${stateId}`);
    for (let pageIndex = 0; pageIndex < rule.page_count; pageIndex += 1) {
      const target = pathToFileURL(runtimeIndex);
      target.searchParams.set("state", stateId);
      target.searchParams.set("page", String(pageIndex));
      await page.goto(target.href, { waitUntil: "load" });
      await page.waitForFunction(({ expectedStateId, expectedPage, width, height }) => {
        const stage = document.querySelector("[data-testid='external-stage']");
        const image = stage?.querySelector("img");
        return stage?.dataset.stateId === expectedStateId &&
          stage.dataset.page === String(expectedPage) &&
          Boolean(image?.complete && image.naturalWidth === width && image.naturalHeight === height);
      }, {
        expectedStateId: stateId,
        expectedPage: pageIndex,
        width: rule.intrinsic_page.width,
        height: rule.intrinsic_page.height,
      });
      checkedPages += 1;
    }
  }
  return checkedPages;
}

async function main() {
  const archivePathOverride = parseArguments(process.argv.slice(2));
  const contract = json(contractPath);
  const archiveRelativePath = safeRelativePath(archivePathOverride ?? contract.output_path, "архива поставки");
  const archivePath = path.join(root, archiveRelativePath);
  if (!fs.existsSync(archivePath)) fail("архив поставки отсутствует");
  const archive = readStoredZip(fs.readFileSync(archivePath));
  const browserContract = json(`${browserRoot.replace("candidate-evidence/browser-native-phone-prototype", "source/browser-native-phone-prototype")}/browser-native-phone-prototype-contract.json`);
  const required = ["index.html", "app.js", "data.js", "styles.css", "manifest.json", "assets/NotoSans[wdth,wght].ttf"];
  for (const stateId of browserContract.external_state_ids) required.push(...browserContract.external_state_rules[stateId].runtime_asset_paths);
  for (const filePath of required) {
    const memberPath = archiveMemberPath(`${browserRoot}/${filePath}`);
    if (!archive.has(memberPath)) fail(`архив не содержит исполняемый ресурс: ${memberPath}`);
  }
  if (!archive.has("index.html")) fail("в корне архива нет стартовой страницы");
  for (const name of archive.keys()) {
    if (/\.(?:pdf|xlsx)$/iu.test(name) || name.includes("/Users/") || name.includes("file://")) {
      fail(`архив содержит запрещённые данные: ${name}`);
    }
  }

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-browser-native-delivery-"));
  let browser;
  let context;
  try {
    for (const [name, content] of archive) {
      const target = safeExtractionPath(temporaryRoot, name);
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
    await verifyRootLaunch(page, temporaryRoot, browserContract);
    const runtimeIndex = path.join(temporaryRoot, "repository", browserRoot, "index.html");
    await verifyPhoneStates(page, runtimeIndex, browserContract);
    const checkedExternalPages = await verifyExternalStates(page, runtimeIndex, browserContract);
    if (requests.some((url) => !url.startsWith("file:")) || errors.length > 0) {
      fail("распакованный прототип попытался использовать сеть или завершился ошибкой страницы");
    }
    const expectedExternalPages = browserContract.external_state_ids
      .reduce((count, stateId) => count + browserContract.external_state_rules[stateId].page_count, 0);
    if (checkedExternalPages !== expectedExternalPages) fail("проверено неверное число внешних страниц");
    process.stdout.write(`Архив поставки открыт локально: ${browserContract.phone_state_ids.length + browserContract.external_state_ids.length} состояний, ${checkedExternalPages} внешних страниц\n`);
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
