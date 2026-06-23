# ADR-014: Provider Experiment Result Contract

Дата: 2026-06-22  
Статус: Accepted  
Версия процесса: 0.1.0

## Контекст

Перед controlled experiment с внешним LLM provider команда должна заранее определить, как фиксируются результат, метрики, security evidence и rollback decision. Иначе experiment может стать ручным событием без воспроизводимого evidence.

## Решение

Добавить `ProviderExperimentResult` schema и planned template:

- schema: `schemas/provider-experiment-result.schema.json`;
- template: `docs/architecture/llm/provider-experiment-result-template.json`;
- process experiment: `docs/process/experiments/EXP-001-controlled-llm-provider.md`;
- validator: `scripts/validate-provider-experiment.mjs`.

До принятия `PROC-007` result остается в статусе `planned`, а decision — `not_started`.

## Последствия

Плюсы:

- experiment заранее имеет измеримые критерии;
- rollback становится обязательным полем;
- quality, cost, latency и security evidence фиксируются структурно.

Ограничения:

- реальный provider не подключается;
- нулевые planned metrics не являются фактическими измерениями.
