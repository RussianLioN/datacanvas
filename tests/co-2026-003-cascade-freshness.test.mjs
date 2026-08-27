import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDirectory, '..');

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(projectRoot, relativePath), 'utf8'));
}

async function readText(relativePath) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

test('CO-2026-003 keeps interview history and records operational amendments', async () => {
  const register = await readJson(
    'docs/product/change-orders/co-2026-003-authoritative-interview-decision-register.json',
  );

  assert.equal(register.decisions.at(-1).decision_id, 'CO3-DEC-010');
  assert.deepEqual(
    register.post_interview_amendments.map((amendment) => amendment.amendment_id),
    ['CO3-AMND-001', 'CO3-AMND-002'],
  );

  const deliveryAmendment = register.post_interview_amendments[0];
  assert.deepEqual(deliveryAmendment.delivery_formats, ['PPTX', 'PDF']);
  assert.deepEqual(deliveryAmendment.supersedes, {
    decision_id: 'CO3-DEC-001',
    scope: 'delivery_formats_only',
  });

  const draftAmendment = register.post_interview_amendments[1];
  assert.equal(draftAmendment.accepted_scope, 'isolated_draft_only');
  assert.equal(draftAmendment.active_release_switch_allowed, false);
  assert.equal(
    draftAmendment.next_gate,
    'documentation_cascade_then_explicit_final_owner_approval',
  );
  assert.equal(
    existsSync(path.join(projectRoot, 'artifacts/delivery/co-2026-003-q4-lisa-profile-delivery.zip')),
    false,
    'ожидающий выпуск не должен хранить активный архив поставки',
  );

  assert.match(
    register.verbatim_wordings.find((wording) => wording.wording_id === 'CO3-WRD-001').text,
    /ODT и PDF/u,
  );
});

test('accepted draft, active Q4 documents and story lock use the current approved outcome', async () => {
  const draftManifest = await readJson(
    'docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/prototype-draft/manifest.json',
  );
  assert.equal(draftManifest.version, '1.4.0');
  assert.equal(
    draftManifest.status,
    'draft_prototype_accepted_for_documentation_cascade',
  );
  assert.deepEqual(draftManifest.owner_acceptance, {
    accepted_at: '2026-08-24T00:00:00Z',
    scope: 'isolated_draft_only',
    active_release_switch_allowed: false,
    next_gate: 'documentation_cascade_then_explicit_final_owner_approval',
  });

  const storyLock = await readJson(
    'docs/product/sources/story-catalog-content-lock.json',
  );
  const lockedStoryIds = storyLock.rows.map((story) => story.story_id);
  for (const storyId of ['DC-ST-23', 'DC-ST-27', 'DC-ST-30']) {
    assert.ok(lockedStoryIds.includes(storyId), `missing lock for ${storyId}`);
  }

  const activeDocumentPaths = [
    'docs/product/change-orders/co-2026-003-q4-lisa-profile.md',
    'docs/product/change-orders/co-2026-003-q4-lisa-profile.json',
    'docs/product/change-orders/co-2026-003-q4-lisa-profile-impact.md',
    'docs/product/change-orders/co-2026-003-q4-lisa-profile-impact.json',
    'docs/product/requirements/business-requirements.md',
    'docs/product/requirements/acceptance-criteria.md',
    'docs/product/analysis/ba/business-rules.md',
    'docs/product/analysis/ba/business-rules.json',
    'docs/architecture/system-analysis/datacanvas-interface-control.md',
    'docs/architecture/system-analysis/sa-spec.json',
    'docs/product/specs/agent-prompt-spec-q4-profile-mail-delivery.json',
    'docs/product/specs/task-spec-q4-profile-mail-delivery.json',
    'docs/release/co-2026-003-q4-lisa-profile-acceptance-packet.md',
  ];
  for (const relativePath of activeDocumentPaths) {
    const text = await readText(relativePath);
    assert.match(text, /PPTX/u, `${relativePath} must name PPTX`);
    assert.match(text, /PDF/u, `${relativePath} must name PDF`);
    assert.doesNotMatch(text, /ODT/u, `${relativePath} must not retain the obsolete format`);
  }
});
