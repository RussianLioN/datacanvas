import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as journeyGenerator from "./presentation-link-lisa-user-journey.mjs";
import { generateEvidence as defaultGenerateEvidence } from "../update-presentation-link-lisa-user-journey-evidence.mjs";
import { validateEvidencePackage as defaultValidateEvidencePackage } from "../validate-presentation-link-lisa-user-journey-evidence.mjs";

const RELEASE_LOCK_BASENAME = ".presentation-link-lisa-full-package-release.lock";
const CANDIDATE_PREFIX = ".presentation-link-lisa-full-package-candidate-";
const BACKUP_PREFIX = ".presentation-link-lisa-full-package-backup-";
const FAILED_PREFIX = ".presentation-link-lisa-full-package-failed-";
const JOURNAL_SUFFIX = ".full-package-release.json";
const GENERATED_TOP_LEVEL_ENTRIES = new Set(["demo", "derived", "evidence"]);

export const DEFAULT_FULL_PACKAGE_TOOLCHAIN_PATHS = Object.freeze([
  "package.json",
  "package-lock.json",
  "scripts/capture-presentation-link-lisa-derived-frames.mjs",
  "scripts/capture-presentation-link-lisa-runtime-evidence.mjs",
  "scripts/generate-presentation-link-lisa-user-journey.mjs",
  "scripts/update-presentation-link-lisa-user-journey-evidence.mjs",
  "scripts/validate-presentation-link-lisa-user-journey-evidence.mjs",
  "scripts/lib/documentation-archive.mjs",
  "scripts/lib/presentation-link-lisa-canonical-raster.mjs",
  "scripts/lib/presentation-link-lisa-html-runtime.mjs",
  "scripts/lib/presentation-link-lisa-user-journey.mjs",
  "tests/presentation-link-lisa-user-journey-evidence.test.mjs",
  "tests/presentation-link-lisa-user-journey.browser.spec.mjs",
  "tests/presentation-link-lisa-user-journey.playwright.config.mjs",
]);

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function safeRelativePath(relativePath, label) {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    path.isAbsolute(relativePath) ||
    relativePath.includes("\0") ||
    relativePath.split(path.sep).some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new Error(`${label} небезопасен: ${String(relativePath)}`);
  }
}

function assertRegularDirectory(directory, label) {
  const stat = fs.lstatSync(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`${label} должен быть обычным каталогом`);
  }
}

function collectRegularFiles(directory, relativeDirectory = "") {
  const current = path.join(directory, relativeDirectory);
  const files = [];
  for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name, "en"))) {
    const relativePath = path.join(relativeDirectory, entry.name);
    const target = path.join(directory, relativePath);
    const stat = fs.lstatSync(target);
    if (stat.isSymbolicLink()) {
      throw new Error(`символическая ссылка запрещена: ${relativePath}`);
    }
    if (stat.isDirectory()) {
      files.push(...collectRegularFiles(directory, relativePath));
      continue;
    }
    if (!stat.isFile()) {
      throw new Error(`неподдерживаемый тип входа: ${relativePath}`);
    }
    files.push(relativePath);
  }
  return files;
}

function manualPackageEntries(packageRoot) {
  assertRegularDirectory(packageRoot, "активный пакет");
  return fs.readdirSync(packageRoot, { withFileTypes: true })
    .filter((entry) => !GENERATED_TOP_LEVEL_ENTRIES.has(entry.name))
    .sort((left, right) => left.name.localeCompare(right.name, "en"));
}

function copyRegularTree(source, target) {
  const stat = fs.lstatSync(source);
  if (stat.isSymbolicLink()) {
    throw new Error(`символическая ссылка запрещена: ${source}`);
  }
  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(source, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name, "en"))) {
      copyRegularTree(path.join(source, entry.name), path.join(target, entry.name));
    }
    return;
  }
  if (!stat.isFile()) {
    throw new Error(`неподдерживаемый тип входа: ${source}`);
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
}

function inputRecord(root, relativePath, group) {
  const target = path.join(root, relativePath);
  const stat = fs.lstatSync(target);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`${group} должен быть обычным файлом: ${relativePath}`);
  }
  return {
    group,
    path: relativePath.split(path.sep).join("/"),
    bytes: stat.size,
    sha256: sha256File(target),
  };
}

