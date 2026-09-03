import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { readStoredZipWithMetadata } from "../scripts/lib/documentation-archive.mjs";

const root = path.resolve(import.meta.dirname, "..");
const contractPath = "docs/release/co-2026-003-browser-native-phone-prototype-archive-contract.json";
const generatorPath = "scripts/generate-browser-native-phone-prototype-archive.mjs";
const runtimeRoot = "docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/browser-native-phone-prototype";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function runGenerator(...arguments_) {
  return spawnSync(process.execPath, [path.join(root, generatorPath), ...arguments_], {
    cwd: root,
    encoding: "utf8",
  });
}

test("отдельный ZIP прототипа открывается из корневого index.html и содержит только разрешённые ресурсы", () => {
  const checked = runGenerator("--check");
  assert.equal(checked.status, 0, `${checked.stdout}\n${checked.stderr}`);

  const contract = readJson(contractPath);
  assert.equal(contract.release_gate.prototype_check, "browser_native_phone_prototype");
  assert.equal(contract.release_gate.required_final_release_status, "owner_final_approved");
  const sourceManifest = readJson(`${runtimeRoot}/manifest.json`);
  const archivePath = path.join(root, contract.output_path);
  const { entries, timestamp } = readStoredZipWithMetadata(fs.readFileSync(archivePath));
  const required = new Set([
    "index.html",
    "app.js",
    "data.js",
    "styles.css",
    "manifest.json",
    "OFL.txt",
    "README.md",
    "archive-manifest.json",
    "assets/NotoSans[wdth,wght].ttf",
    ...Object.values(sourceManifest.external_asset_sha256).flatMap((assets) => Object.keys(assets)),
  ]);

  assert.deepEqual(new Set(entries.keys()), required);
  assert.match(entries.get("README.md").toString("utf8"), /распакуйте.*index\.html/iu);
  assert.match(entries.get("archive-manifest.json").toString("utf8"), /archive_created_at/u);
  assert.match(timestamp.archive_created_at, /^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+03:00$/u);
  for (const [name, content] of entries) {
    assert.doesNotMatch(name, /(^|\/)(docs|source|derived|frame-review)(\/|$)|\.pdf$/iu);
    const text = /\.(?:html|js|css|json|md|svg)$/iu.test(name) ? content.toString("utf8") : "";
    assert.doesNotMatch(text, /file:\/\/|\/Users\//u, name);
  }
});
