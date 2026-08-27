import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(new URL("../", import.meta.url).pathname);
const journeyRoot = "docs/product/analysis/presentation-link-lisa-user-journey";
const approvedTextsPath = `${journeyRoot}/source/owner-approved-texts.json`;
const approvedTextMarker = "owner-approved-texts";

const humanCascadePaths = [
  "docs/product/change-orders/co-2026-003-q4-lisa-profile.md",
  "docs/product/change-orders/co-2026-003-q4-lisa-profile-impact.md",
  "docs/product/requirements/business-requirements.md",
  "docs/product/requirements/user-stories.md",
  "docs/product/requirements/acceptance-criteria.md",
  "docs/product/analysis/ba/business-rules.md",
  "docs/architecture/system-analysis/srs-v0.1.md",
  `${journeyRoot}/README.md`,
  `${journeyRoot}/user-journey.md`,
  "docs/release/co-2026-003-q4-lisa-profile-acceptance-packet.md",
  "docs/release/co-2026-003-q4-lisa-profile-validation-evidence.md",
  "docs/release/co-2026-003-prototype-delivery-archive.md",
];

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

test("каскад CO-2026-003 связывает будущие тексты с единым реестром, сохраняя исторический выпуск", () => {
  const approvedTexts = readJson(approvedTextsPath);
  assert.equal(approvedTexts.status, "owner_approved");
  assert.equal(approvedTexts.visual_release_boundary.render_allowed, false);
  assert.equal(approvedTexts.visual_release_boundary.archive_allowed, false);

  for (const relativePath of humanCascadePaths) {
    assert.match(readText(relativePath), new RegExp(approvedTextMarker), `${relativePath} должен ссылаться на единый реестр текстов`);
  }

  const clientReference = readJson(`${journeyRoot}/source/client-reference-data.json`);
  const actionTexts = clientReference.data_groups
    .find((group) => group.group_id === "actions")
    .facts
    .filter((fact) => fact.label === "Кнопка")
    .map((fact) => fact.value);
  assert.ok(actionTexts.includes("Создать презентацию по справке"));
  assert.equal(actionTexts.includes("Сформировать презентацию"), false);

  const impact = readJson("docs/product/change-orders/co-2026-003-q4-lisa-profile-impact.json");
  assert.ok(impact.affected_artifacts.includes(approvedTextsPath));

  const deliveryArchive = readJson("docs/release/co-2026-003-prototype-delivery-archive-contract.json");
  assert.ok(deliveryArchive.additional_artifacts.some((artifact) => artifact.path === approvedTextsPath));
  for (const requirementId of ["BT-015", "BT-018", "BT-019"]) {
    const link = readJson("docs/product/requirements/traceability-matrix.json").links
      .find((candidate) => candidate.requirement_id === requirementId);
    assert.ok(link.sources.includes(approvedTextsPath), `${requirementId} должен трассироваться к реестру утвержденных текстов`);
  }

  const baSpec = readJson("docs/product/analysis/ba/ba-spec.json");
  const safeStatusClaim = baSpec.claims.find((claim) => claim.claim_id === "BASA-CLM-013");
  assert.ok(safeStatusClaim.evidence_refs.includes(approvedTextsPath));

  const saSpec = readJson("docs/architecture/system-analysis/sa-spec.json");
  const statusRequirement = saSpec.requirements.find((requirement) => requirement.requirement_id === "BT-023");
  assert.match(statusRequirement.verification_method, new RegExp(approvedTextMarker));

  const statusPrompt = readJson("docs/product/specs/agent-prompt-spec-q4-lisa-status-state.json");
  assert.ok(statusPrompt.constraints.some((constraint) => constraint.includes(approvedTextMarker)));

  const activeJourney = readJson(`${journeyRoot}/source/journey-contract.json`);
  assert.ok(activeJourney.state_ids.includes("lisa-presentation-generating"));
  assert.equal(readText(`${journeyRoot}/source/owner-approved-texts.json`).includes("Презентация готова и направлена по электронной почте в ЧЧ:ММ."), true);
});