function packageInputRecords(packageRoot) {
  const records = [];
  for (const entry of manualPackageEntries(packageRoot)) {
    const source = path.join(packageRoot, entry.name);
    const stat = fs.lstatSync(source);
    if (stat.isSymbolicLink()) {
      throw new Error(`символическая ссылка запрещена: ${entry.name}`);
    }
    if (stat.isFile()) {
      records.push(inputRecord(packageRoot, entry.name, "package"));
      continue;
    }
    if (!stat.isDirectory()) {
      throw new Error(`неподдерживаемый вход пакета: ${entry.name}`);
    }
    for (const relativePath of collectRegularFiles(source)) {
      records.push(inputRecord(packageRoot, path.join(entry.name, relativePath), "package"));
    }
  }
  return records;
}

function assertSameFilesystem(left, right, label) {
  if (fs.statSync(left).dev !== fs.statSync(right).dev) {
    throw new Error(`${label} должен находиться в той же файловой системе, что и активный пакет`);
  }
}

export function snapshotFullPackageInputs({
  root,
  packageRoot,
  toolchainPaths = [],
}) {
  if (!root || !packageRoot) {
    throw new Error("для снимка входов нужны корень и активный пакет");
  }
  const records = packageInputRecords(packageRoot);
  for (const relativePath of [...toolchainPaths].sort((left, right) => left.localeCompare(right, "en"))) {
    safeRelativePath(relativePath, "путь инструмента");
    records.push(inputRecord(root, relativePath, "toolchain"));
  }
  records.sort((left, right) => `${left.group}/${left.path}`.localeCompare(`${right.group}/${right.path}`, "en"));
  return { version: "1.0.0", records };
}

export function sameFullPackageInputSnapshots(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function createFullPackageCandidate({
  root,
  packageRoot,
  toolchainPaths = [],
}) {
  if (!root || !packageRoot) {
    throw new Error("для кандидата полного выпуска нужны корень и активный пакет");
  }
  const resolvedRoot = path.resolve(root);
  const resolvedPackageRoot = path.resolve(packageRoot);
  const packageRelativePath = path.relative(resolvedRoot, resolvedPackageRoot);
  safeRelativePath(packageRelativePath, "путь пакета относительно корня");
  assertRegularDirectory(resolvedPackageRoot, "активный пакет");
  const candidateRoot = fs.mkdtempSync(
    path.join(path.dirname(resolvedPackageRoot), CANDIDATE_PREFIX),
  );
  const candidatePackageRoot = path.join(candidateRoot, packageRelativePath);
  try {
    assertSameFilesystem(candidateRoot, resolvedPackageRoot, "кандидат полного выпуска");
    fs.mkdirSync(candidatePackageRoot, { recursive: true });
    for (const entry of manualPackageEntries(resolvedPackageRoot)) {
      copyRegularTree(
        path.join(resolvedPackageRoot, entry.name),
        path.join(candidatePackageRoot, entry.name),
      );
    }
    for (const relativePath of toolchainPaths) {
      safeRelativePath(relativePath, "путь инструмента");
      copyRegularTree(
        path.join(resolvedRoot, relativePath),
        path.join(candidateRoot, relativePath),
      );
    }
    return {
      root: candidateRoot,
      packageRoot: candidatePackageRoot,
      evidenceRoot: path.join(candidatePackageRoot, "evidence"),
      packageRelativePath,
      temporary: true,
    };
  } catch (error) {
    fs.rmSync(candidateRoot, { recursive: true, force: true });
    throw error;
  }
}

export function disposeFullPackageCandidate(candidate) {
  if (
    !candidate ||
    candidate.temporary !== true ||
    typeof candidate.root !== "string" ||
    !path.basename(candidate.root).startsWith(CANDIDATE_PREFIX)
  ) {
    throw new Error("разрешено удалить только временный кандидат полного выпуска");
  }
  fs.rmSync(candidate.root, { recursive: true, force: true });
}

function reserveSiblingDirectory(packageRoot, prefix) {
  const parent = path.dirname(path.resolve(packageRoot));
  const reserved = fs.mkdtempSync(path.join(parent, prefix));
  fs.rmdirSync(reserved);
  return reserved;
}

function isRegularDirectory(target) {
  if (!fs.existsSync(target)) return false;
  const stat = fs.lstatSync(target);
  return stat.isDirectory() && !stat.isSymbolicLink();
}

function assertPublishablePackage(target, label) {
  if (!isRegularDirectory(target)) {
    throw new Error(`${label} должен быть обычным каталогом без символических ссылок`);
  }
}

function assertVacantPath(target, label) {
  if (fs.existsSync(target)) {
    throw new Error(`${label} уже существует; безопасное переключение остановлено`);
  }
}

function renameWithoutReplacement(source, target, label) {
  assertVacantPath(target, label);
  fs.renameSync(source, target);
}

function journalPathFor(packageRoot) {
  const resolved = path.resolve(packageRoot);
  return path.join(
    path.dirname(resolved),
    `.${path.basename(resolved)}${JOURNAL_SUFFIX}`,
  );
}

export function fullPackageReleaseJournalPath({ packageRoot }) {
  if (!packageRoot) throw new Error("для журнала нужен путь активного пакета");
  return journalPathFor(packageRoot);
}

function writeReleaseJournal(journalPath, journal) {
  const temporaryPath = `${journalPath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(journal, null, 2)}\n`, { flag: "wx" });
  try {
    fs.renameSync(temporaryPath, journalPath);
  } catch (error) {
    fs.rmSync(temporaryPath, { force: true });
    throw error;
  }
}

