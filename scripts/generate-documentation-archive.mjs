import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { buildDocumentationArchive } from "./lib/documentation-archive.mjs";

const root = process.cwd();
const contractPath = "docs/process/universal-documentation-workflow/documentation-archive-contract.json";
const contract = JSON.parse(fs.readFileSync(path.join(root, contractPath), "utf8"));
const chain = JSON.parse(fs.readFileSync(path.join(root, contract.source_chain_path), "utf8"));
const expected = buildDocumentationArchive(root, contract, chain);
const outputPath = path.join(root, contract.output_path);

if (process.argv.includes("--check")) {
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath) : null;
  if (!current || !current.equals(expected)) {
    console.error(`ERROR: архив документации устарел: ${contract.output_path}`);
    console.error("Запустите: npm run generate:documentation-archive");
    process.exit(1);
  }
  console.log("архив документации актуален");
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, expected);
  console.log(`архив документации записан: ${contract.output_path}`);
}
