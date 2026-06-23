# ADR-015: Provider-Specific Eval Delta И Quality Rubric

Дата: 2026-06-22  
Статус: Accepted  
Версия процесса: 0.1.0

## Контекст

`ProviderExperimentResult` содержит `quality_score`, но без отдельной рубрики и provider-specific eval delta это поле может стать ручной субъективной оценкой.

## Решение

Добавить:

- `schemas/provider-specific-eval-delta.schema.json`;
- `tests/evals/provider-specific-eval-delta.json`;
- `docs/architecture/evals/provider-quality-scoring-rubric.md`;
- `scripts/validate-provider-eval-delta.mjs`.

Eval delta задает provider-specific cases и веса, сумма которых должна быть равна 1. Рубрика задает threshold `quality_score >= 0.90`.

## Последствия

Плюсы:

- качество provider output получает воспроизводимый baseline;
- future experiment не сможет принять provider без security, cost, latency и reliability evidence;
- scoring связан с eval cases и budget.

Ограничения:

- score пока не вычисляется по реальному provider output;
- автоматический scorer будет отдельным инкрементом.
