# Commit And PR Evidence Template

Статус: template only

Этот шаблон нельзя считать `commit-sha-and-pr-evidence`. Он нужен для заполнения фактического release train evidence после commit и PR.

## Metadata

- Process version: `0.1.0`
- Evidence date: `TO_BE_FILLED_AFTER_COMMIT`
- Release owner: `TO_BE_FILLED_AFTER_COMMIT`

## Commit Evidence

- Commit SHA: `TO_BE_FILLED_AFTER_COMMIT`
- Commit URL or local verification command: `TO_BE_FILLED_AFTER_COMMIT`
- Branch: `TO_BE_FILLED_AFTER_COMMIT`
- Working tree status at release cut: `TO_BE_FILLED_AFTER_COMMIT`

## Pull Request Evidence

- PR URL or identifier: `TO_BE_FILLED_AFTER_COMMIT`
- Review status: `TO_BE_FILLED_AFTER_COMMIT`
- CI status: `TO_BE_FILLED_AFTER_COMMIT`
- Merge status: `TO_BE_FILLED_AFTER_COMMIT`

## Required Verification

```text
git rev-parse HEAD: TO_BE_FILLED_AFTER_COMMIT
git status --short --branch: TO_BE_FILLED_AFTER_COMMIT
npm test: TO_BE_FILLED_AFTER_COMMIT
```

## Release Evidence Links

- Release evidence pack: `docs/release/mvp-release-evidence-pack.json`
- Pilot report: `docs/release/pilot-report.md`
- Completion audit: `docs/process/audits/plan-completion-audit.json`

## Acceptance Rule

Commit/PR evidence is acceptable only after a real commit and reviewable PR or equivalent agreed release record exist. This template is not acceptance evidence.
