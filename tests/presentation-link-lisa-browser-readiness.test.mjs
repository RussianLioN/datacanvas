import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browserSpecPath = path.join(root, "tests", "presentation-link-lisa-seven-screen-prototype.browser.spec.mjs");

test("проверка Лисы ждёт готовность PNG каждого кадра и имеет отдельный бюджет для 13 состояний", () => {
  const source = fs.readFileSync(browserSpecPath, "utf8");

  assert.match(source, /function waitForStateImagesReady\(page, expected\)/u);
  assert.match(source, /data-image-ready/u);
  assert.match(source, /data-pending-images/u);
  assert.match(source, /await waitForStateImagesReady\(page, expected\);/u);
  assert.match(source, /page\.goto\(demoUrl\(stateId\), \{ waitUntil: "domcontentloaded" \}\);/u);
  assert.match(source, /page\.goto\(archiveUrl\(expected\.id\), \{ waitUntil: "domcontentloaded" \}\);/u);
  assert.ok((source.match(/test\.slow\(\);/gu) ?? []).length >= 2);
});
