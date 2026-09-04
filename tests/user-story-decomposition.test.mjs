import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  loadStoryDecomposition,
  validateStoryDecomposition,
} from "../scripts/validate-user-story-decomposition.mjs";

test("принятая детализация хранит сценарии в действующем едином документе, а изменённые диаграммы ожидают отдельной приёмки", () => {
  const decomposition = loadStoryDecomposition();

  assert.equal(
    decomposition.markdown_document_path,
    "docs/product/requirements/user-stories.md",
  );
  assert.equal(decomposition.status, "owner_approved");
  assert.ok(
    decomposition.child_stories.every((story) => story.section_heading.startsWith("#### US-")),
  );
  assert.ok(
    decomposition.child_stories.every((story) => story.readiness_status !== "candidate_pending_owner_review"),
  );
  assert.ok(
    decomposition.child_stories.every(
      (story) => story.sequence_diagram_status === "candidate_pending_owner_review",
    ),
  );
  assert.ok(
    decomposition.child_stories.every(
      (story) => story.sequence_diagram?.puml_path.endsWith(".puml"),
    ),
  );
  assert.doesNotMatch(JSON.stringify(decomposition), /markdown_path/u);
});

test("детализация CO-2026-003 сохраняет девять историй и двадцать четыре дочерние части", () => {
  const decomposition = loadStoryDecomposition();

  assert.equal(decomposition.parent_stories.length, 9);
  assert.equal(decomposition.child_stories.length, 24);
  assert.doesNotMatch(JSON.stringify(decomposition), /DC-ST-(?:31|32|33)/u);

  validateStoryDecomposition(decomposition);
});

test("детализация Q4_2026 закрепляет SIGMA/OMEGA и пять повторов SIGMA без ODT или третьего контура", () => {
  const decomposition = loadStoryDecomposition();
  const serialized = JSON.stringify(decomposition);
  const retryStory = decomposition.child_stories.find((story) => story.child_story_id === "US-030-03");
  const successStory = decomposition.child_stories.find((story) => story.child_story_id === "US-030-04");

  assert.equal(retryStory?.primary_responsibility, "Пять повторов IRM в SIGMA через 10 минут в пределах одного часа");
  assert.equal(successStory?.primary_responsibility, "Утверждённый текст успеха после повтора SIGMA с временем ЧЧ:ММ");
  assert.doesNotMatch(serialized, /\bODT\b/u);
  assert.doesNotMatch(serialized, /трет(?:ий|ьего)\s+контур/iu);
});

test("решение владельца снимает блокировку текста полной неподтверждённой доставки", () => {
  const decomposition = loadStoryDecomposition();
  const blocked = decomposition.child_stories
    .filter((story) => story.readiness_status === "blocked_by_owner_decision")
    .map((story) => story.child_story_id)
    .sort();
  const conflict = decomposition.source_conflicts.find(
    (item) => item.conflict_id === "CO3-US-CONFLICT-001",
  );

  assert.deepEqual(blocked, []);
  assert.equal(conflict?.resolution_status, "resolved_by_owner");
  assert.equal(
    conflict?.accepted_message,
    "Презентация сформирована, но отправка по электронной почте в SIGMA и OMEGA не подтверждена. Задача передана в сопровождение.",
  );
  validateStoryDecomposition(decomposition);
});

test("каждая дочерняя часть принадлежит ровно одной родительской истории", () => {
  const decomposition = loadStoryDecomposition();
  const invalid = structuredClone(decomposition);

  invalid.parent_stories[0].child_story_ids.push("US-023-01");

  assert.throws(
    () => validateStoryDecomposition(invalid),
    /exactly one parent story/u,
  );
});

test("единый документ содержит обязательные разделы для системного анализа каждой части", () => {
  const decomposition = loadStoryDecomposition();
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "datacanvas-story-"));
  const copiedDocument = path.join(temporaryRoot, decomposition.markdown_document_path);

  try {
    fs.mkdirSync(path.dirname(copiedDocument), { recursive: true });
    fs.copyFileSync(path.join(process.cwd(), decomposition.markdown_document_path), copiedDocument);
    fs.writeFileSync(
      copiedDocument,
      fs.readFileSync(copiedDocument, "utf8").replace(
        "##### Альтернативы и ошибки",
        "##### Альтернативы",
      ),
      "utf8",
    );

    assert.throws(
      () => validateStoryDecomposition(decomposition, temporaryRoot),
      /required Markdown section/u,
    );
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("карта не допускает ссылку на раздельный Markdown-файл", () => {
  const invalid = structuredClone(loadStoryDecomposition());
  invalid.child_stories[0].markdown_path = "docs/product/requirements/split-stories/us-009-01.md";

  assert.throws(
    () => validateStoryDecomposition(invalid),
    /single Markdown document/u,
  );
});
