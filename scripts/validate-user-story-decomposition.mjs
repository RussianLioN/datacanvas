import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const mapPath = "docs/product/requirements/user-story-decomposition-map.json";
const activeDocumentPath = "docs/product/requirements/user-stories.md";
const transcriptPath = "docs/product/change-orders/co-2026-003-q4-lisa-profile-bt-interview-transcript.md";
const fullDeliveryFailureMessage =
  "Презентация сформирована, но отправка по электронной почте в SIGMA и OMEGA не подтверждена. Задача передана в сопровождение.";

const expectedParents = [
  "DC-ST-09",
  "DC-ST-23",
  "DC-ST-24",
  "DC-ST-25",
  "DC-ST-26",
  "DC-ST-27",
  "DC-ST-28",
  "DC-ST-29",
  "DC-ST-30",
];

const expectedChildren = [
  "US-009-01",
  "US-023-01",
  "US-023-02",
  "US-023-03",
  "US-024-01",
  "US-024-02",
  "US-025-01",
  "US-025-02",
  "US-026-01",
  "US-026-02",
  "US-026-03",
  "US-027-01",
  "US-027-02",
  "US-027-03",
  "US-028-01",
  "US-028-02",
  "US-029-01",
  "US-029-02",
  "US-029-03",
  "US-030-01",
  "US-030-02",
  "US-030-03",
  "US-030-04",
  "US-030-05",
];

const requiredChildMarkdownSections = [
  "##### Пользовательская история",
  "##### Ценность и границы",
  "##### Предусловия",
  "##### Сценарий",
  "##### Альтернативы и ошибки",
  "##### Критерии приёмки",
  "##### Связи и готовность к системному анализу",
];

