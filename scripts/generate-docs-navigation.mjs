import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const sourcePath = "docs/navigation/navigation-source.json";
const outputPaths = [
  "docs/navigation/documentation-index.json",
  "docs/navigation/navigation-map.md",
  "docs/navigation/orphan-docs-report.md",
  "docs/navigation/stale-status-report.md",
];

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function repoPath(...parts) {
  return toPosix(path.join(...parts)).replace(/^\.\//, "");
}

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function writeText(baseDir, relativePath, content) {
  const target = path.join(baseDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content.endsWith("\n") ? content : `${content}\n`);
}

function stableSort(values) {
  return [...values].sort((left, right) => left.localeCompare(right, "en"));
}

function listFiles(relativeRoot, formats) {
  const rootPath = absolute(relativeRoot);
  if (!fs.existsSync(rootPath)) {
    fail(`source root does not exist: ${relativeRoot}`);
  }

  const allowedExtensions = new Set(formats.map((format) => `.${format}`));
  const stat = fs.statSync(rootPath);
  if (stat.isFile()) {
    const extension = path.extname(relativeRoot);
    return allowedExtensions.has(extension) ? [relativeRoot] : [];
  }

  const results = [];
  function walk(currentRelative) {
    const entries = fs.readdirSync(absolute(currentRelative), { withFileTypes: true });
    for (const entry of entries) {
      const childRelative = repoPath(currentRelative, entry.name);
      if (entry.isDirectory()) {
        walk(childRelative);
      } else if (entry.isFile() && allowedExtensions.has(path.extname(entry.name))) {
        results.push(childRelative);
      }
    }
  }

  walk(relativeRoot);
  return stableSort(results);
}

function firstHeading(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

function slugHeading(rawHeading, usedSlugs) {
  const withoutFormatting = rawHeading
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  const base =
    withoutFormatting
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-") || "section";
  const count = usedSlugs.get(base) || 0;
  usedSlugs.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

function extractAnchors(markdown) {
  const usedSlugs = new Map();
  const anchors = [];
  const headingPattern = /^#{1,6}\s+(.+)$/gm;
  let match;
  while ((match = headingPattern.exec(markdown)) !== null) {
    anchors.push(slugHeading(match[1].trim(), usedSlugs));
  }
  return anchors;
}

function isExternalLink(target) {
  return /^(https?:|mailto:|tel:)/i.test(target);
}

function parseMarkdownLinks(markdown, fromPath) {
  const links = [];
  const linkPattern = /(?<!!)\[[^\]]+\]\(([^)]+)\)/g;
  let match;
  while ((match = linkPattern.exec(markdown)) !== null) {
    let target = match[1].trim();
    if (target.startsWith("<") && target.endsWith(">")) {
      target = target.slice(1, -1);
    }
    target = target.split(/\s+/)[0];
    if (!target || target.startsWith("#") || isExternalLink(target)) {
      continue;
    }

    const [pathPart, anchorPart] = target.split("#");
    if (!pathPart) {
      continue;
    }

    const decodedPath = decodeURIComponent(pathPart);
    const normalized = repoPath(path.dirname(fromPath), decodedPath);
    links.push(anchorPart ? `${normalized}#${anchorPart}` : normalized);
  }
  return stableSort([...new Set(links)]);
}

function parentReadmeFor(relativePath) {
  if (relativePath === "README.md") {
    return null;
  }
  const directory = path.posix.dirname(relativePath);
  if (directory === ".") {
    return "README.md";
  }
  let current = path.posix.basename(relativePath) === "README.md"
    ? path.posix.dirname(directory)
    : directory;
  if (current === ".") {
    return "README.md";
  }
  while (current && current !== ".") {
    const candidate = `${current}/README.md`;
    if (candidate !== relativePath && fs.existsSync(absolute(candidate))) {
      return candidate;
    }
    current = path.posix.dirname(current);
  }
  return "docs/README.md";
}

function matchesPrefix(relativePath, prefix) {
  return relativePath === prefix || relativePath.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`);
}

function ignoredReason(source, relativePath) {
  const match = source.ignored_paths.find((entry) => matchesPrefix(relativePath, entry.path));
  return match ? match.reason : null;
}

function sensitiveRuleFor(source, relativePath) {
  return source.sensitive_path_rules.find((rule) => matchesPrefix(relativePath, rule.path_prefix)) || null;
}

function generatedOutputFor(source, relativePath) {
  return source.generated_output_paths.find((entry) => entry.path === relativePath) || null;
}

function managedEntryFor(source, relativePath) {
  return source.managed_entries.find((entry) => entry.path === relativePath) || null;
}

function sectionRuleFor(source, relativePath) {
  const matches = source.section_rules.filter((rule) => matchesPrefix(relativePath, rule.path_prefix));
  return matches.sort((left, right) => right.path_prefix.length - left.path_prefix.length)[0] || null;
}

function defaultMetadata(relativePath) {
  return {
    section: relativePath.startsWith("docs/") ? "knowledge" : "root",
    navigation_group: "governance",
    owner_role: "Documentation Owner",
    lifecycle: "draft",
    data_class: "confidential",
    visibility: "restricted",
    searchable: false,
    navigable: false,
    canonical_source: null,
    generated_from: [],
    redaction_status: "metadata_only",
    update_trigger: "Classify this path in docs/navigation/navigation-source.json before exposing it.",
  };
}

function metadataFor(source, relativePath) {
  const exact = managedEntryFor(source, relativePath);
  const generated = generatedOutputFor(source, relativePath);
  const rule = sectionRuleFor(source, relativePath);
  const sensitive = sensitiveRuleFor(source, relativePath);
  const base = exact || rule?.defaults || defaultMetadata(relativePath);
  const metadata = {
    section: base.section,
    navigation_group: base.navigation_group,
    owner_role: base.owner_role,
    lifecycle: base.lifecycle,
    data_class: base.data_class,
    visibility: base.visibility,
    searchable: base.searchable,
    navigable: base.navigable,
    canonical_source: base.canonical_source,
    generated_from: base.generated_from,
    redaction_status: base.redaction_status,
    update_trigger: base.update_trigger,
  };

  if (generated) {
    metadata.lifecycle = "generated";
    metadata.canonical_source = generated.canonical_source;
    metadata.generated_from = [generated.canonical_source];
  }

  if (sensitive) {
    metadata.data_class = sensitive.data_class;
    metadata.visibility = "restricted";
    metadata.searchable = false;
    metadata.navigable = false;
    metadata.redaction_status = "metadata_only";
  }

  if (metadata.data_class === "confidential" || metadata.data_class === "sensitive") {
    metadata.visibility = "restricted";
    metadata.searchable = false;
    metadata.navigable = false;
    if (metadata.redaction_status === "not_required") {
      metadata.redaction_status = "metadata_only";
    }
  }

  return metadata;
}

function generatedTitle(relativePath) {
  const titles = new Map([
    ["docs/navigation/documentation-index.json", "Generated Documentation Index"],
    ["docs/navigation/navigation-map.md", "Карта Навигации Документации"],
    ["docs/navigation/orphan-docs-report.md", "Отчет По Orphan Docs"],
    ["docs/navigation/stale-status-report.md", "Отчет По Устаревшим Статусам"],
  ]);
  return titles.get(relativePath) || relativePath;
}

function readArtifactRegistry() {
  const registryPath = "docs/architecture/schemas/artifact-registry.json";
  if (!fs.existsSync(absolute(registryPath))) {
    return new Map();
  }
  return new Map(readJson(registryPath).artifacts.map((artifact) => [artifact.path, artifact.id]));
}

function buildEntries(source) {
  const generatedPaths = new Set(source.generated_output_paths.map((entry) => entry.path));
  const files = new Set();
  for (const sourceRoot of source.source_roots) {
    for (const filePath of listFiles(sourceRoot.path, sourceRoot.formats)) {
      if (!generatedPaths.has(filePath) && !ignoredReason(source, filePath)) {
        files.add(filePath);
      }
    }
  }

  for (const outputPath of generatedPaths) {
    files.add(outputPath);
  }

  const artifactIds = readArtifactRegistry();
  return stableSort([...files]).map((filePath) => {
    const generated = generatedPaths.has(filePath);
    const format = path.extname(filePath) === ".md" ? "md" : "json";
    const metadata = metadataFor(source, filePath);
    let title = generated ? generatedTitle(filePath) : filePath;
    let anchors = [];
    let outgoingLinks = [];

    if (!generated && format === "md") {
      const markdown = readText(filePath);
      title = firstHeading(markdown, filePath);
      anchors = extractAnchors(markdown);
      outgoingLinks = parseMarkdownLinks(markdown, filePath);
    }

    return {
      path: filePath,
      title,
      section: metadata.section,
      navigation_group: metadata.navigation_group,
      format,
      owner_role: metadata.owner_role,
      lifecycle: metadata.lifecycle,
      status: metadata.lifecycle,
      data_class: metadata.data_class,
      visibility: metadata.visibility,
      searchable: metadata.searchable,
      navigable: metadata.navigable,
      generated,
      canonical_source: metadata.canonical_source,
      generated_from: metadata.generated_from,
      parent_readme: parentReadmeFor(filePath),
      artifact_registry_id: artifactIds.get(filePath) || null,
      outgoing_links: outgoingLinks,
      anchors,
      reachable_from_root: false,
      click_depth: null,
    };
  });
}

function applyReachability(entries) {
  const byPath = new Map(entries.map((entry) => [entry.path, entry]));
  const queue = [{ path: "README.md", depth: 0 }];
  const seen = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (seen.has(current.path)) {
      continue;
    }
    seen.add(current.path);
    const entry = byPath.get(current.path);
    if (!entry) {
      continue;
    }
    entry.reachable_from_root = true;
    entry.click_depth = current.depth;

    for (const link of entry.outgoing_links) {
      const target = link.split("#")[0];
      if (byPath.has(target) && !seen.has(target)) {
        queue.push({ path: target, depth: current.depth + 1 });
      }
    }
  }
}

function blockedSensitivePaths(source, entries) {
  return entries
    .map((entry) => {
      const rule = sensitiveRuleFor(source, entry.path);
      if (!rule) {
        return null;
      }
      return {
        path: entry.path,
        data_class: rule.data_class,
        reason: rule.reason,
        validation_command: rule.validation_command,
      };
    })
    .filter(Boolean);
}

function coverage(entries) {
  return {
    total_entries: entries.length,
    manual_entries: entries.filter((entry) => !entry.generated).length,
    generated_entries: entries.filter((entry) => entry.generated).length,
    public_navigable_entries: entries.filter((entry) => entry.visibility === "public" && entry.navigable).length,
    searchable_entries: entries.filter((entry) => entry.searchable).length,
    confidential_or_sensitive_entries: entries.filter((entry) => ["confidential", "sensitive"].includes(entry.data_class)).length,
    unclassified_entries: entries.filter((entry) => entry.owner_role === "Documentation Owner" && entry.data_class === "confidential").length,
    reachable_from_root: entries.filter((entry) => entry.reachable_from_root).length,
    orphan_entries: entries.filter((entry) => entry.navigable && !entry.reachable_from_root).length,
  };
}

function buildIndex(source) {
  const entries = buildEntries(source);
  applyReachability(entries);
  return {
    version: source.version,
    status: "generated",
    generated_by: "scripts/generate-docs-navigation.mjs",
    source_manifest_path: sourcePath,
    navigation_groups: source.navigation_groups,
    entries,
    routes: {
      role_routes: source.role_routes,
      task_routes: source.task_routes,
      current_pointers: source.current_pointers,
    },
    coverage: coverage(entries),
    ignored_paths: source.ignored_paths,
    blocked_sensitive_paths: blockedSensitivePaths(source, entries),
    validation_summary: {
      deny_by_default: true,
      network_used: false,
      generated_outputs_excluded_from_source_scan: true,
    },
  };
}

function link(label, target) {
  return `[${label}](${path.posix.relative("docs/navigation", target) || path.posix.basename(target)})`;
}

function renderRoutesTable(routes, routeField) {
  const rows = routes.map((route) => {
    const next = route.next_paths.map((target) => `\`${target}\``).join(", ");
    return `| \`${route.id}\` | ${route[routeField]} | \`${route.navigation_group}\` | \`${route.start_path}\` | ${next} | ${route.owner_role} | \`${route.validation_command}\` |`;
  });
  return ["| ID | Маршрут | Группа | Старт | Дальше | Владелец | Проверка |", "|---|---|---|---|---|---|---|", ...rows].join("\n");
}

