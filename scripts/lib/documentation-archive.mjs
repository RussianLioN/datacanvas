import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ZIP_LOCAL = 0x04034b50;
const ZIP_CENTRAL = 0x02014b50;
const ZIP_END = 0x06054b50;

const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function assertSafeRelativePath(relativePath) {
  if (!relativePath || path.isAbsolute(relativePath) || relativePath.includes("\\")) {
    throw new Error(`небезопасный путь архива: ${relativePath}`);
  }
  const normalized = path.posix.normalize(relativePath);
  if (normalized !== relativePath || normalized === ".." || normalized.startsWith("../")) {
    throw new Error(`путь выходит за корень архива: ${relativePath}`);
  }
}

function mediaType(relativePath) {
  return ({
    ".csv": "text/csv",
    ".html": "text/html",
    ".json": "application/json",
    ".md": "text/markdown",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".puml": "text/plain",
    ".svg": "image/svg+xml",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })[path.extname(relativePath).toLowerCase()] ?? "application/octet-stream";
}

export function resolveArchiveMembers(root, contract, chain) {
  const members = [];
  const seen = new Set();
  for (const stage of chain.stages) {
    for (const relativePath of stage.primary_artifacts) {
      members.push({
        path: relativePath,
        label: stage.name,
        role: "primary",
        stage_id: stage.stage_id,
        stage_order: stage.order,
      });
    }
  }
  for (const artifact of contract.additional_artifacts) {
    members.push({ ...artifact, role: "derivative", stage_id: null, stage_order: null });
  }
  for (const member of members) {
    assertSafeRelativePath(member.path);
    if (seen.has(member.path)) throw new Error(`дублирующийся путь архива: ${member.path}`);
    seen.add(member.path);
    const absolutePath = path.join(root, member.path);
    if (!fs.existsSync(absolutePath)) throw new Error(`вход архива отсутствует: ${member.path}`);
    const stat = fs.lstatSync(absolutePath);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`вход архива не является обычным файлом: ${member.path}`);
  }
  return members;
}

function renderManifest(contract, chain, memberData) {
  return Buffer.from(`${JSON.stringify({
    version: contract.version,
    archive_id: contract.archive_id,
    title: contract.title,
    data_class: contract.data_class,
    visibility: contract.visibility,
    source_chain_path: contract.source_chain_path,
    contract_fingerprint: sha256(Buffer.from(JSON.stringify(contract), "utf8")),
    source_chain_fingerprint: sha256(Buffer.from(JSON.stringify(chain), "utf8")),
    integrity_algorithm: contract.integrity_algorithm,
    stages: chain.stages.map((stage) => ({ order: stage.order, stage_id: stage.stage_id, name: stage.name })),
    entries: memberData.map(({ content, ...entry }) => ({ ...entry, size: content.length, sha256: sha256(content), media_type: mediaType(entry.path) })),
  }, null, 2)}\n`, "utf8");
}

