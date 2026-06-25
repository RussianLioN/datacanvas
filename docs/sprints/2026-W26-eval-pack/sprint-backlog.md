# Sprint Backlog

Версия процесса: 0.1.0
Sprint ID: SPRINT-2026-W26-S7

## Выбранные элементы

- `EVAL-S7-001`: расширить `tests/evals/eval-cases.json` до обязательного набора MVP.
- `EVAL-S7-002`: добавить исполняемый валидатор `scripts/validate-eval-pack.mjs`.
- `SEC-S7-001`: проверить отсутствие prompt-injection leakage из входных instructions.
- `QA-S7-001`: проверить краткость и структуру презентации.
- `ADR-S7-001`: принять ADR о необходимости eval pack до внешнего provider.
- `PROC-S7-001`: включить `validate:evals` в `npm test` и CI.

## Не вошло в спринт

- Реальный model-quality benchmark.
- Сравнение нескольких моделей.
- Метрики latency/cost/provider failure rate.
