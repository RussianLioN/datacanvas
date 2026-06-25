# Sprint Backlog

Версия процесса: 0.1.0
Sprint ID: SPRINT-2026-W26-S6

## Выбранные элементы

- `TECH-S6-001`: создать `scripts/llm-mock-adapter.mjs` для локальной генерации `LLMResult`.
- `EVAL-S6-001`: создать отрицательный пример `tests/fixtures/llm-result-unsupported-claim.json`.
- `EVAL-S6-002`: создать `scripts/validate-llm-guardrails.mjs` для проверки LLM boundary.
- `SEC-S6-001`: зафиксировать no-network-by-default инварианты.
- `ADR-S6-001`: принять ADR по LLM mock adapter и guardrails.
- `PROC-S6-001`: включить `validate:llm` в общий test gate и CI.

## Не вошло в спринт

- Подключение реального LLM provider.
- Оценка качества реального prompt.
- Метрики latency/cost/failure rate реальной модели.