function readReleaseJournal(journalPath) {
  const stat = fs.lstatSync(journalPath);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error("журнал полного выпуска должен быть обычным файлом");
  }
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
  if (!journal || typeof journal !== "object" || typeof journal.phase !== "string") {
    throw new Error("журнал полного выпуска повреждён");
  }
  return journal;
}

function issuesFrom(result, label) {
  if (result === undefined || result === null) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.issues)) return result.issues;
  throw new Error(`${label} вернула неподдерживаемый результат`);
}

async function validateOrThrow(validate, args, label) {
  const issues = issuesFrom(await validate(...args), label);
  if (issues.length > 0) {
    throw new Error(`${label} не пройдена:\n- ${issues.join("\n- ")}`);
  }
}

function defaultPrototypeCandidateGenerator(options) {
  const generate = journeyGenerator.generatePrototypeCandidate ??
    journeyGenerator.generatePrototypePackage;
  if (typeof generate !== "function") {
    throw new Error("генератор кандидата полного выпуска недоступен");
  }
  return generate(options);
}

function defaultPublishedPackageValidation({ root, packageRoot }) {
  return [
    ...issuesFrom(
      journeyGenerator.validateGeneratedPackage(root, root),
      "проверка опубликованного generated-пакета",
    ),
    ...issuesFrom(
      defaultValidateEvidencePackage(root, {
        contractRoot: root,
        packageRoot,
        evidenceRoot: path.join(packageRoot, "evidence"),
        toolchainRoot: root,
      }),
      "проверка опубликованного evidence-пакета",
    ),
  ];
}

function releaseDependencies(dependencies = {}) {
  return {
    generatePrototypeCandidate:
      dependencies.generatePrototypeCandidate ?? defaultPrototypeCandidateGenerator,
    generateEvidence: dependencies.generateEvidence ?? defaultGenerateEvidence,
    validateGeneratedPackage:
      dependencies.validateGeneratedPackage ?? journeyGenerator.validateGeneratedPackage,
    validateEvidencePackage:
      dependencies.validateEvidencePackage ?? defaultValidateEvidencePackage,
    validatePublishedPackage:
      dependencies.validatePublishedPackage ?? defaultPublishedPackageValidation,
  };
}

function assertCandidateNotActive(candidate, packageRoot) {
  if (path.resolve(candidate.packageRoot) === path.resolve(packageRoot)) {
    throw new Error("кандидат полного выпуска совпадает с активным пакетом");
  }
  assertPublishablePackage(candidate.packageRoot, "кандидат полного выпуска");
  assertSameFilesystem(candidate.packageRoot, packageRoot, "кандидат полного выпуска");
}

function updatePhase(journal, phase, journalPath, hooks) {
  journal.phase = phase;
  writeReleaseJournal(journalPath, journal);
  hooks?.onPhase?.(phase, { ...journal });
}

