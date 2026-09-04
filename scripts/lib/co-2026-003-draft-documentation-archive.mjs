import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { createStoredZip, resolveArchiveMembers } from "./documentation-archive.mjs";

export const DRAFT_CONTRACT_PATH = "docs/release/co-2026-003-draft-documentation-archive-contract.json";

function fail(message) {
  throw new Error(message);
}

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function assertSafeRelativePath(relativePath, label) {
  if (typeof relativePath !== "string" || !relativePath || path.isAbsolute(relativePath) || relativePath.includes("\\") || relativePath.split("/").includes("..")) {
    fail(`${label}: небезопасный относительный путь`);
  }
  const normalized = path.posix.normalize(relativePath);
  if (normalized !== relativePath || normalized === "." || normalized === ".." || normalized.startsWith("../")) fail(`${label}: путь выходит за корень`);
}

function resolveRegularFile(root, relativePath, label) {
  assertSafeRelativePath(relativePath, label);
  const absolutePath = path.resolve(root, relativePath);
  if (!absolutePath.startsWith(`${root}${path.sep}`)) fail(`${label}: путь выходит за корень`);
  const stat = fs.lstatSync(absolutePath);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label}: требуется обычный файл`);
  return absolutePath;
}

function collectFiles(root, relativeDirectory) {
  assertSafeRelativePath(relativeDirectory, "корень прототипа");
  const absoluteDirectory = path.resolve(root, relativeDirectory);
  const result = [];
  for (const entry of fs.readdirSync(absoluteDirectory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name, "en"))) {
    const childRelative = `${relativeDirectory}/${entry.name}`;
    if (entry.isSymbolicLink()) fail(`прототип: символическая ссылка запрещена: ${childRelative}`);
    if (entry.isDirectory()) result.push(...collectFiles(root, childRelative));
    else if (entry.isFile()) result.push(childRelative);
    else fail(`прототип: недопустимый тип файла: ${childRelative}`);
  }
  return result;
}

function assertDraftBoundary(root, contract) {
  if (contract.release_kind !== "draft_documentation_evidence_only") fail("договор не определяет архивный снимок черновика");
  if (contract.data_class !== "public_authorized" || contract.visibility !== "public") fail("договор не фиксирует разрешённую видимость чернового архива");
  if (!contract.output_path.startsWith("docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/")) fail("архив черновика должен находиться среди кандидатных доказательств");
  if (Object.hasOwn(contract, "release_approval_ledger_path")) fail("архивный снимок не должен зависеть от живого реестра выпуска");
  const snapshot = contract.historical_snapshot;
  const expectedPrototypeManifestPath = `${contract.prototype_root}/manifest.json`;
  if (
    !snapshot ||
    snapshot.amendment_id !== "CO3-AMND-002" ||
    snapshot.decision_register_path !== "docs/product/change-orders/co-2026-003-authoritative-interview-decision-register.json" ||
    snapshot.prototype_manifest_path !== expectedPrototypeManifestPath ||
    snapshot.prototype_status !== "draft_prototype_accepted_for_documentation_cascade" ||
    snapshot.accepted_scope !== "isolated_draft_only"
  ) fail("замороженный снимок должен сохранять запреты исторического черновика");
  if (snapshot.active_release_switch_allowed !== false) fail("замороженный снимок должен запрещать переключение действующего маршрута");
  if (snapshot.high_resolution_render_allowed !== false) fail("замороженный снимок должен запрещать высокоразрешённый рендер");
  if (snapshot.delivery_archive_allowed !== false) fail("замороженный снимок должен запрещать архив поставки");
  if (
    !Array.isArray(contract.exclude_primary_artifacts) ||
    contract.exclude_primary_artifacts.length !== 1 ||
    contract.exclude_primary_artifacts[0] !== "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.xlsx" ||
    !contract.forbidden_extensions.includes(".xlsx")
  ) fail("исторический архив должен исключать единственный первичный XLSX и запрещать формат .xlsx");

  const prototypeManifest = JSON.parse(fs.readFileSync(resolveRegularFile(root, snapshot.prototype_manifest_path, "исторический манифест прототипа"), "utf8"));
  if (
    prototypeManifest.status !== snapshot.prototype_status ||
    prototypeManifest.owner_acceptance?.scope !== snapshot.accepted_scope ||
    prototypeManifest.owner_acceptance?.active_release_switch_allowed !== false
  ) fail("замороженный снимок не совпадает с историческим манифестом прототипа");

  const decisionRegister = JSON.parse(fs.readFileSync(resolveRegularFile(root, snapshot.decision_register_path, "исторический реестр решений"), "utf8"));
  const amendment = decisionRegister.post_interview_amendments?.find((item) => item.amendment_id === snapshot.amendment_id);
  if (
    amendment?.source !== "owner_follow_up_confirmation" ||
    amendment.supersedes?.decision_id !== "CO3-DEC-010" ||
    amendment.supersedes?.scope !== "active_visual_release_only" ||
    amendment.accepted_scope !== snapshot.accepted_scope ||
    amendment.active_release_switch_allowed !== false ||
    amendment.next_gate !== "documentation_cascade_then_explicit_final_owner_approval"
  ) fail("замороженный снимок не совпадает с историческим дополнением CO3-AMND-002");
}

function assertSafeContent(content, sourcePath, contract) {
  if (contract.forbidden_extensions.includes(path.extname(sourcePath).toLowerCase())) fail(`черновой архив не включает запрещённый тип: ${sourcePath}`);
  if (content.subarray(0, 5).equals(Buffer.from("%PDF-", "utf8"))) fail(`черновой архив не включает PDF: ${sourcePath}`);
  if (/\/(?:demo|derived|evidence)\//u.test(`/${sourcePath}`)) fail(`черновой архив не включает исторический путь: ${sourcePath}`);
}

function entry(sourcePath, archivePath, role, label, content) {
  return {
    source_path: sourcePath,
    archive_path: archivePath,
    role,
    label,
    size: content.length,
    sha256: sha256(content),
    content,
  };
}

function snapshotFingerprint(entries) {
  const source = entries
    .map((item) => `${item.archive_path}\n${item.size}\n${item.sha256}`)
    .sort((left, right) => left.localeCompare(right, "en"))
    .join("\n");
  return sha256(Buffer.from(source, "utf8"));
}

function renderIndex(contract, fingerprint, entries) {
  const documentLinks = entries.filter((item) => item.role !== "prototype").map((item) => `<li><a href="${item.archive_path}">${item.label}</a></li>`).join("");
  const prototypeEntrypoint = `${contract.archive_root}/${contract.prototype_root}/index.html`;
  return Buffer.from(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Черновой пакет CO-2026-003</title></head><body><main><h1>Черновой пакет документации CO-2026-003</h1><p>Это архивный снимок для работы над документальным каскадом. Он не является чистовой поставкой и не изменяет действующий выпуск.</p><p><a href="${prototypeEntrypoint}">Открыть принятый черновой прототип из ${contract.required_prototype_frame_count} кадров</a></p><h2>Документы</h2><ul>${documentLinks}</ul><p>Отпечаток состава: <code>${fingerprint}</code></p></main></body></html>`, "utf8");
}

