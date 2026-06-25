import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const sourceRegistryPath = "docs/architecture/schemas/artifact-registry.json";
const outputPath = "docs/architecture/schemas/artifact-hash-manifest.json";
const exclusions = [
  {
    path: outputPath,
    reason: "self-referential generated manifest",
  },
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function sha256File(relativePath) {
  const content = fs.readFileSync(path.join(root, relativePath));
  return crypto.createHash("sha256").update(content).digest("hex");
}

const registry = readJson(sourceRegistryPath);
const excludedPaths = new Set(exclusions.map((item) => item.path));
const entries = registry.artifacts
  .filter((artifact) => !excludedPaths.has(artifact.path))
  .map((artifact) => ({
    artifact_id: artifact.id,
    path: artifact.path,
    sha256: sha256File(artifact.path),
  }));

const manifest = {
  version: registry.version,
  status: "generated",
  source_registry_path: sourceRegistryPath,
  algorithm: "sha256",
  entries,
  exclusions,
};

fs.writeFileSync(path.join(root, outputPath), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`artifact hash manifest written: ${outputPath}`);