function navigationGroupSortKey(entry) {
  if (entry.navigation_group !== "business") {
    return entry.path;
  }
  const exactOrder = new Map([
    ["docs/product/README.md", 10],
    ["docs/product-vision.md", 20],
    ["docs/product/bmc/README.md", 30],
    ["docs/stories.md", 40],
    ["docs/product/requirements/README.md", 50],
    ["docs/product/requirements/business-requirements.md", 51],
    ["docs/product/requirements/user-stories.md", 52],
    ["docs/product/requirements/non-functional-requirements.md", 53],
    ["docs/product/requirements/acceptance-criteria.md", 54],
    ["docs/product/backlog/README.md", 60],
    ["docs/product/backlog/product-backlog.md", 61],
    ["docs/product/roadmap/README.md", 70],
    ["docs/product/roadmap/roadmap-v0.1.md", 71],
    ["docs/product/hypotheses/README.md", 80],
    ["docs/product/hypotheses/hypothesis-board.md", 81],
    ["docs/product/hypotheses/hypothesis-validation.md", 82],
    ["docs/product/requirements/traceability-matrix.json", 90],
  ]);
  return `${String(exactOrder.get(entry.path) ?? 999).padStart(3, "0")}-${entry.path}`;
}

function renderNavigationMap(source, index) {
  const pointerRows = Object.entries(source.current_pointers).map(([key, value]) => `| \`${key}\` | \`${value}\` |`);
  const publicEntriesByGroup = new Map();
  for (const group of source.navigation_groups) {
    publicEntriesByGroup.set(group.id, []);
  }
  for (const entry of index.entries.filter((item) => item.visibility === "public" && item.navigable)) {
    if (!publicEntriesByGroup.has(entry.navigation_group)) {
      publicEntriesByGroup.set(entry.navigation_group, []);
    }
    publicEntriesByGroup.get(entry.navigation_group).push(entry);
  }
  const groupedEntries = source.navigation_groups
    .map((group) => {
      const rows = stableSort(publicEntriesByGroup.get(group.id).map((entry) => navigationGroupSortKey(entry)))
        .map((key) => publicEntriesByGroup.get(group.id).find((entry) => navigationGroupSortKey(entry) === key))
        .map((entry) => `- ${link(entry.title, entry.path)} - ${entry.owner_role}, \`${entry.lifecycle}\`.`);
      return `### ${group.title}

${group.description}

${rows.length > 0 ? rows.join("\n") : "- Публичных navigable маршрутов нет."}`;
    })
    .join("\n\n");
  const sourceEntries = [
    "docs/navigation/navigation-source.json",
    "docs/architecture/schemas/artifact-registry.json",
    "docs/architecture/schemas/artifact-hash-manifest.json",
    "docs/process/current/process-registry.md",
    "docs/release/mvp-release-evidence-pack.json",
  ].map((entryPath) => `- \`${entryPath}\``);

  return `# Карта Навигации Документации

Навигация: [DataCanvas](../../README.md) / [Документация](../README.md) / Карта навигации

Статус: generated
Источник: \`${sourcePath}\`

## Быстрые Маршруты

${groupedEntries}

## Маршруты По Ролям

${renderRoutesTable(source.role_routes, "role")}

## Маршруты По Задачам

${renderRoutesTable(source.task_routes, "task")}

## Источники Истины

${sourceEntries.join("\n")}

## Текущие Указатели

| Указатель | Значение |
|---|---|
${pointerRows.join("\n")}

## Evidence Hub И Registry

- Evidence hub: \`docs/knowledge/evidence-index.md\`
- Artifact registry: \`docs/architecture/schemas/artifact-registry.json\`
- Hash manifest: \`docs/architecture/schemas/artifact-hash-manifest.json\`
- Documentation index: \`docs/navigation/documentation-index.json\`
`;
}

