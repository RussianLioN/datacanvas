# EXP-001: Controlled LLM Provider Experiment

ID: `EXP-001`
Связанный `PROC-*`: `PROC-007`
Статус: planned
Период проверки: 1 спринт после принятия `PROC-007`

## Гипотеза

Если включить внешний LLM provider только в controlled experiment с allowlist, budget, trace evidence, eval pack и offline fallback, то команда сможет измерить качество, стоимость, latency и failure modes без разрушения no-network-by-default процесса.

## Метрика

Основная метрика: доля eval cases, прошедших provider-specific проверку.
Целевое значение: не ниже 0.90.
Baseline: offline mock adapter проходит structural gates, но не измеряет качество реальной модели.

## Ограничения

- Что не меняем: renderer, `PresentationSpec`, export sanitization, no-network-by-default для default flow.
- Какие риски отслеживаем: unsupported claims, prompt-injection leakage, рост стоимости, latency выше budget, model errors, секреты в logs.
- Когда эксперимент останавливается досрочно: provider output нарушает schema, claim traceability, budget, security stop rule или fallback.

## Evidence

- Где фиксируются данные: `docs/architecture/llm/provider-experiment-result-template.json`, sprint evidence, trace manifest.
- Кто обновляет: SRE/LLM Ops Lead и QA/Evals Lead.
- Когда проверяется: Sprint Review и Retrospective.

## Решение По Итогу

Оставить / изменить / откатить.

До принятия `PROC-007` эксперимент не запускается.
