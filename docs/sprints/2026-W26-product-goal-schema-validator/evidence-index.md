# Evidence Index: Product Goal And Schema Validator

## Evidence Артефакты

- `scripts/validate-bootstrap-artifacts.sh`
- `.github/workflows/docs-check.yml`
- `docs/product/hypotheses/hypothesis-validation.md`
- `docs/sprints/2026-W26-product-goal-schema-validator/sprint-evidence-manifest.json`

## Проверки

| Команда | Результат |
|---|---|
| `scripts/validate-bootstrap-artifacts.sh` | passed |
| `git diff --check` | passed |
| `jq empty ...` | passed |
| `git status --short --branch` | passed |
| `npm test` | passed |
