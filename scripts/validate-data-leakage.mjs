import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const manifestPath = "docs/architecture/security/data-leakage-manifest.json";
const realUatGuardPath = "docs/architecture/security/real-uat-leakage-guard.json";

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readXlsxText(relativePath) {
  const script = `
import sys, zipfile
path = sys.argv[1]
with zipfile.ZipFile(path) as z:
    for name in z.namelist():
        lowered = name.lower()
        if not (lowered.endswith(".xml") or lowered.endswith(".rels") or lowered.endswith(".txt") or lowered.endswith(".vml")):
            continue
        data = z.read(name).decode("utf-8", errors="ignore")
        print(f"--- {name} ---")
        print(data)
`;
  const result = spawnSync("python3", ["-c", script, path.join(root, relativePath)], {
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
  if (result.status !== 0) {
    fail(`failed to inspect XLSX leakage target ${relativePath}: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function readScanText(relativePath) {
  if (/\.xlsx$/iu.test(relativePath)) {
    return readXlsxText(relativePath);
  }
  return readText(relativePath);
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function requireFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    fail(`required file does not exist: ${relativePath}`);
  }
}

function matchesPrefix(relativePath, prefix) {
  return relativePath === prefix || relativePath.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`);
}

function matchesPathStem(relativePath, prefix) {
  return matchesPrefix(relativePath, prefix) || relativePath.startsWith(prefix);
}

const forbiddenPatterns = [
  { class: "secret", name: "private_key", pattern: /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/ },
  { class: "secret", name: "openai_key", pattern: /sk-[A-Za-z0-9]{24,}/ },
  { class: "secret", name: "github_pat", pattern: /gh[pousr]_[A-Za-z0-9_]{30,}/ },
  { class: "secret", name: "secret_assignment", pattern: /\b(?:api[_-]?key|secret|token|password)\b\s*[:=]\s*["']?(?!redacted|placeholder|example|disabled|not_started)[A-Za-z0-9_\-]{16,}/i },
  { class: "pii", name: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  { class: "pii", name: "phone", pattern: /(?:\+?\d{1,3}[\s-])?(?:\(?\d{3}\)?[\s-])\d{3}[\s-]\d{4}\b/ },
  { class: "local_path", name: "mac_user_path", pattern: /\/Users\/[A-Za-z0-9._-]+\// },
  { class: "local_path", name: "file_url", pattern: /file:\/\//i },
  { class: "raw_trace", name: "raw_trace", pattern: /raw trace/i },
  { class: "internal_prompt", name: "internal_prompt", pattern: /internal prompt/i },
  { class: "tool_output", name: "tool_output", pattern: /tool output/i }
];

function assertSyntheticCoverage(enabledClasses) {
  const probes = [
    { class: "secret", text: `api_${"key"}=${"abcdefghijklmnopqrstuvwxyz123456"}` },
    { class: "pii", text: "person@example.com" },
    { class: "pii", text: "+1 415 555 1212" },
    { class: "local_path", text: "/Users/example/project" },
    { class: "raw_trace", text: "raw trace" },
    { class: "internal_prompt", text: "internal prompt" },
    { class: "tool_output", text: "tool output" }
  ];

  for (const probe of probes) {
    if (!enabledClasses.has(probe.class)) {
      continue;
    }
    const matched = forbiddenPatterns.some((item) => item.class === probe.class && item.pattern.test(probe.text));
    if (!matched) {
      fail(`synthetic leakage probe is not covered: ${probe.class}`);
    }
  }
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const schema = readJson("schemas/data-leakage-manifest.schema.json");
const manifest = readJson(manifestPath);
const validate = ajv.compile(schema);

if (!validate(manifest)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  fail("data leakage manifest does not match schema");
}

if (fs.existsSync(path.join(root, realUatGuardPath))) {
  const guardSchema = readJson("schemas/real-uat-leakage-guard.schema.json");
  const guard = readJson(realUatGuardPath);
  const validateGuard = ajv.compile(guardSchema);
  if (!validateGuard(guard)) {
    console.error(JSON.stringify(validateGuard.errors, null, 2));
    fail("real UAT leakage guard does not match schema");
  }

  const scanTargetsByPath = new Map(manifest.scan_targets.map((target) => [target.path, target]));
  for (const target of guard.conditional_targets) {
    if (!fs.existsSync(path.join(root, target.path))) {
      continue;
    }
    const scanTarget = scanTargetsByPath.get(target.path);
    if (!scanTarget) {
      fail(`real UAT artifact exists but is missing from data leakage scan_targets: ${target.path}`);
    }
    if (scanTarget.data_class !== target.data_class || scanTarget.sink !== target.sink) {
      fail(`real UAT artifact has wrong leakage classification: ${target.path}`);
    }
  }
}

for (const policyPath of manifest.policy_paths) {
  requireFile(policyPath);
}

const enabledClasses = new Set(manifest.forbidden_classes);
assertSyntheticCoverage(enabledClasses);

const scanTargetIds = new Set();
const scanTargetsByPath = new Map();
for (const target of manifest.scan_targets) {
  if (scanTargetIds.has(target.id)) {
    fail(`duplicate data leakage scan target id: ${target.id}`);
  }
  scanTargetIds.add(target.id);
  if (scanTargetsByPath.has(target.path)) {
    fail(`duplicate data leakage scan target path: ${target.path}`);
  }
  scanTargetsByPath.set(target.path, target);
  requireFile(target.path);
  const text = readScanText(target.path);
  for (const forbidden of forbiddenPatterns) {
    if (!enabledClasses.has(forbidden.class)) {
      continue;
    }
    if (forbidden.pattern.test(text)) {
      fail(`data leakage finding in ${target.path}: ${forbidden.class}/${forbidden.name}`);
    }
  }
}

const navigationSource = readJson("docs/navigation/navigation-source.json");
const navigationIndex = readJson("docs/navigation/documentation-index.json");
const explicitExclusions = manifest.explicit_exclusions ?? [];

for (const rule of navigationSource.sensitive_path_rules) {
  const coveredByScan = [...scanTargetsByPath.keys()].some((scanPath) => matchesPathStem(scanPath, rule.path_prefix));
  const coveredByExclusion = explicitExclusions.some((exclusion) => matchesPathStem(rule.path_prefix, exclusion.path_prefix));
  if (!coveredByScan && !coveredByExclusion) {
    fail(`navigation sensitive path rule is missing leakage manifest coverage: ${rule.path_prefix}`);
  }
}

const publicSurfaceClasses = new Set(["secret", "pii", "local_path", "raw_trace", "internal_prompt", "tool_output"]);
for (const entry of navigationIndex.entries) {
  if (!entry.reachable_from_root || entry.visibility !== "public" || !["md", "json"].includes(entry.format)) {
    continue;
  }
  requireFile(entry.path);
  const text = readScanText(entry.path);
  for (const forbidden of forbiddenPatterns) {
    if (!publicSurfaceClasses.has(forbidden.class)) {
      continue;
    }
    if (forbidden.pattern.test(text)) {
      fail(`public navigation surface leakage finding in ${entry.path}: ${forbidden.class}/${forbidden.name}`);
    }
  }
}

for (const gate of ["npm run scan:secrets", "npm run validate:export", "npm run validate:security-foundation"]) {
  if (!manifest.required_gates.includes(gate)) {
    fail(`data leakage manifest is missing required gate: ${gate}`);
  }
}

console.log("data leakage validation passed");
