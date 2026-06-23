import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const htmlPath = process.argv[2] ?? "artifacts/examples/presentation-minimal.html";
const html = fs.readFileSync(path.join(root, htmlPath), "utf8");

const forbiddenPatterns = [
  /raw trace/i,
  /hidden notes/i,
  /internal prompt/i,
  /tool output/i,
  /SECRET[A-Z0-9_]*=/,
  /\/Users\//,
  /file:\/\//i,
];

for (const pattern of forbiddenPatterns) {
  if (pattern.test(html)) {
    console.error(`ERROR: export failed sanitization pattern: ${pattern}`);
    process.exit(1);
  }
}

if (!html.includes("data-fact-ids=")) {
  console.error("ERROR: export does not expose fact trace markers");
  process.exit(1);
}

console.log(`export sanitization passed: ${htmlPath}`);

