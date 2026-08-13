import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildDocumentationArchive,
  readStoredZip,
  resolveArchiveMembers,
} from "../scripts/lib/documentation-archive.mjs";

const root = path.resolve(import.meta.dirname, "..");
const contract = JSON.parse(fs.readFileSync(path.join(root, "docs/process/universal-documentation-workflow/documentation-archive-contract.json"), "utf8"));
const chain = JSON.parse(fs.readFileSync(path.join(root, contract.source_chain_path), "utf8"));

const jiraImportArtifacts = [
  {
    path: "docs/process/guides/datacanvas-jira-story-bulk-import.md",
    label: "Руководство по массовому импорту пользовательских историй DataCanvas в Jira",
  },
  {
    path: "artifacts/generated/jira/datacanvas-stories-dc-st-23-dc-st-33.csv",
    label: "Подготовленный CSV для импорта пользовательских историй DataCanvas в Jira",
  },
];

test("контракт включает все основные файлы цепочки и 8 дополнительных материалов", () => {
  const members = resolveArchiveMembers(root, contract, chain);
  const expectedPrimaryCount = chain.stages.reduce((count, stage) => count + stage.primary_artifacts.length, 0);
  assert.equal(members.filter((entry) => entry.role === "primary").length, expectedPrimaryCount);
  assert.equal(members.filter((entry) => entry.role === "derivative").length, 8);
  assert.equal(new Set(members.map((entry) => entry.path)).size, 27);
  assert.ok(members.some((entry) => entry.path.endsWith("datacanvas-backlog-source-sanitized.xlsx")));
  assert.ok(members.some((entry) => entry.path.endsWith("datacanvas-backlog-draft-pshe-2026-07-08.xlsx")));
  for (const expected of jiraImportArtifacts) {
    assert.ok(members.some((entry) => entry.path === expected.path && entry.label === expected.label));
  }
});

test("повторная сборка архива побайтно детерминирована", () => {
  const first = buildDocumentationArchive(root, contract, chain);
  const second = buildDocumentationArchive(root, contract, chain);
  assert.deepEqual(first, second);
});

test("архив содержит локальную навигацию и точные исходные пути", () => {
  const archive = readStoredZip(buildDocumentationArchive(root, contract, chain));
  assert.equal(archive.size, 30);
  for (const required of ["index.html", "README.md", "manifest.json"]) {
    assert.ok(archive.has(required), `нет ${required}`);
  }
  const manifest = JSON.parse(archive.get("manifest.json").toString("utf8"));
  assert.equal(manifest.entries.length, 27);
  for (const entry of manifest.entries) {
    assert.ok(archive.has(`repository/${entry.path}`), `нет repository/${entry.path}`);
  }
  const html = archive.get("index.html").toString("utf8");
  const readme = archive.get("README.md").toString("utf8");
  assert.match(html, /Принятое продуктовое решение/u);
  assert.match(html, /repository\/docs\/product-vision\.md/u);
  for (const expected of jiraImportArtifacts) {
    const markdownLink = `[${expected.label}](repository/${expected.path})`;
    const htmlLink = `<a href="repository/${expected.path}">${expected.label}</a>`;
    assert.ok(readme.includes(markdownLink), `нет ссылки в README.md: ${markdownLink}`);
    assert.ok(html.includes(htmlLink), `нет ссылки в index.html: ${htmlLink}`);
  }
});

test("изменение каждого входного файла меняет байты архива", () => {
  const members = resolveArchiveMembers(root, contract, chain);
  const baseline = buildDocumentationArchive(root, contract, chain);
  for (const member of members) {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-documentation-archive-"));
    try {
      for (const source of members) {
        const target = path.join(tempRoot, source.path);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(path.join(root, source.path), target);
      }
      const changedPath = path.join(tempRoot, member.path);
      fs.appendFileSync(changedPath, Buffer.from([0]));
      const changed = buildDocumentationArchive(tempRoot, contract, chain);
      assert.notDeepEqual(changed, baseline, `изменение не обнаружено: ${member.path}`);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  }
});

test("новый основной файл этапа включается автоматически", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-documentation-archive-primary-"));
  try {
    const members = resolveArchiveMembers(root, contract, chain);
    for (const source of members) {
      const target = path.join(tempRoot, source.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(root, source.path), target);
    }
    const addedPath = "docs/product/new-primary.md";
    fs.mkdirSync(path.dirname(path.join(tempRoot, addedPath)), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, addedPath), "# Новый основной документ\n");
    const changedChain = structuredClone(chain);
    changedChain.stages[0].primary_artifacts.push(addedPath);
    const resolved = resolveArchiveMembers(tempRoot, contract, changedChain);
    assert.equal(resolved.filter((entry) => entry.role === "primary").length, members.filter((entry) => entry.role === "primary").length + 1);
    assert.ok(resolved.some((entry) => entry.path === addedPath));
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("небезопасные и дублирующиеся пути блокируются", () => {
  const unsafeChain = structuredClone(chain);
  unsafeChain.stages[0].primary_artifacts.push("../outside.md");
  assert.throws(() => resolveArchiveMembers(root, contract, unsafeChain), /выходит за корень/u);

  const duplicateContract = structuredClone(contract);
  duplicateContract.additional_artifacts.push({
    path: chain.stages[0].primary_artifacts[0],
    label: "Дубликат",
  });
  assert.throws(() => resolveArchiveMembers(root, duplicateContract, chain), /дублирующийся путь/u);

  const missingContract = structuredClone(contract);
  missingContract.additional_artifacts.push({
    path: "docs/product/missing-document.md",
    label: "Отсутствующий документ",
  });
  assert.throws(() => resolveArchiveMembers(root, missingContract, chain), /вход архива отсутствует/u);
});
