import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildDocumentationArchive,
  createStoredZip,
  readStoredZip,
  resolveArchiveMembers,
} from "../scripts/lib/documentation-archive.mjs";

const root = path.resolve(import.meta.dirname, "..");
const contract = JSON.parse(fs.readFileSync(path.join(root, "docs/process/universal-documentation-workflow/documentation-archive-contract.json"), "utf8"));
const chain = JSON.parse(fs.readFileSync(path.join(root, contract.source_chain_path), "utf8"));

test("контракт включает все основные файлы цепочки и 6 производных", () => {
  const members = resolveArchiveMembers(root, contract, chain);
  const expectedPrimaryCount = chain.stages.reduce((count, stage) => count + stage.primary_artifacts.length, 0);
  assert.equal(members.filter((entry) => entry.role === "primary").length, expectedPrimaryCount);
  assert.equal(members.filter((entry) => entry.role === "derivative").length, 6);
  assert.equal(new Set(members.map((entry) => entry.path)).size, 25);
  assert.ok(members.some((entry) => entry.path.endsWith("datacanvas-backlog-source-sanitized.xlsx")));
  assert.ok(members.some((entry) => entry.path.endsWith("datacanvas-backlog-draft-pshe-2026-07-08.xlsx")));
});

test("повторная сборка архива побайтно детерминирована", () => {
  const first = buildDocumentationArchive(root, contract, chain);
  const second = buildDocumentationArchive(root, contract, chain);
  assert.deepEqual(first, second);
});

