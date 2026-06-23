import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const normalizedPath = process.argv[2] ?? "tests/golden/normalized-data-minimal.json";
const specPath = process.argv[3] ?? "tests/golden/presentation-spec-minimal.json";
const claimMapPath = process.argv[4] ?? "tests/golden/claim-map-minimal.json";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

const normalized = readJson(normalizedPath);
const firstFact = normalized.facts[0];

const spec = {
  spec_id: normalized.source_package_id.replace(/^PKG-/, "SPEC-"),
  schema_version: "0.1.0",
  source_package_id: normalized.source_package_id,
  title: "DataCanvas Demo",
  slides: [
    {
      slide_id: "SLIDE-001",
      title: "DataCanvas",
      claims: [
        {
          text: firstFact.claim,
          fact_ids: [firstFact.fact_id],
        },
      ],
    },
  ],
};

const claimMap = {
  spec_id: spec.spec_id,
  source_package_id: spec.source_package_id,
  claims: spec.slides.flatMap((slide) =>
    slide.claims.map((claim) => ({
      slide_id: slide.slide_id,
      claim_text: claim.text,
      fact_ids: claim.fact_ids,
    })),
  ),
};

writeJson(specPath, spec);
writeJson(claimMapPath, claimMap);

console.log(`presentation spec written: ${specPath}`);
console.log(`claim map written: ${claimMapPath}`);

