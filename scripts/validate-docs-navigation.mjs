import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const sourcePath = "docs/navigation/navigation-source.json";
const indexPath = "docs/navigation/documentation-index.json";

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function requireFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    fail(`required file does not exist: ${relativePath}`);
  }
}

function duplicateIds(items) {
  const seen = new Set();
  const duplicates = [];
  for (const item of items) {
    if (seen.has(item.id)) {
      duplicates.push(item.id);
    }
    seen.add(item.id);
  }
  return duplicates;
}

function hasBreadcrumb(relativePath) {
  const firstLines = readText(relativePath).split("\n").slice(0, 8).join("\n");
  return /^Навигация:\s+/m.test(firstLines);
}

function matchesPrefix(relativePath, prefix) {
  return relativePath === prefix || relativePath.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`);
}

function repoPath(...parts) {
  return path.posix.normalize(path.posix.join(...parts)).replace(/^\.\//, "");
}

function isExternalLink(target) {
  return /^(https?:|mailto:|tel:)/i.test(target);
}

function parseMarkdownLinks(markdown, fromPath) {
  const links = [];
  const seen = new Set();
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
    const [pathPart] = target.split("#");
    if (!pathPart) {
      continue;
    }
    const normalized = repoPath(path.posix.dirname(fromPath), decodeURIComponent(pathPart));
    if (!seen.has(normalized)) {
      seen.add(normalized);
      links.push(normalized);
    }
  }
  return links;
}

function routeTargets(route) {
  return [route.start_path, ...route.next_paths];
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
    if (candidate !== relativePath && fs.existsSync(path.join(root, candidate))) {
      return candidate;
    }
    current = path.posix.dirname(current);
  }
  return "docs/README.md";
}

function isRestrictedForBusinessRoute(entry) {
  return entry.visibility === "restricted" || ["confidential", "sensitive"].includes(entry.data_class);
}

function isTechnicalOrGovernancePath(relativePath) {
  return [
    ".github",
    "AGENTS.md",
    "docs/architecture",
    "docs/navigation",
    "docs/plans",
    "docs/process",
    "schemas",
    "scripts",
    "tests",
  ].some((prefix) => matchesPrefix(relativePath, prefix));
}

function isBusinessRouteForbiddenPath(relativePath) {
  return [
    "docs/architecture/adr",
    "docs/architecture/schemas",
    "docs/process",
    "docs/plans",
    "docs/product/bmc/evidence",
    "docs/product/bmc/interviews",
    "artifacts/manual",
    "schemas",
    "scripts",
    "tests",
    ".github",
    "AGENTS.md",
  ].some((prefix) => matchesPrefix(relativePath, prefix));
}

const businessRouteJsonAllowlist = new Set([
  "docs/product/requirements/traceability-matrix.json",
]);

function isBusinessRouteForbiddenJson(relativePath) {
  return relativePath.endsWith(".json") && !businessRouteJsonAllowlist.has(relativePath);
}

function assertFixtureCases(label, fixturePath, handlers) {
  const fixture = readJson(fixturePath);
  for (const testCase of fixture.cases) {
    const handler = handlers[testCase.id];
    if (!handler) {
      fail(`${label} fixture case has no executable assertion: ${testCase.id}`);
    }
    handler(testCase);
  }
}

const source = readJson(sourcePath);
const index = readJson(indexPath);
const sourceSchema = readJson("schemas/docs-navigation-source.schema.json");
const indexSchema = readJson("schemas/docs-navigation-index.schema.json");
const registry = readJson("docs/architecture/schemas/artifact-registry.json");
const registryByPath = new Map(registry.artifacts.map((artifact) => [artifact.path, artifact]));

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

for (const [schema, data, label] of [
  [sourceSchema, source, "docs navigation source"],
  [indexSchema, index, "docs navigation index"],
]) {
  const validate = ajv.compile(schema);
  if (!validate(data)) {
    console.error(JSON.stringify(validate.errors, null, 2));
    fail(`${label} does not match schema`);
  }
}

execFileSync("node", ["scripts/generate-docs-navigation.mjs", "--check"], {
  cwd: root,
  stdio: "inherit",
});

const indexByPath = new Map(index.entries.map((entry) => [entry.path, entry]));
const sourceManagedByPath = new Map(source.managed_entries.map((entry) => [entry.path, entry]));
const configuredNavigationDomains = new Set(source.navigation_domains.map((domain) => domain.id));
const configuredNavigationGroups = new Set(source.navigation_groups.map((group) => group.id));

for (const entry of index.entries) {
  const expectedParentReadme = parentReadmeFor(entry.path);
  if (entry.parent_readme !== expectedParentReadme) {
    fail(`generated parent_readme mismatch for ${entry.path}: expected ${expectedParentReadme}, got ${entry.parent_readme}`);
  }
}

if (source.navigation_groups[0]?.id !== "business") {
  fail("business navigation group must be configured first");
}

if (source.navigation_domains[0]?.id !== "product") {
  fail("product navigation domain must be configured first");
}

if (configuredNavigationDomains.size !== source.navigation_domains.length) {
  fail("duplicate navigation domain ids");
}

if (configuredNavigationGroups.size !== source.navigation_groups.length) {
  fail("duplicate navigation group ids");
}

for (const group of source.navigation_groups) {
  if (!configuredNavigationDomains.has(group.navigation_domain)) {
    fail(`navigation group uses unknown domain: ${group.id} -> ${group.navigation_domain}`);
  }
}

for (const domain of source.navigation_domains) {
  if (!readText("docs/navigation/navigation-map.md").includes(`## ${domain.title}`)) {
    fail(`generated navigation map is missing domain: ${domain.id}`);
  }
}

