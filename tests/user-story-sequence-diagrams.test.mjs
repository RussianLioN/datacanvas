import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateUserStorySequenceDiagrams } from "../scripts/render-user-story-sequence-diagrams.mjs";

const root = process.cwd();
const mapPath = "docs/product/requirements/user-story-decomposition-map.json";
const sourceDirectory = "docs/product/requirements/sequence-diagrams";
const artifactDirectory = "artifacts/evidence/co-2026-003/user-story-sequence-diagrams";
const overviewPath = `${sourceDirectory}/README.md`;

test("принятый набор содержит диаграммы для всех принятых детализированных историй", () => {
  validateUserStorySequenceDiagrams();
  const decomposition = JSON.parse(fs.readFileSync(path.join(root, mapPath), "utf8"));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, artifactDirectory, "manifest.json"), "utf8"));
  assert.ok(decomposition.child_stories.every((story) => story.sequence_diagram_status === "owner_approved"));
  assert.equal(manifest.status, "owner_approved");
});

test("GitHub-обзор связывает каждый принятый сценарий с исходником и рендерами", () => {
  const decomposition = JSON.parse(fs.readFileSync(path.join(root, mapPath), "utf8"));
  const overview = fs.readFileSync(path.join(root, overviewPath), "utf8");

  assert.match(overview, /Диаграммы последовательности пользовательских историй 2026/u);
  assert.match(overview, /принятый набор/ui);
  assert.match(overview, /manifest\.json/u);
  for (const story of decomposition.child_stories) {
    assert.match(overview, new RegExp(story.child_story_id));
    assert.match(overview, new RegExp(path.basename(story.sequence_diagram.puml_path)));
    assert.match(overview, new RegExp(path.basename(story.sequence_diagram.svg_path)));
    assert.match(overview, new RegExp(path.basename(story.sequence_diagram.png_path)));
  }
});

test("проверка отклоняет исходник PlantUML без завершающей оболочки", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-sequence-"));
  try {
    fs.mkdirSync(path.join(temporaryRoot, path.dirname(mapPath)), { recursive: true });
    fs.copyFileSync(path.join(root, mapPath), path.join(temporaryRoot, mapPath));
    fs.mkdirSync(path.dirname(path.join(temporaryRoot, sourceDirectory)), { recursive: true });
    fs.cpSync(path.join(root, sourceDirectory), path.join(temporaryRoot, sourceDirectory), { recursive: true });
    fs.mkdirSync(path.dirname(path.join(temporaryRoot, artifactDirectory)), { recursive: true });
    fs.cpSync(path.join(root, artifactDirectory), path.join(temporaryRoot, artifactDirectory), { recursive: true });
    const sourcePath = path.join(temporaryRoot, sourceDirectory, "us-009-01.puml");
    fs.writeFileSync(sourcePath, fs.readFileSync(sourcePath, "utf8").replace("@enduml\n", ""), "utf8");

    assert.throws(
      () => validateUserStorySequenceDiagrams(temporaryRoot),
      /корректную оболочку/u,
    );
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("проверка отклоняет устаревший рендер после изменения исходника", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-sequence-"));
  try {
    fs.mkdirSync(path.join(temporaryRoot, path.dirname(mapPath)), { recursive: true });
    fs.copyFileSync(path.join(root, mapPath), path.join(temporaryRoot, mapPath));
    fs.mkdirSync(path.dirname(path.join(temporaryRoot, sourceDirectory)), { recursive: true });
    fs.cpSync(path.join(root, sourceDirectory), path.join(temporaryRoot, sourceDirectory), { recursive: true });
    fs.mkdirSync(path.dirname(path.join(temporaryRoot, artifactDirectory)), { recursive: true });
    fs.cpSync(path.join(root, artifactDirectory), path.join(temporaryRoot, artifactDirectory), { recursive: true });
    const sourcePath = path.join(temporaryRoot, sourceDirectory, "us-009-01.puml");
    fs.writeFileSync(sourcePath, fs.readFileSync(sourcePath, "utf8").replace("Использует вложения в работе", "Открывает вложения в работе"), "utf8");

    assert.throws(
      () => validateUserStorySequenceDiagrams(temporaryRoot),
      /не соответствует текущим исходнику и рендерам/u,
    );
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("проверка отклоняет обзор без ссылки на рендер принятого сценария", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-sequence-"));
  try {
    fs.mkdirSync(path.join(temporaryRoot, path.dirname(mapPath)), { recursive: true });
    fs.copyFileSync(path.join(root, mapPath), path.join(temporaryRoot, mapPath));
    fs.mkdirSync(path.dirname(path.join(temporaryRoot, sourceDirectory)), { recursive: true });
    fs.cpSync(path.join(root, sourceDirectory), path.join(temporaryRoot, sourceDirectory), { recursive: true });
    fs.mkdirSync(path.dirname(path.join(temporaryRoot, artifactDirectory)), { recursive: true });
    fs.cpSync(path.join(root, artifactDirectory), path.join(temporaryRoot, artifactDirectory), { recursive: true });
    const overview = path.join(temporaryRoot, overviewPath);
    fs.writeFileSync(
      overview,
      fs.readFileSync(overview, "utf8").replace("us-009-01.png", ""),
      "utf8",
    );

    assert.throws(
      () => validateUserStorySequenceDiagrams(temporaryRoot),
      /обзор диаграмм/u,
    );
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
