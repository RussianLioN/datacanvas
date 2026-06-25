# Artifact Updates

Версия процесса: 0.1.0

## Добавлено

- `schemas/provider-specific-eval-delta.schema.json`
- `tests/evals/provider-specific-eval-delta.json`
- `docs/architecture/evals/provider-quality-scoring-rubric.md`
- `scripts/validate-provider-eval-delta.mjs`
- `docs/architecture/adr/ADR-015-provider-specific-eval-delta.md`
- Sprint 11 evidence pack.

## Изменено

- `package.json`: добавлен `validate:provider-evals`, включен в `npm test`.
- `.github/workflows/docs-check.yml`: добавлен provider eval delta gate.
- `scripts/validate-json-schema.mjs`: добавлена schema validation provider eval delta.
- `scripts/validate-bootstrap-artifacts.sh`: provider eval artifacts стали обязательными.
- `docs/architecture/schemas/artifact-registry.json`: зарегистрированы Sprint 11 artifacts.