function renderReadme(contract, fingerprint, entries) {
  const documentLinks = entries.filter((item) => item.role !== "prototype").map((item) => `- [${item.label}](${item.archive_path})`).join("\n");
  const prototypeEntrypoint = `${contract.archive_root}/${contract.prototype_root}/index.html`;
  return Buffer.from(`# Черновой пакет документации CO-2026-003\n\nЭто самостоятельный архивный снимок актуальной документации и прототипа ООО «Водолей Трейд». Он не является чистовой поставкой и не разрешает переключение действующего выпуска.\n\n- [Открыть принятый черновой прототип из ${contract.required_prototype_frame_count} кадров](${prototypeEntrypoint})\n\n## Документы\n\n${documentLinks}\n\nОтпечаток состава: \`${fingerprint}\`.\n`, "utf8");
}

export function readCo2026003DraftDocumentationArchiveContract(root = process.cwd()) {
  return JSON.parse(fs.readFileSync(resolveRegularFile(root, DRAFT_CONTRACT_PATH, "договор архивного снимка"), "utf8"));
}

export function buildCo2026003DraftDocumentationArchive(root = process.cwd(), contract = readCo2026003DraftDocumentationArchiveContract(root)) {
  assertDraftBoundary(root, contract);
  const chain = JSON.parse(fs.readFileSync(resolveRegularFile(root, contract.source_chain_path, "цепочка исходных материалов"), "utf8"));
  const members = resolveArchiveMembers(root, {
    additional_artifacts: contract.additional_artifacts,
    exclude_primary_artifacts: contract.exclude_primary_artifacts,
  }, chain);
  const entries = [];
  for (const member of members) {
    const sourcePath = member.path;
    if (contract.forbidden_path_fragments.some((fragment) => sourcePath.includes(fragment))) fail(`черновой архив не включает исторический материал: ${sourcePath}`);
    const content = fs.readFileSync(resolveRegularFile(root, sourcePath, `документ ${sourcePath}`));
    assertSafeContent(content, sourcePath, contract);
    entries.push(entry(sourcePath, `${contract.archive_root}/${sourcePath}`, member.role, member.label, content));
  }
  const prototypeManifestPath = `${contract.prototype_root}/manifest.json`;
  const prototypeManifest = JSON.parse(fs.readFileSync(resolveRegularFile(root, prototypeManifestPath, "манифест чернового прототипа"), "utf8"));
  if (!Array.isArray(prototypeManifest.frames) || prototypeManifest.frames.length !== contract.required_prototype_frame_count || prototypeManifest.frame_ids?.length !== contract.required_prototype_frame_count) fail(`черновой прототип не содержит принятый маршрут из ${contract.required_prototype_frame_count} кадров`);
  for (const sourcePath of collectFiles(root, contract.prototype_root)) {
    const content = fs.readFileSync(resolveRegularFile(root, sourcePath, `ресурс прототипа ${sourcePath}`));
    assertSafeContent(content, sourcePath, contract);
    entries.push(entry(sourcePath, `${contract.archive_root}/${sourcePath}`, "prototype", "Черновой прототип", content));
  }
  const archivePaths = new Set();
  for (const item of entries) {
    if (archivePaths.has(item.archive_path)) fail(`черновой архив содержит дублирующийся путь: ${item.archive_path}`);
    archivePaths.add(item.archive_path);
  }
  const fingerprint = snapshotFingerprint(entries);
  const manifest = Buffer.from(`${JSON.stringify({
    archive_id: contract.archive_id,
    release_kind: contract.release_kind,
    final_release_authorized: false,
    historical_snapshot: contract.historical_snapshot,
    prototype_frame_count: prototypeManifest.frames.length,
    draft_snapshot_fingerprint: fingerprint,
    entries: entries.map(({ content, ...item }) => item),
  }, null, 2)}\n`, "utf8");
  return createStoredZip([
    { name: "index.html", content: renderIndex(contract, fingerprint, entries) },
    { name: "README.md", content: renderReadme(contract, fingerprint, entries) },
    { name: "manifest.json", content: manifest },
    ...entries.sort((left, right) => left.archive_path.localeCompare(right.archive_path, "en")).map((item) => ({ name: item.archive_path, content: item.content })),
  ]);
}
