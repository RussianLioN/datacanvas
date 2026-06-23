# Planning

Версия процесса: 0.1.0

## Контекст

Sprint 8 добавил provider readiness, но часть проверки была текстовой. Для управляемого процесса нужны структурные схемы, которые CI может валидировать так же, как `PresentationSpec` и `TraceManifest`.

## План

1. Создать схемы provider allowlist и provider budget.
2. Добавить JSON allowlist как machine-readable источник.
3. Расширить trace schema provider-полями.
4. Генерировать offline `model_call` span.
5. Расширить provider readiness validator.
6. Обновить artifact registry и ADR.

## Acceptance Criteria

- `provider-allowlist.json` проходит schema validation.
- `provider-budget.json` проходит schema validation.
- `TraceManifest` содержит `model_call` span со статусом `skipped`.
- `npm run validate:provider` проверяет структурные артефакты.
- `npm test` проходит.
