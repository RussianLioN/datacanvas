# Artifact Updates

Версия процесса: 0.1.0

## Добавлено

- `schemas/provider-allowlist.schema.json`
- `schemas/provider-budget.schema.json`
- `docs/architecture/llm/provider-allowlist.json`
- `docs/architecture/adr/ADR-013-structured-provider-readiness.md`
- Sprint 9 evidence pack.

## Изменено

- `schemas/trace-manifest.schema.json`: добавлены `model`, `provider`, `retry_count`.
- `scripts/normalize-input-package.mjs`: добавлен `model_call` span для offline fallback.
- `scripts/validate-json-schema.mjs`: добавлена schema validation provider artifacts и trace linkage.
- `scripts/validate-provider-readiness.mjs`: добавлена AJV validation provider artifacts.
- `docs/architecture/llm/provider-integration-plan.md`: зафиксирован canonical JSON allowlist.
- `docs/architecture/schemas/artifact-registry.json`: зарегистрированы Sprint 9 artifacts.