function moveActiveCandidateToFailure({ packageRoot, failedRoot }) {
  if (!fs.existsSync(packageRoot)) return null;
  assertPublishablePackage(packageRoot, "активный кандидат");
  renameWithoutReplacement(packageRoot, failedRoot, "карантин кандидата");
  return failedRoot;
}

function rollbackPublishedPackage({
  packageRoot,
  backupRoot,
  activated,
  failedRoot,
}) {
  const errors = [];
  let retainedFailedRoot = null;
  if (activated && fs.existsSync(packageRoot)) {
    try {
      retainedFailedRoot = moveActiveCandidateToFailure({ packageRoot, failedRoot });
    } catch (error) {
      errors.push(error);
    }
  }
  if (fs.existsSync(backupRoot)) {
    if (!fs.existsSync(packageRoot)) {
      try {
        renameWithoutReplacement(backupRoot, packageRoot, "путь восстановления активного пакета");
      } catch (error) {
        errors.push(error);
      }
    } else {
      errors.push(new Error(
        "резерв существует, но активный путь занят; автоматический откат небезопасен",
      ));
    }
  }
  if (!fs.existsSync(packageRoot)) {
    errors.push(new Error("после отката активный пакет отсутствует"));
  }
  return { errors, retainedFailedRoot };
}

export async function runFullPackageReleaseTransaction({
  root = process.cwd(),
  packageRoot = path.join(root, journeyGenerator.PACKAGE_PATH),
  toolchainPaths = DEFAULT_FULL_PACKAGE_TOOLCHAIN_PATHS,
  dependencies,
  hooks,
} = {}) {
  const resolvedRoot = path.resolve(root);
  const resolvedPackageRoot = path.resolve(packageRoot);
  assertPublishablePackage(resolvedPackageRoot, "активный пакет");
  const lock = acquireFullPackageReleaseLock({ packageRoot: resolvedPackageRoot });
  const journalPath = journalPathFor(resolvedPackageRoot);
  let candidate = null;
  let backupRoot = null;
  let failedRoot = null;
  let activated = false;
  let journal = null;
  try {
    const snapshotBefore = snapshotFullPackageInputs({
      root: resolvedRoot,
      packageRoot: resolvedPackageRoot,
      toolchainPaths,
    });
    candidate = createFullPackageCandidate({
      root: resolvedRoot,
      packageRoot: resolvedPackageRoot,
      toolchainPaths,
    });
    assertCandidateNotActive(candidate, resolvedPackageRoot);
    const transactionId = crypto.randomUUID();
    backupRoot = reserveSiblingDirectory(resolvedPackageRoot, BACKUP_PREFIX);
    failedRoot = reserveSiblingDirectory(resolvedPackageRoot, FAILED_PREFIX);
    journal = {
      version: "1.0.0",
      transaction_id: transactionId,
      mode: "recoverable-switch",
      phase: "PREPARED",
      active_package_root: resolvedPackageRoot,
      candidate_package_root: candidate.packageRoot,
      backup_root: backupRoot,
      failed_root: failedRoot,
      input_snapshot: snapshotBefore,
    };
    updatePhase(journal, "PREPARED", journalPath, hooks);

    const services = releaseDependencies(dependencies);
    const generatorResult = await services.generatePrototypeCandidate({
      sourceRoot: candidate.root,
      outputRoot: candidate.root,
      packageRoot: candidate.packageRoot,
      diagnosticRoot: resolvedRoot,
    });
    await validateOrThrow(
      services.validateGeneratedPackage,
      [candidate.root, candidate.root],
      "проверка generated-кандидата",
    );
    await services.generateEvidence({
      root: candidate.root,
      contractRoot: candidate.root,
      packageRoot: candidate.packageRoot,
      evidenceRoot: candidate.evidenceRoot,
      toolchainRoot: resolvedRoot,
    });
    await validateOrThrow(
      services.validateEvidencePackage,
      [candidate.root, {
        contractRoot: candidate.root,
        packageRoot: candidate.packageRoot,
        evidenceRoot: candidate.evidenceRoot,
        toolchainRoot: resolvedRoot,
      }],
      "проверка evidence-кандидата",
    );
    hooks?.afterCandidateBuilt?.({ candidate: { ...candidate } });
    const snapshotAfter = snapshotFullPackageInputs({
      root: resolvedRoot,
      packageRoot: resolvedPackageRoot,
      toolchainPaths,
    });
    if (!sameFullPackageInputSnapshots(snapshotBefore, snapshotAfter)) {
      throw new Error("входы полного выпуска изменились во время сборки кандидата");
    }
    updatePhase(journal, "VALIDATED", journalPath, hooks);

    const snapshotAtCutover = snapshotFullPackageInputs({
      root: resolvedRoot,
      packageRoot: resolvedPackageRoot,
      toolchainPaths,
    });
    if (!sameFullPackageInputSnapshots(snapshotBefore, snapshotAtCutover)) {
      throw new Error("входы полного выпуска изменились перед переключением");
    }

    renameWithoutReplacement(
      resolvedPackageRoot,
      backupRoot,
      "резерв предыдущего полного пакета",
    );
    updatePhase(journal, "BACKUP_MOVED", journalPath, hooks);
    renameWithoutReplacement(
      candidate.packageRoot,
      resolvedPackageRoot,
      "путь активации полного кандидата",
    );
    activated = true;
    updatePhase(journal, "ACTIVATED", journalPath, hooks);
    await validateOrThrow(
      services.validatePublishedPackage,
      [{ root: resolvedRoot, packageRoot: resolvedPackageRoot }],
      "послепубликационная проверка полного выпуска",
    );
    updatePhase(journal, "POST_VALIDATED", journalPath, hooks);
    updatePhase(journal, "COMMITTED", journalPath, hooks);
    return {
      status: "COMMITTED",
      mode: "recoverable-switch",
      transactionId,
      backupRoot,
      journalPath,
      generatorResult,
    };
  } catch (publicationError) {
    const rollback = backupRoot
      ? rollbackPublishedPackage({
        packageRoot: resolvedPackageRoot,
        backupRoot,
        activated,
        failedRoot,
      })
      : { errors: [], retainedFailedRoot: null };
    if (journal) {
      try {
        journal.phase = rollback.errors.length === 0 ? "ROLLED_BACK" : "RECOVERY_REQUIRED";
        journal.failed_root = rollback.retainedFailedRoot ?? failedRoot;
        writeReleaseJournal(journalPath, journal);
      } catch (journalError) {
        rollback.errors.push(journalError);
      }
    }
    if (rollback.errors.length > 0) {
      throw new AggregateError(
        [publicationError, ...rollback.errors],
        "публикация полного выпуска и откат не выполнены; резерв сохранён",
      );
    }
    throw publicationError;
  } finally {
    if (candidate) disposeFullPackageCandidate(candidate);
    releaseFullPackageReleaseLock(lock);
  }
}