function renderOrphanReport(index) {
  const rows = index.entries
    .filter((entry) => entry.navigable && !entry.reachable_from_root)
    .map((entry) => `| \`${entry.path}\` | ${entry.section} | ${entry.owner_role} | \`${entry.lifecycle}\` |`);
  return `# Отчет По Orphan Docs

Навигация: [DataCanvas](../../README.md) / [Документация](../README.md) / Orphan docs

Статус: generated
Источник: \`${sourcePath}\`

| Путь | Секция | Владелец | Lifecycle |
|---|---|---|---|
${rows.length > 0 ? rows.join("\n") : "| - | - | - | - |"}
`;
}

function findStaleStatus(source) {
  const findings = [];
  for (const scanPath of source.stale_status_checks.scan_paths) {
    if (!fs.existsSync(absolute(scanPath))) {
      continue;
    }
    const text = readText(scanPath);
    for (const rule of source.stale_status_checks.forbidden_patterns) {
      const pattern = new RegExp(rule.pattern, "i");
      if (pattern.test(text)) {
        findings.push({
          path: scanPath,
          rule_id: rule.id,
          reason: rule.reason,
        });
      }
    }
  }
  return findings;
}

function renderStaleStatusReport(source) {
  const findings = findStaleStatus(source);
  const rows = findings.map((finding) => `| \`${finding.path}\` | \`${finding.rule_id}\` | ${finding.reason} |`);
  return `# Отчет По Устаревшим Статусам

Навигация: [DataCanvas](../../README.md) / [Документация](../README.md) / Stale status

Статус: generated
Источник: \`${sourcePath}\`

| Путь | Правило | Причина |
|---|---|---|
${rows.length > 0 ? rows.join("\n") : "| - | - | Устаревшие статусы не найдены. |"}
`;
}

