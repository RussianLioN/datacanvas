import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const htmlPath = process.argv[2] ?? "artifacts/examples/presentation-minimal.html";
const specPath = process.argv[3] ?? "tests/golden/presentation-spec-minimal.json";

const html = fs.readFileSync(path.join(root, htmlPath), "utf8");
const spec = JSON.parse(fs.readFileSync(path.join(root, specPath), "utf8"));

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

if (!html.startsWith("<!doctype html>")) {
  fail("HTML export must start with <!doctype html>");
}

if (!html.includes('<meta name="viewport" content="width=device-width, initial-scale=1">')) {
  fail("HTML export must include responsive viewport meta");
}

const slideCount = (html.match(/class="slide"/g) ?? []).length;
if (slideCount !== spec.slides.length) {
  fail(`HTML slide count ${slideCount} does not match PresentationSpec slide count ${spec.slides.length}`);
}

const factMarkerCount = (html.match(/data-fact-ids=/g) ?? []).length;
const claimCount = spec.slides.reduce((total, slide) => total + slide.claims.length, 0);
if (factMarkerCount !== claimCount) {
  fail(`HTML fact marker count ${factMarkerCount} does not match claim count ${claimCount}`);
}

for (const slide of spec.slides) {
  if (!html.includes(`data-slide-id="${slide.slide_id}"`)) {
    fail(`HTML export is missing slide id: ${slide.slide_id}`);
  }

  for (const claim of slide.claims) {
    if (claim.text.length > 180) {
      fail(`Claim is too long for baseline slide layout: ${claim.text}`);
    }
  }
}

const forbiddenHiddenPatterns = [
  /display\s*:\s*none/i,
  /visibility\s*:\s*hidden/i,
  /<script\b/i,
  /<!--/,
];

for (const pattern of forbiddenHiddenPatterns) {
  if (pattern.test(html)) {
    fail(`HTML export contains forbidden hidden/script/comment pattern: ${pattern}`);
  }
}

console.log(`visual baseline passed: ${htmlPath}`);