function renderMarkdown(contract, chain, memberData) {
  const lines = [
    `# ${contract.title}`,
    "",
    "Локальный архив главной цепочки документации. Все ссылки относительные и работают после распаковки.",
    "",
  ];
  for (const stage of chain.stages) {
    lines.push(`## ${stage.order}. ${stage.name}`, "");
    for (const entry of memberData.filter((item) => item.stage_id === stage.stage_id)) {
      lines.push(`- [${entry.path}](${contract.archive_root}/${entry.path})`);
    }
    lines.push("");
  }
  lines.push("## Производные файловые представления", "");
  for (const entry of memberData.filter((item) => item.role === "derivative")) {
    lines.push(`- [${entry.label}](${contract.archive_root}/${entry.path})`);
  }
  return Buffer.from(`${lines.join("\n")}\n`, "utf8");
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function renderHtml(contract, chain, memberData) {
  const sections = chain.stages.map((stage) => {
    const links = memberData
      .filter((item) => item.stage_id === stage.stage_id)
      .map((entry) => `<li><a href="${contract.archive_root}/${escapeHtml(entry.path)}">${escapeHtml(entry.path)}</a></li>`)
      .join("");
    return `<section><h2>${stage.order}. ${escapeHtml(stage.name)}</h2><ul>${links}</ul></section>`;
  }).join("");
  const derivatives = memberData.filter((item) => item.role === "derivative")
    .map((entry) => `<li><a href="${contract.archive_root}/${escapeHtml(entry.path)}">${escapeHtml(entry.label)}</a></li>`)
    .join("");
  return Buffer.from(`<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(contract.title)}</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:960px;margin:auto;padding:24px;color:#172033}a{color:#075aa8}section{border-top:1px solid #ccd3df}code{word-break:break-all}</style></head>
<body><h1>${escapeHtml(contract.title)}</h1><p>Автономная навигация по главным документам и производным файлам DataCanvas.</p>${sections}
<section><h2>Производные файловые представления</h2><ul>${derivatives}</ul></section></body></html>\n`, "utf8");
}

export function createStoredZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const entry of entries) {
    assertSafeRelativePath(entry.name);
    const name = Buffer.from(entry.name, "utf8");
    const checksum = crc32(entry.content);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(ZIP_LOCAL, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x0021, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(entry.content.length, 18);
    local.writeUInt32LE(entry.content.length, 22);
    local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, entry.content);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(ZIP_CENTRAL, 0);
    central.writeUInt16LE(0x0314, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x0021, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(entry.content.length, 20);
    central.writeUInt32LE(entry.content.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE((0o100644 << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + entry.content.length;
  }
  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(ZIP_END, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

export function buildDocumentationArchive(root, contract, chain) {
  const members = resolveArchiveMembers(root, contract, chain);
  const memberData = members.map((member) => ({ ...member, content: fs.readFileSync(path.join(root, member.path)) }));
  const entries = [
    { name: "index.html", content: renderHtml(contract, chain, memberData) },
    { name: "README.md", content: renderMarkdown(contract, chain, memberData) },
    { name: "manifest.json", content: renderManifest(contract, chain, memberData) },
    ...memberData.map((entry) => ({ name: `${contract.archive_root}/${entry.path}`, content: entry.content })),
  ];
  return createStoredZip(entries);
}

export function readStoredZip(buffer) {
  const requireBytes = (start, length, label) => {
    if (start < 0 || length < 0 || start + length > buffer.length) {
      throw new Error(`повреждена структура ZIP: ${label}`);
    }
  };
  const entries = new Map();
  const localRecords = new Map();
  let offset = 0;
  while (offset + 4 <= buffer.length && buffer.readUInt32LE(offset) === ZIP_LOCAL) {
    const localOffset = offset;
    requireBytes(offset, 30, "неполный локальный заголовок");
    const flags = buffer.readUInt16LE(offset + 6);
    const method = buffer.readUInt16LE(offset + 8);
    if (method !== 0) throw new Error("архив использует неподдерживаемое сжатие");
    if (flags !== 0 && flags !== 0x0800) {
      throw new Error("архив использует неподдерживаемые флаги ZIP");
    }
    const checksum = buffer.readUInt32LE(offset + 14);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const size = buffer.readUInt32LE(offset + 22);
    if (compressedSize !== size) {
      throw new Error("stored ZIP содержит разные сжатый и исходный размеры");
    }
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    requireBytes(
      nameStart,
      nameLength + extraLength + compressedSize,
      "локальная запись выходит за границы архива",
    );
    const name = buffer.subarray(nameStart, nameStart + nameLength).toString("utf8");
    assertSafeRelativePath(name);
    const contentStart = nameStart + nameLength + extraLength;
    const content = buffer.subarray(contentStart, contentStart + compressedSize);
    if (crc32(content) !== checksum) throw new Error(`повреждён член ZIP: ${name}`);
    if (entries.has(name)) throw new Error(`дублирующийся член ZIP: ${name}`);
    entries.set(name, Buffer.from(content));
    localRecords.set(localOffset, { name, flags, method, checksum, size });
    offset = contentStart + compressedSize;
  }

  const centralStart = offset;
  if (
    centralStart + 4 > buffer.length ||
    buffer.readUInt32LE(centralStart) !== ZIP_CENTRAL
  ) {
    throw new Error("центральный каталог ZIP отсутствует");
  }
  const referencedLocalOffsets = new Set();
  let centralCount = 0;
  while (offset + 4 <= buffer.length && buffer.readUInt32LE(offset) === ZIP_CENTRAL) {
    requireBytes(offset, 46, "неполная запись центрального каталога");
    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const checksum = buffer.readUInt32LE(offset + 16);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const size = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const diskNumber = buffer.readUInt16LE(offset + 34);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const nameStart = offset + 46;
    requireBytes(
      nameStart,
      nameLength + extraLength + commentLength,
      "запись центрального каталога выходит за границы архива",
    );
    const name = buffer.subarray(nameStart, nameStart + nameLength).toString("utf8");
    assertSafeRelativePath(name);
    if (diskNumber !== 0) throw new Error("многодисковый ZIP не поддерживается");
    const local = localRecords.get(localOffset);
    if (!local) {
      throw new Error(`центральный каталог ссылается на неизвестную запись: ${name}`);
    }
    if (referencedLocalOffsets.has(localOffset)) {
      throw new Error(`центральный каталог повторяет локальную запись: ${name}`);
    }
    if (name !== local.name) {
      throw new Error(
        `имя центрального каталога не совпадает с локальным заголовком: ${name}`,
      );
    }
    if (
      flags !== local.flags ||
      method !== local.method ||
      checksum !== local.checksum ||
      compressedSize !== local.size ||
      size !== local.size
    ) {
      throw new Error(`метаданные центрального каталога не совпадают: ${name}`);
    }
    referencedLocalOffsets.add(localOffset);
    centralCount += 1;
    offset = nameStart + nameLength + extraLength + commentLength;
  }

  const centralSize = offset - centralStart;
  requireBytes(offset, 22, "конечная запись ZIP отсутствует");
  if (buffer.readUInt32LE(offset) !== ZIP_END) {
    throw new Error("конечная запись ZIP отсутствует");
  }
  const diskNumber = buffer.readUInt16LE(offset + 4);
  const centralDiskNumber = buffer.readUInt16LE(offset + 6);
  const diskEntryCount = buffer.readUInt16LE(offset + 8);
  const totalEntryCount = buffer.readUInt16LE(offset + 10);
  const declaredCentralSize = buffer.readUInt32LE(offset + 12);
  const declaredCentralOffset = buffer.readUInt32LE(offset + 16);
  const commentLength = buffer.readUInt16LE(offset + 20);
  requireBytes(offset + 22, commentLength, "неполный комментарий конечной записи ZIP");
  if (offset + 22 + commentLength !== buffer.length) {
    throw new Error("после конечной записи ZIP обнаружены лишние данные");
  }
  if (diskNumber !== 0 || centralDiskNumber !== 0) {
    throw new Error("многодисковый ZIP не поддерживается");
  }
  if (
    diskEntryCount !== centralCount ||
    totalEntryCount !== centralCount ||
    centralCount !== localRecords.size ||
    referencedLocalOffsets.size !== localRecords.size
  ) {
    throw new Error("число записей ZIP не совпадает с каталогом");
  }
  if (
    declaredCentralSize !== centralSize ||
    declaredCentralOffset !== centralStart
  ) {
    throw new Error("границы центрального каталога ZIP не совпадают");
  }
  return entries;
}