function fail(message) {
  throw new Error(message);
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function singleHeadingIndex(markdown, heading, storyId) {
  const positions = [];
  let offset = 0;
  while (offset < markdown.length) {
    const index = markdown.indexOf(heading, offset);
    if (index === -1) break;
    const startsLine = index === 0 || markdown[index - 1] === "\n";
    const endsLine = markdown[index + heading.length] === "\n" || index + heading.length === markdown.length;
    if (startsLine && endsLine) positions.push(index);
    offset = index + heading.length;
  }
  if (positions.length !== 1) {
    fail(`${storyId} must have exactly one section heading in the single Markdown document`);
  }
  return positions[0];
}

function storySection(markdown, child, parentStart, parentEnd) {
  const start = singleHeadingIndex(markdown, child.section_heading, child.child_story_id);
  if (start <= parentStart || start >= parentEnd) {
    fail(`${child.child_story_id} must be inside its parent story section`);
  }
  const nextChild = markdown.indexOf("\n#### US-", start + child.section_heading.length);
  const end = nextChild === -1 || nextChild > parentEnd ? parentEnd : nextChild;
  return markdown.slice(start, end);
}

function validateChildMarkdown(markdown, child, parentStart, parentEnd) {
  if (Object.hasOwn(child, "markdown_path")) {
    fail(`${child.child_story_id} must use the single Markdown document, not a separate Markdown file`);
  }
  const fragment = storySection(markdown, child, parentStart, parentEnd);
  for (const section of requiredChildMarkdownSections) {
    if (!fragment.includes(section)) {
      fail(`child story ${child.child_story_id} is missing required Markdown section: ${section}`);
    }
  }
  for (const businessRequirementId of child.business_requirement_ids) {
    if (!fragment.includes(`\`${businessRequirementId}\``)) {
      fail(`child story ${child.child_story_id} must name linked business requirement ${businessRequirementId}`);
    }
  }
}

function validateResolvedFullDeliveryText(decomposition) {
  const conflict = decomposition.source_conflicts.find(
    (item) => item.conflict_id === "CO3-US-CONFLICT-001",
  );
  const affected = [...(conflict?.affected_child_story_ids ?? [])].sort();
  if (
    conflict?.resolution_status !== "resolved_by_owner" ||
    conflict.resolution_source_path !== transcriptPath ||
    conflict.accepted_message !== fullDeliveryFailureMessage ||
    JSON.stringify(affected) !== JSON.stringify(["US-027-03", "US-030-05"])
  ) {
    fail("CO3-US-CONFLICT-001 must preserve the owner-resolved full-delivery message from the interview transcript");
  }
}

export function loadStoryDecomposition(root = process.cwd()) {
  return readJson(root, mapPath);
}

export function validateStoryDecomposition(decomposition, root = process.cwd()) {
  if (decomposition.change_order_id !== "CO-2026-003") {
    fail("story decomposition must belong to CO-2026-003");
  }
  if (decomposition.status !== "owner_approved") {
    fail("story decomposition must be owner-approved before it becomes the active requirements document");
  }
  if (decomposition.markdown_document_path !== activeDocumentPath) {
    fail("story decomposition must point to the single active Markdown document");
  }
  const documentPath = path.join(root, decomposition.markdown_document_path);
  if (!fs.existsSync(documentPath)) {
    fail("the single active Markdown document must exist");
  }
  const markdown = fs.readFileSync(documentPath, "utf8");

  const parentIds = decomposition.parent_stories.map((story) => story.story_id);
  if (JSON.stringify(parentIds) !== JSON.stringify(expectedParents)) {
    fail("story decomposition must preserve exactly nine approved parent stories");
  }
  const childIds = decomposition.child_stories.map((story) => story.child_story_id);
  if (JSON.stringify(childIds) !== JSON.stringify(expectedChildren)) {
    fail("story decomposition must contain exactly the approved 24 child stories");
  }

  const childIdSet = new Set(childIds);
  const parentLinksByChildId = new Map();
  const parentBounds = new Map();
  for (let index = 0; index < decomposition.parent_stories.length; index += 1) {
    const parent = decomposition.parent_stories[index];
    if (Object.hasOwn(parent, "markdown_path")) {
      fail(`${parent.story_id} must use the single Markdown document, not a separate Markdown file`);
    }
    const start = singleHeadingIndex(markdown, parent.section_heading, parent.story_id);
    const end = index + 1 < decomposition.parent_stories.length
      ? singleHeadingIndex(markdown, decomposition.parent_stories[index + 1].section_heading, decomposition.parent_stories[index + 1].story_id)
      : markdown.length;
    parentBounds.set(parent.story_id, { start, end });
    if (!Array.isArray(parent.child_story_ids) || parent.child_story_ids.length === 0) {
      fail(`parent story ${parent.story_id} must link to child stories`);
    }
    for (const childId of parent.child_story_ids) {
      if (!childIdSet.has(childId)) {
        fail(`parent story ${parent.story_id} links to an unknown child story ${childId}`);
      }
      const linkedParents = parentLinksByChildId.get(childId) ?? [];
      linkedParents.push(parent.story_id);
      parentLinksByChildId.set(childId, linkedParents);
    }
  }

  const parentIdSet = new Set(parentIds);
  const blockedIds = [];
  for (const child of decomposition.child_stories) {
    if (!parentIdSet.has(child.parent_story_id)) {
      fail(`child story ${child.child_story_id} has an unknown parent story`);
    }
    if (!Array.isArray(child.business_requirement_ids) || child.business_requirement_ids.length === 0) {
      fail(`child story ${child.child_story_id} must link to business requirements`);
    }
    const linkedParents = parentLinksByChildId.get(child.child_story_id) ?? [];
    if (linkedParents.length !== 1 || linkedParents[0] !== child.parent_story_id) {
      fail(`child story ${child.child_story_id} must belong to exactly one parent story`);
    }
    validateChildMarkdown(markdown, child, parentBounds.get(child.parent_story_id).start, parentBounds.get(child.parent_story_id).end);
    if (child.readiness_status === "blocked_by_owner_decision") {
      blockedIds.push(child.child_story_id);
    }
    if (child.readiness_status === "candidate_pending_owner_review") {
      fail(`${child.child_story_id} must be ready for system analysis or marked for a business-requirement cascade fix after text acceptance`);
    }
    if (!["not_started_pending_diagram_preparation", "candidate_pending_owner_review", "owner_approved"].includes(child.sequence_diagram_status)) {
      fail(`${child.child_story_id} must declare a valid sequence-diagram state after text acceptance`);
    }
  }
  if (blockedIds.length !== 0) {
    fail("the owner-resolved full-delivery text must not leave blocked child stories");
  }

  for (const conflict of decomposition.source_conflicts ?? []) {
    for (const childId of conflict.affected_child_story_ids ?? []) {
      if (!childIdSet.has(childId)) {
        fail(`source conflict ${conflict.conflict_id} affects an unknown child story ${childId}`);
      }
    }
  }
  validateResolvedFullDeliveryText(decomposition);
}

function isDirectExecution() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isDirectExecution()) {
  try {
    validateStoryDecomposition(loadStoryDecomposition());
    console.log("user story decomposition validation passed");
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}
