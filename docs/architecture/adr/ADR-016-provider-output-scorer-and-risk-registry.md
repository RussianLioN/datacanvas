# ADR-016: Provider Output Scorer И Risk Registry

Дата: 2026-06-22
Статус: Accepted
Версия процесса: 0.1.0

## Контекст

Sprint 11 задал provider-specific eval delta и scoring rubric, но score еще не вычислялся автоматически, а `linked_risk` оставался строковой меткой без machine-checkable registry.

## Решение

Добавить:

- `schemas/risk-registry.schema.json`;
- `docs/architecture/risks/risk-registry.json`;
- `scripts/score-provider-output.mjs`;
- `scripts/validate-provider-scorer.mjs`;
- frozen scored result `tests/provider/provider-experiment-result-scored.json`.

Scorer работает на offline mock output и не выполняет сетевых вызовов.

## Последствия

Плюсы:

- `quality_score` становится воспроизводимым;
- `linked_risk` проверяется по registry;
- future provider experiment получает baseline scorer до запуска сети.

Ограничения:

- текущий scored result не является доказательством качества реального provider;
- реальные latency, cost и failure rate будут измеряться только в controlled experiment.
