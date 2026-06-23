# ADR-013: Structured Provider Readiness

Дата: 2026-06-22  
Статус: Accepted  
Версия процесса: 0.1.0

## Контекст

Sprint 8 добавил provider readiness, но часть проверок была текстовой. Для управляемого процесса provider artifacts должны проверяться структурно, как остальные machine-readable контракты DataCanvas.

## Решение

Добавить:

- `schemas/provider-allowlist.schema.json`;
- `schemas/provider-budget.schema.json`;
- `docs/architecture/llm/provider-allowlist.json`;
- cross-artifact проверку связи allowlist, budget и `model_call` span в trace manifest.

YAML allowlist остается человекочитаемой заметкой, но JSON allowlist становится каноническим machine-readable артефактом.

## Последствия

Плюсы:

- readiness gate больше не зависит только от поиска строк;
- provider остается disabled через схему и cross-check;
- trace manifest фиксирует offline fallback.

Ограничения:

- реальный provider по-прежнему не подключен;
- schema для provider experiment result будет нужна отдельным инкрементом.