for (const group of source.navigation_groups) {
  if (!readText("docs/navigation/navigation-map.md").includes(`### ${group.title}`)) {
    fail(`generated navigation map is missing group: ${group.id}`);
  }
}

for (const required of source.required_entrypoints) {
  requireFile(required.path);
  if (!indexByPath.has(required.path)) {
    fail(`required entrypoint is missing from generated index: ${required.path}`);
  }
}

for (const sectionReadme of [
  "docs/product/README.md",
  "docs/process/README.md",
  "docs/architecture/README.md",
  "docs/release/README.md",
  "docs/sprints/README.md",
  "docs/plans/README.md",
  "docs/knowledge/README.md",
]) {
  requireFile(sectionReadme);
}

const xlsxNavigationTargets = [
  "docs/product/sources/reference/datacanvas-backlog-source-sanitized.xlsx",
  "docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.xlsx",
];

for (const navigationEntry of [
  "README.md",
  "docs/README.md",
  "docs/product/README.md",
  "docs/product/sources/README.md",
]) {
  const linkedPaths = new Set(parseMarkdownLinks(readText(navigationEntry), navigationEntry));
  for (const xlsxPath of xlsxNavigationTargets) {
    if (!linkedPaths.has(xlsxPath)) {
      fail(`XLSX source is missing from human-readable navigation: ${navigationEntry} -> ${xlsxPath}`);
    }
  }
}

for (const entry of index.entries.filter((item) => item.path.startsWith("docs/") && item.path.endsWith("README.md") && !item.generated)) {
  const ignored = source.ignored_paths.find((ignoredEntry) => matchesPrefix(entry.path, ignoredEntry.path));
  if (!sourceManagedByPath.has(entry.path) && !ignored) {
    fail(`nested README must be managed or explicitly ignored: ${entry.path}`);
  }
}

const routeDuplicates = [
  ...duplicateIds(source.role_routes),
  ...duplicateIds(source.task_routes),
];
if (routeDuplicates.length > 0) {
  fail(`duplicate route ids: ${routeDuplicates.join(", ")}`);
}

for (const route of [...source.role_routes, ...source.task_routes]) {
  if (!configuredNavigationDomains.has(route.navigation_domain)) {
    fail(`route uses unknown navigation domain: ${route.id} -> ${route.navigation_domain}`);
  }
  if (!configuredNavigationGroups.has(route.navigation_group)) {
    fail(`route uses unknown navigation group: ${route.id} -> ${route.navigation_group}`);
  }
  for (const target of routeTargets(route)) {
    requireFile(target);
    const generatedEntry = indexByPath.get(target);
    if (!generatedEntry) {
      fail(`route target is missing from generated index: ${route.id} -> ${target}`);
    }
    if (!configuredNavigationGroups.has(generatedEntry.navigation_group)) {
      fail(`route target has unknown navigation group: ${route.id} -> ${target}`);
    }
    if (route.navigation_group === "business") {
      if (generatedEntry.navigation_group !== "business") {
        fail(`business route points outside business navigation group: ${route.id} -> ${target}`);
      }
      const ignored = source.ignored_paths.find((entry) => matchesPrefix(target, entry.path));
      if (ignored) {
        fail(`business route points to ignored path: ${route.id} -> ${target}`);
      }
      if (isRestrictedForBusinessRoute(generatedEntry)) {
        fail(`business route points to restricted/confidential/sensitive path: ${route.id} -> ${target}`);
      }
      if (isBusinessRouteForbiddenPath(target)) {
        fail(`business route points to non-business primary source: ${route.id} -> ${target}`);
      }
      if (isBusinessRouteForbiddenJson(target)) {
        fail(`business route points to machine-readable JSON instead of a human route: ${route.id} -> ${target}`);
      }
    }
  }
}

