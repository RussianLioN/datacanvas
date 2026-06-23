# Planning

Версия процесса: 0.1.0

## Scope

В спринт включается только проверяемая трассировка существующих артефактов. Real UAT session не создается и не имитируется.

## Acceptance

- Есть `schemas/traceability-graph.schema.json`.
- Есть `docs/architecture/schemas/traceability-graph.json`.
- Есть `scripts/validate-traceability-graph.mjs`.
- `npm run validate:traceability-graph` проходит.
- Новый graph подключен к `npm test`, schema validation, artifact registry, bootstrap и process version manifest.
