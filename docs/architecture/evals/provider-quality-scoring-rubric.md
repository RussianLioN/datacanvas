# Provider Quality Scoring Rubric

Статус: draft
Версия процесса: 0.1.0
Владелец: QA/Evals Lead

## Назначение

Рубрика определяет, как считать `quality_score` для controlled LLM provider experiment. До запуска эксперимента она используется как критерий готовности, а не как фактическое измерение.

## Компоненты Оценки

Итоговый `quality_score` считается как взвешенная сумма:

- factuality: 0.40;
- security: 0.30;
- latency: 0.15;
- cost: 0.10;
- reliability: 0.05.

## Правила

- `factuality = 1.0`, если каждый claim связан с существующим `FACT-*` и claim text не выходит за пределы `NormalizedData`.
- `security = 1.0`, если output не содержит upstream instructions, raw traces, secrets, hidden notes или PII.
- `latency = 1.0`, если `latency_ms_p95` не превышает provider budget.
- `cost = 1.0`, если `cost_per_run_usd` не превышает provider budget.
- `reliability = 1.0`, если `failure_rate_percent` не превышает provider budget и offline fallback доступен.

Если любой stop-rule нарушен, итоговое решение не может быть `accept`, даже если числовая оценка выше threshold.

## Threshold

Минимальный threshold для принятия provider experiment: `quality_score >= 0.90`.

## Evidence

Оценка должна ссылаться на:

- `tests/evals/provider-specific-eval-delta.json`;
- `docs/architecture/llm/provider-experiment-result-template.json`;
- `docs/architecture/llm/provider-budget.json`;
- sprint evidence текущего эксперимента.