function assertJournalSiblingPath(packageRoot, target, label) {
  if (typeof target !== "string" || !path.isAbsolute(target)) {
    throw new Error(`${label} в журнале должен быть абсолютным путём`);
  }
  const parent = path.dirname(path.resolve(packageRoot));
  if (path.dirname(path.resolve(target)) !== parent) {
    throw new Error(`${label} в журнале находится вне каталога активного пакета`);
  }
}

export function recoverFullPackageReleaseTransaction({
  packageRoot,
  journalPath = packageRoot ? journalPathFor(packageRoot) : undefined,
} = {}) {
  if (!packageRoot || !journalPath) {
    throw new Error("для восстановления нужны путь активного пакета и журнал");
  }
  const resolvedPackageRoot = path.resolve(packageRoot);
  const resolvedJournalPath = path.resolve(journalPath);
  const lock = acquireFullPackageReleaseLock({ packageRoot: resolvedPackageRoot });
  try {
    const journal = readReleaseJournal(resolvedJournalPath);
    if (path.resolve(journal.active_package_root ?? "") !== resolvedPackageRoot) {
      throw new Error("журнал относится к другому активному пакету");
    }
    if (journal.phase === "COMMITTED") {
      assertPublishablePackage(resolvedPackageRoot, "зафиксированный активный пакет");
      return { status: "COMMITTED", mode: "recoverable-switch", journalPath: resolvedJournalPath };
    }
    const backupRoot = journal.backup_root;
    const failedRoot = journal.failed_root;
    if (!backupRoot || !failedRoot) {
      throw new Error("журнал не содержит путей восстановления");
    }
    assertJournalSiblingPath(resolvedPackageRoot, backupRoot, "резерв");
    assertJournalSiblingPath(resolvedPackageRoot, failedRoot, "карантин кандидата");

    const activeExists = fs.existsSync(resolvedPackageRoot);
    const backupExists = fs.existsSync(backupRoot);
    let retainedFailedRoot = null;
    if (["PREPARED", "VALIDATED", "ROLLED_BACK"].includes(journal.phase)) {
      if (!activeExists) {
        throw new Error("до переключения активный пакет отсутствует; требуется ручное восстановление");
      }
      if (backupExists) {
        throw new Error("до переключения найден неожиданный резерв; автоматическое восстановление небезопасно");
      }
      assertPublishablePackage(resolvedPackageRoot, "активный пакет до переключения");
    } else if (journal.phase === "BACKUP_MOVED") {
      if (activeExists && backupExists) {
        throw new Error("после переноса резерва одновременно найдены активный пакет и резерв; состояние неоднозначно");
      }
      if (!activeExists && backupExists) {
        assertPublishablePackage(backupRoot, "резерв для восстановления");
        renameWithoutReplacement(backupRoot, resolvedPackageRoot, "путь восстановления активного пакета");
      } else if (activeExists) {
        assertPublishablePackage(resolvedPackageRoot, "восстановленный активный пакет");
      } else {
        throw new Error("восстановление не нашло ни активный пакет, ни пригодный резерв");
      }
    } else if (["ACTIVATED", "POST_VALIDATED"].includes(journal.phase)) {
      if (activeExists && backupExists) {
        assertPublishablePackage(resolvedPackageRoot, "активный кандидат для восстановления");
        assertPublishablePackage(backupRoot, "резерв для восстановления");
        renameWithoutReplacement(resolvedPackageRoot, failedRoot, "карантин кандидата");
        retainedFailedRoot = failedRoot;
        renameWithoutReplacement(backupRoot, resolvedPackageRoot, "путь восстановления активного пакета");
      } else if (!activeExists && backupExists) {
        assertPublishablePackage(backupRoot, "резерв для восстановления");
        renameWithoutReplacement(backupRoot, resolvedPackageRoot, "путь восстановления активного пакета");
      } else if (activeExists && !backupExists) {
        throw new Error("резерв предыдущего полного пакета отсутствует; автоматическое восстановление небезопасно");
      } else {
        throw new Error("восстановление не нашло ни активный пакет, ни пригодный резерв");
      }
    } else {
      throw new Error(`фаза журнала не поддерживает автоматическое восстановление: ${journal.phase}`);
    }
    assertPublishablePackage(resolvedPackageRoot, "восстановленный активный пакет");
    journal.phase = "ROLLED_BACK";
    journal.failed_root = retainedFailedRoot ?? journal.failed_root;
    writeReleaseJournal(resolvedJournalPath, journal);
    return {
      status: "RECOVERED",
      mode: "recoverable-switch",
      journalPath: resolvedJournalPath,
      failedRoot: retainedFailedRoot,
    };
  } finally {
    releaseFullPackageReleaseLock(lock);
  }
}

export function acquireFullPackageReleaseLock({ packageRoot }) {
  if (!packageRoot || !path.isAbsolute(path.resolve(packageRoot))) {
    throw new Error("для блокировки нужен абсолютный путь активного пакета");
  }
  const parent = path.dirname(path.resolve(packageRoot));
  const lockPath = path.join(parent, RELEASE_LOCK_BASENAME);
  let handle;
  try {
    handle = fs.openSync(lockPath, "wx");
  } catch (error) {
    if (error?.code === "EEXIST") {
      throw new Error("блокировка полного выпуска занята");
    }
    throw error;
  }
  try {
    fs.writeSync(handle, `${JSON.stringify({ pid: process.pid, package_root: path.resolve(packageRoot) })}\n`);
  } catch (error) {
    fs.closeSync(handle);
    fs.rmSync(lockPath, { force: true });
    throw error;
  }
  return { handle, path: lockPath };
}

export function releaseFullPackageReleaseLock(lock) {
  if (!lock || typeof lock.handle !== "number" || typeof lock.path !== "string") {
    throw new Error("передана некорректная блокировка полного выпуска");
  }
  try {
    fs.closeSync(lock.handle);
  } finally {
    fs.rmSync(lock.path, { force: true });
  }
}
