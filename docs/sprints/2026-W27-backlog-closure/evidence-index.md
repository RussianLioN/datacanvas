# Evidence Index: 2026-W27 Backlog Closure

## Source

- `docs/plans/datacanvas-backlog-closure-validation-implementation-plan.md`

## Измененные Контуры

- `docs/product/backlog/technical-backlog.md`
- `docs/product/backlog/eval-backlog.md`
- `docs/process/current/process-backlog.md`
- `docs/product/requirements/traceability-matrix.json`
- `tests/evals/eval-cases.json`
- `schemas/eval-case.schema.json`
- `scripts/validate-backlog-registry.mjs`
- `scripts/validate-eval-backlog-sync.mjs`
- `scripts/validate-eval-pack.mjs`
- `scripts/validate-docs-navigation.mjs`
- `scripts/validate-data-leakage.mjs`
- `scripts/validate-artifact-hash-manifest.mjs`
- `docs/architecture/security/data-leakage-manifest.json`
- `schemas/data-leakage-manifest.schema.json`
- `tests/docs-navigation/negative/cases.json`
- `package.json`

## Проверки

- `npm run validate:schemas` passed.
- `npm run validate:evals` passed.
- `npm run validate:eval-backlog-sync` passed.
- `npm run validate:backlog-registry` passed.
- `npm run validate:traceability-graph` passed.
- `npm run validate:docs-navigation` passed after `npm run generate:docs-navigation`.
- `npm run validate:data-leakage` passed.
- `npm run validate:doc-links` passed.
- `npm run validate:doc-stale-status` passed.
- `npm run validate:artifact-registry` passed.
- `npm run validate:artifact-hashes` passed.
- `npm run validate:process-metrics-snapshot` passed.
- `npm run validate:release-pack` passed.
- Final gate: `npm test`, `git diff --check`, `git diff --exit-code`, `git status --short --branch`.