function buildOutputs(baseDir) {
  const source = readJson(sourcePath);
  const index = buildIndex(source);
  writeText(baseDir, "docs/navigation/documentation-index.json", JSON.stringify(index, null, 2));
  writeText(baseDir, "docs/navigation/navigation-map.md", renderNavigationMap(source, index));
  writeText(baseDir, "docs/navigation/orphan-docs-report.md", renderOrphanReport(index));
  writeText(baseDir, "docs/navigation/stale-status-report.md", renderStaleStatusReport(source));
}

function checkOutputs() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-docs-navigation-"));
  try {
    buildOutputs(tempDir);
    const diffs = [];
    for (const relativePath of outputPaths) {
      const expectedPath = path.join(tempDir, relativePath);
      if (!fs.existsSync(absolute(relativePath))) {
        diffs.push(`${relativePath}: missing committed output`);
        continue;
      }
      const expected = fs.readFileSync(expectedPath, "utf8");
      const actual = readText(relativePath);
      if (expected !== actual) {
        diffs.push(`${relativePath}: stale generated output`);
      }
    }
    if (diffs.length > 0) {
      for (const diff of diffs) {
        console.error(`ERROR: ${diff}`);
      }
      process.exit(1);
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  console.log("docs navigation generated outputs are current");
}

if (process.argv.includes("--check")) {
  checkOutputs();
} else {
  buildOutputs(root);
  console.log("docs navigation artifacts written");
}