test("архив содержит локальную навигацию и точные исходные пути", () => {
  const archive = readStoredZip(buildDocumentationArchive(root, contract, chain));
  assert.equal(archive.size, 28);
  for (const required of ["index.html", "README.md", "manifest.json"]) {
    assert.ok(archive.has(required), `нет ${required}`);
  }
  const manifest = JSON.parse(archive.get("manifest.json").toString("utf8"));
  assert.equal(manifest.entries.length, 25);
  for (const entry of manifest.entries) {
    assert.ok(archive.has(`repository/${entry.path}`), `нет repository/${entry.path}`);
  }
  const html = archive.get("index.html").toString("utf8");
  assert.match(html, /Принятое продуктовое решение/u);
  assert.match(html, /repository\/docs\/product-vision\.md/u);
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

test("сборщик ZIP отклоняет непереносимые имена членов", () => {
  const unsafeNames = [
    "C:/outside.txt",
    "C:outside.txt",
    "file.txt:stream",
    "a.js\0.bin",
    "a.js\n.bin",
  ];
  for (const name of unsafeNames) {
    assert.throws(
      () => createStoredZip([{ name, content: Buffer.from("x", "utf8") }]),
      /небезопасный путь архива/u,
      name,
    );
  }
});

test("ошибка небезопасного имени ZIP не содержит сырой управляющий символ", () => {
  const name = "a.js\n.bin";
  assert.throws(
    () => createStoredZip([{ name, content: Buffer.from("x", "utf8") }]),
    (error) => {
      assert.match(error.message, /\\n/u);
      assert.doesNotMatch(error.message, /[\u0000-\u001f\u007f]/u);
      return true;
    },
  );
});

test("сборщик и разборщик ZIP сохраняют кириллицу и пробелы в переносимом пути", () => {
  const name = "demo/Экран Лисы 01.txt";
  const content = Buffer.from("проверка\n", "utf8");
  const archive = readStoredZip(createStoredZip([{ name, content }]));
  assert.deepEqual(archive.get(name), content);
});

function signatureOffset(buffer, bytes) {
  const offset = buffer.indexOf(Buffer.from(bytes));
  assert.ok(offset >= 0, `сигнатура ${bytes.join(" ")} не найдена`);
  return offset;
}

function insertByte(buffer, offset, value = 0) {
  return Buffer.concat([
    buffer.subarray(0, offset),
    Buffer.from([value]),
    buffer.subarray(offset),
  ]);
}

function replaceBothArchiveNames(original, replacement) {
  const replacementBytes = Buffer.isBuffer(replacement)
    ? replacement
    : Buffer.from(replacement, "utf8");
  const localNameLength = original.readUInt16LE(26);
  const centralOffset = signatureOffset(original, [0x50, 0x4b, 0x01, 0x02]);
  const centralNameLength = original.readUInt16LE(centralOffset + 28);
  assert.equal(replacementBytes.length, localNameLength);
  assert.equal(replacementBytes.length, centralNameLength);
  const changed = Buffer.from(original);
  replacementBytes.copy(changed, 30);
  replacementBytes.copy(changed, centralOffset + 46);
  return changed;
}

function replaceLocalArchiveName(original, replacementBytes) {
  const localNameLength = original.readUInt16LE(26);
  const centralOffset = signatureOffset(original, [0x50, 0x4b, 0x01, 0x02]);
  const endOffset = signatureOffset(original, [0x50, 0x4b, 0x05, 0x06]);
  const changed = Buffer.concat([
    original.subarray(0, 30),
    replacementBytes,
    original.subarray(30 + localNameLength),
  ]);
  const delta = replacementBytes.length - localNameLength;
  changed.writeUInt16LE(replacementBytes.length, 26);
  changed.writeUInt32LE(centralOffset + delta, endOffset + delta + 16);
  return changed;
}

function replaceCentralArchiveName(original, replacementBytes) {
  const centralOffset = signatureOffset(original, [0x50, 0x4b, 0x01, 0x02]);
  const endOffset = signatureOffset(original, [0x50, 0x4b, 0x05, 0x06]);
  const centralNameLength = original.readUInt16LE(centralOffset + 28);
  const centralNameStart = centralOffset + 46;
  const changed = Buffer.concat([
    original.subarray(0, centralNameStart),
    replacementBytes,
    original.subarray(centralNameStart + centralNameLength),
  ]);
  const delta = replacementBytes.length - centralNameLength;
  changed.writeUInt16LE(replacementBytes.length, centralOffset + 28);
  changed.writeUInt32LE(
    original.readUInt32LE(endOffset + 12) + delta,
    endOffset + delta + 12,
  );
  return changed;
}

test("разборщик ZIP отклоняет пути Windows, двоеточие и управляющие символы", () => {
  const cases = [
    ["ok/outside.txt", "C:/outside.txt"],
    ["a/outside.txt", "C:outside.txt"],
    ["file.txt-ads", "file.txt:ads"],
    ["a.js-.bin", "a.js\0.bin"],
    ["a.js-.bin", "a.js\n.bin"],
  ];
  for (const [safeName, unsafeName] of cases) {
    const original = createStoredZip([
      { name: safeName, content: Buffer.from("x", "utf8") },
    ]);
    const changed = replaceBothArchiveNames(original, unsafeName);
    assert.throws(
      () => readStoredZip(changed),
      /небезопасный путь архива/u,
      unsafeName,
    );
  }
});

test("разборщик ZIP строго проверяет UTF-8 локального имени", () => {
  const original = createStoredZip([
    { name: "�.js", content: Buffer.from("x", "utf8") },
  ]);
  const changed = replaceLocalArchiveName(
    original,
    Buffer.concat([Buffer.from([0x80]), Buffer.from(".js", "ascii")]),
  );
  assert.throws(() => readStoredZip(changed), /UTF-8.*локальн/u);
});

test("разборщик ZIP строго проверяет UTF-8 центрального имени", () => {
  const original = createStoredZip([
    { name: "�.js", content: Buffer.from("x", "utf8") },
  ]);
  const changed = replaceCentralArchiveName(
    original,
    Buffer.concat([Buffer.from([0x80]), Buffer.from(".js", "ascii")]),
  );
  assert.throws(() => readStoredZip(changed), /UTF-8.*центральн/u);
});

test("разборщик отклоняет неканоничные версии, флаги, время и атрибуты ZIP", () => {
  const original = createStoredZip([
    { name: "README.md", content: Buffer.from("проверка\n", "utf8") },
  ]);
  const centralOffset = signatureOffset(original, [0x50, 0x4b, 0x01, 0x02]);
  const cases = [
    ["версия локальной записи", (bytes) => bytes.writeUInt16LE(19, 4)],
    ["флаги локальной записи", (bytes) => bytes.writeUInt16LE(0, 6)],
    ["метод локальной записи", (bytes) => bytes.writeUInt16LE(8, 8)],
    ["время локальной записи", (bytes) => bytes.writeUInt16LE(1, 10)],
    ["дата локальной записи", (bytes) => bytes.writeUInt16LE(0, 12)],
    ["версия создателя", (bytes) => bytes.writeUInt16LE(20, centralOffset + 4)],
    ["версия центральной записи", (bytes) => bytes.writeUInt16LE(19, centralOffset + 6)],
    ["флаги центральной записи", (bytes) => bytes.writeUInt16LE(0, centralOffset + 8)],
    ["метод центральной записи", (bytes) => bytes.writeUInt16LE(8, centralOffset + 10)],
    ["время центральной записи", (bytes) => bytes.writeUInt16LE(1, centralOffset + 12)],
    ["дата центральной записи", (bytes) => bytes.writeUInt16LE(0, centralOffset + 14)],
    ["номер диска центральной записи", (bytes) => bytes.writeUInt16LE(1, centralOffset + 34)],
    ["внутренние атрибуты", (bytes) => bytes.writeUInt16LE(1, centralOffset + 36)],
    ["внешние атрибуты", (bytes) => bytes.writeUInt32LE(0, centralOffset + 38)],
  ];

  for (const [label, mutate] of cases) {
    const changed = Buffer.from(original);
    mutate(changed);
    assert.throws(
      () => readStoredZip(changed),
      label === "метод локальной записи" ? /сжатие/u : /неканонич/u,
      label,
    );
  }
});

test("разборщик отклоняет дополнительные поля и комментарии ZIP", () => {
  const original = createStoredZip([
    { name: "README.md", content: Buffer.from("проверка\n", "utf8") },
  ]);
  const originalCentralOffset = signatureOffset(original, [0x50, 0x4b, 0x01, 0x02]);
  const originalEndOffset = signatureOffset(original, [0x50, 0x4b, 0x05, 0x06]);
  const localNameLength = original.readUInt16LE(26);
  const centralNameLength = original.readUInt16LE(originalCentralOffset + 28);

  const localExtraOffset = 30 + localNameLength;
  const localExtra = insertByte(original, localExtraOffset);
  localExtra.writeUInt16LE(1, 28);
  localExtra.writeUInt32LE(originalCentralOffset + 1, originalEndOffset + 1 + 16);
  assert.throws(() => readStoredZip(localExtra), /неканонич/u);

  const centralExtraOffset = originalCentralOffset + 46 + centralNameLength;
  const centralExtra = insertByte(original, centralExtraOffset);
  centralExtra.writeUInt16LE(1, originalCentralOffset + 30);
  centralExtra.writeUInt32LE(
    original.readUInt32LE(originalEndOffset + 12) + 1,
    originalEndOffset + 1 + 12,
  );
  assert.throws(() => readStoredZip(centralExtra), /неканонич/u);

  const centralComment = insertByte(original, centralExtraOffset);
  centralComment.writeUInt16LE(1, originalCentralOffset + 32);
  centralComment.writeUInt32LE(
    original.readUInt32LE(originalEndOffset + 12) + 1,
    originalEndOffset + 1 + 12,
  );
  assert.throws(() => readStoredZip(centralComment), /неканонич/u);

  const endComment = Buffer.concat([original, Buffer.from([0])]);
  endComment.writeUInt16LE(1, originalEndOffset + 20);
  assert.throws(() => readStoredZip(endComment), /неканонич/u);
});

test("разборщик требует одинаковый порядок локальных и центральных записей ZIP", () => {
  const original = createStoredZip([
    { name: "a.txt", content: Buffer.from("a", "utf8") },
    { name: "b.txt", content: Buffer.from("b", "utf8") },
  ]);
  const centralOffset = signatureOffset(original, [0x50, 0x4b, 0x01, 0x02]);
  const endOffset = signatureOffset(original, [0x50, 0x4b, 0x05, 0x06]);
  const firstLength = 46 + original.readUInt16LE(centralOffset + 28);
  const changed = Buffer.concat([
    original.subarray(0, centralOffset),
    original.subarray(centralOffset + firstLength, endOffset),
    original.subarray(centralOffset, centralOffset + firstLength),
    original.subarray(endOffset),
  ]);
  assert.throws(() => readStoredZip(changed), /порядок.*центральн/u);
});

test("разборщик отклоняет безопасное расхождение имени и данные после ZIP", () => {
  const original = createStoredZip([
    { name: "README.md", content: Buffer.from("проверка\n", "utf8") },
  ]);
  const centralOffset = signatureOffset(original, [0x50, 0x4b, 0x01, 0x02]);
  const changedName = Buffer.from(original);
  changedName.write("READMZ.md", centralOffset + 46, "utf8");
  assert.throws(
    () => readStoredZip(changedName),
    /имя центрального каталога не совпадает/u,
  );
  assert.throws(
    () => readStoredZip(Buffer.concat([original, Buffer.from([0])])),
    /лишние данные/u,
  );
});