const productReadme = readText("docs/product/README.md");
const productReadmeLinks = parseMarkdownLinks(productReadme, "docs/product/README.md");
const productReadmeLinkSet = new Set(productReadmeLinks);
for (const entry of index.entries) {
  if (!matchesPrefix(entry.path, "docs/product") || entry.generated || entry.visibility !== "public") {
    continue;
  }
  const ignored = source.ignored_paths.find((ignoredEntry) => matchesPrefix(entry.path, ignoredEntry.path));
  if (ignored) {
    continue;
  }
  const isManaged = sourceManagedByPath.has(entry.path);
  const isProductReadmeLinked = productReadmeLinkSet.has(entry.path);
  if (!isManaged && !isProductReadmeLinked) {
    fail(`public product document is missing from docs/product/README.md or managed navigation source: ${entry.path}`);
  }
}

for (const entry of index.entries) {
  if (!entry.owner_role || !entry.lifecycle || !entry.data_class || !entry.visibility) {
    fail(`navigation entry is missing required metadata: ${entry.path}`);
  }

  if (!configuredNavigationGroups.has(entry.navigation_group)) {
    fail(`navigation entry has unknown group: ${entry.path}`);
  }

  if (!configuredNavigationDomains.has(entry.navigation_domain)) {
    fail(`navigation entry has unknown domain: ${entry.path}`);
  }

  if (["confidential", "sensitive"].includes(entry.data_class)) {
    if (entry.visibility === "public" || entry.searchable || entry.navigable) {
      fail(`sensitive/confidential path is exposed in public navigation: ${entry.path}`);
    }
  }

  if (entry.generated && !entry.canonical_source) {
    fail(`generated entry is missing canonical_source: ${entry.path}`);
  }

  if (entry.visibility === "public" && ["active", "accepted"].includes(entry.lifecycle)) {
    const isRedirect = Boolean(entry.canonical_source) && entry.searchable && !entry.navigable;
    if (!isRedirect && (!entry.navigable || !entry.searchable)) {
      fail(`public active entry must be navigable and searchable: ${entry.path}`);
    }
    if (!isRedirect && (!entry.reachable_from_root || entry.click_depth === null || entry.click_depth > 3)) {
      fail(`public active entry is not reachable from root within 3 clicks: ${entry.path}`);
    }
  }

  if (entry.navigation_group === "business" && isTechnicalOrGovernancePath(entry.path)) {
    fail(`technical/governance document cannot use business navigation group: ${entry.path}`);
  }

  if (entry.navigation_group === "business" && entry.navigation_domain !== "product") {
    fail(`business navigation group must stay in product domain: ${entry.path}`);
  }

  if (entry.navigation_group === "business" && entry.visibility === "public" && entry.navigable) {
    if (!entry.artifact_registry_id) {
      fail(`public navigable business entry is missing artifact registry id: ${entry.path}`);
    }
    if (!entry.reachable_from_root || entry.click_depth === null || entry.click_depth > 2) {
      fail(`business entry is not reachable from root within 2 clicks: ${entry.path}`);
    }
  }
}

for (const sourceEntry of source.managed_entries) {
  const generatedEntry = indexByPath.get(sourceEntry.path);
  if (!generatedEntry) {
    fail(`managed entry is missing from generated index: ${sourceEntry.path}`);
  }
  if (sourceEntry.critical) {
    for (const key of ["owner_role", "lifecycle", "visibility"]) {
      if (!generatedEntry[key]) {
        fail(`critical entry is missing ${key}: ${sourceEntry.path}`);
      }
    }
  }
  if (generatedEntry.navigation_group !== sourceEntry.navigation_group) {
    fail(`managed entry has wrong navigation group in generated index: ${sourceEntry.path}`);
  }
  if (generatedEntry.navigation_domain !== sourceEntry.navigation_domain) {
    fail(`managed entry has wrong navigation domain in generated index: ${sourceEntry.path}`);
  }
  if (sourceEntry.breadcrumb_required && sourceEntry.path.endsWith(".md") && !generatedEntry.generated) {
    if (!hasBreadcrumb(sourceEntry.path)) {
      fail(`manual markdown entry is missing breadcrumb: ${sourceEntry.path}`);
    }
  }
  if (sourceEntry.artifact_registry_required) {
    const artifact = registryByPath.get(sourceEntry.path);
    if (!artifact) {
      fail(`critical navigation artifact is missing from artifact registry: ${sourceEntry.path}`);
    }
    if (generatedEntry.artifact_registry_id !== artifact.id) {
      fail(`navigation index has wrong artifact registry id for ${sourceEntry.path}`);
    }
  }
}

