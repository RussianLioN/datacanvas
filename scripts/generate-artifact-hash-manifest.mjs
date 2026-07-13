import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const sourceRegistryPath = "docs/architecture/schemas/artifact-registry.json";
const outputPath = "docs/architecture/schemas/artifact-hash-manifest.json";
const checkMode = process.argv.includes("--check");
const exclusions = [
  {
    path: outputPath,
    reason: "self-referential generated manifest",
  },
  {
    path: "artifacts/documentation-archive/datacanvas-main-documentation.zip",
    reason: "self-referential generated documentation package validated by npm run validate:documentation-archive",
  },
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function sha256File(relativePath) {
  const content = fs.readFileSync(path.join(root, relativePath));
  return crypto.createHash("sha256").update(content).digest("hex");
}

function buildManifest() {
  const registry = readJson(sourceRegistryPath);
  const excludedPaths = new Set(exclusions.map((item) => item.path));
  const entries = registry.artifacts
    .filter((artifact) => !excludedPaths.has(artifact.path))
    .map((artifact) => ({
      artifact_id: artifact.id,
      path: artifact.path,
      sha256: sha256File(artifact.path),
    }));

  return {
    version: registry.version,
    status: "generated",
    source_registry_path: sourceRegistryPath,
    algorithm: "sha256",
    entries,
    exclusions,
  };
}

const manifest = buildManifest();
const rendered = `${JSON.stringify(manifest, null, 2)}\n`;

if (checkMode) {
  const current = fs.existsSync(path.join(root, outputPath))
    ? fs.readFileSync(path.join(root, outputPath), "utf8")
    : null;
  if (current !== rendered) {
    console.error(`ERROR: artifact hash manifest is stale: ${outputPath}`);
    console.error("Run: node scripts/generate-artifact-hash-manifest.mjs");
    process.exit(1);
  }
  console.log("artifact hash manifest is current");
} else {
  fs.writeFileSync(path.join(root, outputPath), rendered);
  console.log(`artifact hash manifest written: ${outputPath}`);
}
