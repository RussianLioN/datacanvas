import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const ignoredDirs = new Set([".git", "node_modules"]);
const ignoredFiles = new Set(["package-lock.json"]);

const secretPatterns = [
  { name: "private_key", pattern: /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/ },
  { name: "openai_key", pattern: /sk-[A-Za-z0-9]{24,}/ },
  { name: "github_pat", pattern: /gh[pousr]_[A-Za-z0-9_]{30,}/ },
  { name: "generic_secret_assignment", pattern: /\b(?:api[_-]?key|secret|token|password)\b\s*[:=]\s*["']?(?!external_secret_manager_required|redacted|placeholder|example|disabled|planned|not_started)[A-Za-z0-9_\-]{20,}/i },
];

function walk(relativeDir = ".") {
  const absoluteDir = path.join(root, relativeDir);
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        files.push(...walk(relativePath));
      }
    } else if (entry.isFile() && !ignoredFiles.has(entry.name)) {
      files.push(relativePath.replace(/^\.\//, ""));
    }
  }

  return files;
}

function isText(buffer) {
  return !buffer.includes(0);
}

const findings = [];
for (const relativePath of walk()) {
  const absolutePath = path.join(root, relativePath);
  const buffer = fs.readFileSync(absolutePath);
  if (!isText(buffer)) {
    continue;
  }

  const text = buffer.toString("utf8");
  for (const { name, pattern } of secretPatterns) {
    if (pattern.test(text)) {
      findings.push(`${relativePath}: ${name}`);
    }
  }
}

if (findings.length > 0) {
  console.error("ERROR: potential secrets detected");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log("secret scan passed");
