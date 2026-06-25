import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const specPath = process.argv[2] ?? "tests/golden/presentation-spec-minimal.json";
const htmlPath = process.argv[3] ?? "artifacts/examples/presentation-minimal.html";
const resultPath = process.argv[4] ?? "artifacts/examples/render-result-minimal.json";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function ensureDir(relativePath) {
  fs.mkdirSync(path.dirname(path.join(root, relativePath)), { recursive: true });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sha256File(relativePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relativePath))).digest("hex");
}

const spec = readJson(specPath);
const slides = spec.slides
  .map((slide) => {
    const claims = slide.claims
      .map((claim) => {
        const factIds = claim.fact_ids.join(",");
        return `<li data-fact-ids="${escapeHtml(factIds)}">${escapeHtml(claim.text)}</li>`;
      })
      .join("\n        ");
    return `<section class="slide" data-slide-id="${escapeHtml(slide.slide_id)}">
      <h2>${escapeHtml(slide.title)}</h2>
      <ul>
        ${claims}
      </ul>
    </section>`;
  })
  .join("\n");

const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(spec.title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: #f7f7f5; color: #1f2933; }
    main { max-width: 960px; margin: 0 auto; padding: 32px; }
    .slide { background: #ffffff; border: 1px solid #d8dee4; border-radius: 8px; padding: 32px; margin: 0 0 24px; }
    h1, h2 { margin-top: 0; }
    li { margin: 12px 0; line-height: 1.45; }
  </style>
</head>
<body>
  <main data-source-spec-id="${escapeHtml(spec.spec_id)}">
    <h1>${escapeHtml(spec.title)}</h1>
${slides}
  </main>
</body>
</html>
`;

ensureDir(htmlPath);
fs.writeFileSync(path.join(root, htmlPath), html);

const result = {
  render_id: spec.spec_id.replace(/^SPEC-/, "RENDER-"),
  schema_version: "0.1.0",
  source_spec_id: spec.spec_id,
  outputs: [
    {
      artifact_id: `ART-render-${spec.spec_id.replace(/^SPEC-/, "")}`,
      format: "html",
      path: htmlPath,
      sha256: sha256File(htmlPath),
    },
  ],
};

fs.writeFileSync(path.join(root, resultPath), `${JSON.stringify(result, null, 2)}\n`);

console.log(`HTML export written: ${htmlPath}`);
console.log(`render result written: ${resultPath}`);
