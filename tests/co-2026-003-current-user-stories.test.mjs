import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

const expectedStories = [
  ["DC-ST-09", "P2"],
  ["DC-ST-23", "P1"],
  ["DC-ST-24", "P1"],
  ["DC-ST-25", "P1"],
  ["DC-ST-26", "P1"],
  ["DC-ST-27", "P1"],
  ["DC-ST-28", "P1"],
  ["DC-ST-29", "P1"],
  ["DC-ST-30", "P2"],
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function parseStoryRows(markdown) {
  return markdown
    .split("\n")
    .filter((line) => line.startsWith("| DC-ST-"))
    .map((line) => {
      const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
      return { storyId: cells[0], priority: cells[2], text: cells[3], value: cells[4] };
    });
}

test("CO-2026-003 публикует только девять согласованных пользовательских историй 2026 года", () => {
  const stories = parseStoryRows(read("docs/product/requirements/user-stories.md"));

  assert.deepEqual(
    stories.map(({ storyId, priority }) => [storyId, priority]),
    expectedStories,
  );
  for (const story of stories) {
    assert.match(story.text, /^Как .+, я хочу(?: .+|, чтобы .+), чтобы .+\.$/u);
    assert.ok(story.value.length > 20, `${story.storyId} должна содержать отдельную бизнес-ценность`);
  }
});

test("CO-2026-003 фиксирует включенные условия заказа, статуса и доставки внутри базовых историй", () => {
  const stories = new Map(
    parseStoryRows(read("docs/product/requirements/user-stories.md"))
      .map((story) => [story.storyId, story]),
  );

  assert.match(stories.get("DC-ST-23").text, /один заказ/u);
  assert.match(stories.get("DC-ST-27").text, /принятии/u);
  assert.match(stories.get("DC-ST-30").text, /задержке|частичной доставке/u);
});

test("CO-2026-003 отмечает пользовательские истории как принятые до этапа системных требований", () => {
  const state = readJson("docs/product/change-orders/co-2026-003-q4-lisa-profile-bt-interview-state.json");

  assert.equal(state.status, "user_stories_owner_approved");
  assert.equal(state.documentation_cascade.business_requirements, "owner_approved");
  assert.equal(state.documentation_cascade.user_stories, "owner_approved");
  assert.equal(state.documentation_cascade.system_requirements, "pending");
});

test("CO-2026-003 не оставляет в актуальной трассировке исключенные истории", () => {
  const traceability = readJson("docs/product/requirements/traceability-matrix.json");
  const activeIds = new Set(expectedStories.map(([storyId]) => storyId));
  const tracedIds = traceability.links.flatMap((link) => link.story_ids ?? []);

  assert.ok(tracedIds.length > 0);
  assert.deepEqual(
    [...new Set(tracedIds.filter((storyId) => !activeIds.has(storyId)))],
    [],
  );
});