for (const blocked of index.blocked_sensitive_paths) {
  const entry = indexByPath.get(blocked.path);
  if (!entry) {
    fail(`blocked sensitive path is missing from entries: ${blocked.path}`);
  }
  if (entry.visibility === "public" || entry.searchable || entry.navigable) {
    fail(`blocked sensitive path is exposed: ${blocked.path}`);
  }
}

const criticalWithoutRegistry = index.entries.filter(
  (entry) => entry.visibility === "public" && ["active", "accepted"].includes(entry.lifecycle) && !entry.artifact_registry_id,
);
if (criticalWithoutRegistry.length > 0) {
  fail(`public active entries missing artifact registry ids: ${criticalWithoutRegistry.map((entry) => entry.path).join(", ")}`);
}

const forbiddenPublicReachablePatterns = [
  { id: "absolute-local-user-path", pattern: /\/Users\// },
  { id: "file-url", pattern: /file:\/\//i },
  { id: "raw-bmc-interview-path", pattern: /docs\/product\/bmc\/interviews/i },
  { id: "raw-bmc-evidence-path", pattern: /docs\/product\/bmc\/evidence/i },
  { id: "raw-uat-runtime-path", pattern: /docs\/product\/ux\/human-review-session-real/i },
  { id: "security-leakage-inventory-path", pattern: /docs\/architecture\/security\/real-uat-leakage-guard/i },
];
for (const entry of index.entries) {
  if (!entry.reachable_from_root || entry.visibility !== "public" || entry.format !== "md") {
    continue;
  }
  const text = readText(entry.path);
  for (const rule of forbiddenPublicReachablePatterns) {
    if (rule.pattern.test(text)) {
      fail(`public-reachable doc contains forbidden ${rule.id}: ${entry.path}`);
    }
  }
}

assertFixtureCases("positive docs navigation", "tests/docs-navigation/positive/cases.json", {
  "positive-business-route-to-requirements": () => {
    const route = source.task_routes.find((item) => item.id === "task-find-business-requirements");
    if (!route || route.navigation_group !== "business") {
      fail("positive fixture missing business requirements route");
    }
    if (!routeTargets(route).includes("docs/product/requirements/business-requirements.md")) {
      fail("business requirements route must lead to BT");
    }
    if (routeTargets(route).some((target) => matchesPrefix(target, "docs/plans"))) {
      fail("business requirements route must not pass through technical plans");
    }
  },
  "positive-product-index-canonical-artifacts": () => {
    const requiredPaths = [
      "docs/product-vision.md",
      "docs/product/change-orders/README.md",
      "docs/product/bmc/README.md",
      "docs/product/requirements/user-stories.md",
      "docs/product/requirements/README.md",
      "docs/product/backlog/README.md",
      "docs/product/sources/README.md",
      "docs/product/roadmap/README.md",
      "docs/product/hypotheses/README.md",
      "docs/product/analysis/README.md",
      "docs/product/specs/README.md",
    ];
    for (const requiredPath of requiredPaths) {
      if (!productReadmeLinkSet.has(requiredPath)) {
        fail(`product index is missing canonical business artifact: ${requiredPath}`);
      }
    }
    let previousIndex = -1;
    for (const requiredPath of requiredPaths) {
      const currentIndex = productReadmeLinks.indexOf(requiredPath);
      if (currentIndex <= previousIndex) {
        fail(`product index has wrong workflow order near: ${requiredPath}`);
      }
      previousIndex = currentIndex;
    }
  },
  "positive-generated-navigation-grouped": () => {
    const map = readText("docs/navigation/navigation-map.md");
    for (const group of source.navigation_groups) {
      if (!map.includes(`### ${group.title}`)) {
        fail(`navigation map is missing generated group section: ${group.id}`);
      }
    }
  },
  "positive-restricted-evidence-not-business-route": () => {
    const businessTargets = new Set(source.task_routes.filter((route) => route.navigation_group === "business").flatMap(routeTargets));
    for (const blocked of index.blocked_sensitive_paths) {
      if (businessTargets.has(blocked.path)) {
        fail(`restricted evidence is used as business route: ${blocked.path}`);
      }
    }
  },
  "positive-nested-readmes-managed-or-ignored": () => {
    for (const entry of index.entries.filter((item) => item.path.startsWith("docs/") && item.path.endsWith("README.md") && !item.generated)) {
      const ignored = source.ignored_paths.find((ignoredEntry) => matchesPrefix(entry.path, ignoredEntry.path));
      if (!sourceManagedByPath.has(entry.path) && !ignored) {
        fail(`README missing managed/ignored classification: ${entry.path}`);
      }
    }
  },
});

assertFixtureCases("negative docs navigation", "tests/docs-navigation/negative/cases.json", {
  "negative-route-group-not-configured": () => {
    for (const route of [...source.role_routes, ...source.task_routes]) {
      if (!configuredNavigationGroups.has(route.navigation_group)) {
        fail(`route uses unknown navigation group: ${route.id}`);
      }
    }
  },
  "negative-business-route-to-plan": () => {
    for (const route of source.task_routes.filter((item) => item.navigation_group === "business")) {
      if (routeTargets(route).some((target) => matchesPrefix(target, "docs/plans"))) {
        fail(`business route points to plan: ${route.id}`);
      }
    }
  },
  "negative-business-route-to-schema-or-script": () => {
    for (const route of source.task_routes.filter((item) => item.navigation_group === "business")) {
      if (routeTargets(route).some((target) => matchesPrefix(target, "schemas") || matchesPrefix(target, "scripts"))) {
        fail(`business route points to schema/script: ${route.id}`);
      }
    }
  },
  "negative-business-route-to-adr-proc-or-raw-evidence": () => {
    for (const route of source.task_routes.filter((item) => item.navigation_group === "business")) {
      if (routeTargets(route).some((target) => isBusinessRouteForbiddenPath(target))) {
        fail(`business route points to forbidden non-business source: ${route.id}`);
      }
    }
  },
  "negative-business-route-to-machine-json": () => {
    for (const route of source.task_routes.filter((item) => item.navigation_group === "business")) {
      if (routeTargets(route).some((target) => isBusinessRouteForbiddenJson(target))) {
        fail(`business route points to machine-readable JSON: ${route.id}`);
      }
    }
  },
  "negative-public-business-without-artifact-id": () => {
    const offenders = index.entries.filter(
      (entry) => entry.navigation_group === "business" && entry.visibility === "public" && entry.navigable && !entry.artifact_registry_id,
    );
    if (offenders.length > 0) {
      fail(`public business entries missing artifact ids: ${offenders.map((entry) => entry.path).join(", ")}`);
    }
  },
  "negative-technical-backlog-as-business": () => {
    const entry = indexByPath.get("docs/product/backlog/technical-backlog.md");
    if (!entry || entry.navigation_group === "business") {
      fail("technical-backlog.md must not be classified as business");
    }
  },
  "negative-public-confidential-evidence": () => {
    const offenders = index.entries.filter(
      (entry) =>
        entry.visibility === "public" &&
        (["confidential", "sensitive"].includes(entry.data_class) ||
          matchesPrefix(entry.path, "docs/product/bmc/interviews") ||
          matchesPrefix(entry.path, "docs/product/bmc/evidence") ||
          matchesPrefix(entry.path, "artifacts/manual")),
    );
    if (offenders.length > 0) {
      fail(`confidential/raw evidence exposed publicly: ${offenders.map((entry) => entry.path).join(", ")}`);
    }
  },
  "negative-public-product-doc-not-routed": () => {
    for (const entry of index.entries.filter((item) => matchesPrefix(item.path, "docs/product") && item.visibility === "public")) {
      if (!sourceManagedByPath.has(entry.path) && !productReadmeLinkSet.has(entry.path)) {
        fail(`public product document is not routed: ${entry.path}`);
      }
    }
  },
  "negative-public-reachable-local-path": () => {
    for (const entry of index.entries.filter((item) => item.reachable_from_root && item.visibility === "public" && item.format === "md")) {
      if (/\/Users\//.test(readText(entry.path))) {
        fail(`public-reachable doc contains absolute local path: ${entry.path}`);
      }
    }
  },
  "negative-stale-generated-map": () => {
    execFileSync("node", ["scripts/generate-docs-navigation.mjs", "--check"], {
      cwd: root,
      stdio: "inherit",
    });
  },
});

for (const [pathKey, sourceEntry] of sourceManagedByPath) {
  const generatedEntry = indexByPath.get(pathKey);
  if (generatedEntry && generatedEntry.navigation_group !== sourceEntry.navigation_group) {
    fail(`source/index navigation group mismatch: ${pathKey}`);
  }
  if (generatedEntry && generatedEntry.navigation_domain !== sourceEntry.navigation_domain) {
    fail(`source/index navigation domain mismatch: ${pathKey}`);
  }
}

console.log("docs navigation validation passed");
