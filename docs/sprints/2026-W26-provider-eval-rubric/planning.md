# Planning

Версия процесса: 0.1.0

## Контекст

Sprint 10 определил `ProviderExperimentResult`, но `quality_score` нуждался в воспроизводимой методике расчета и provider-specific eval cases.

## План

1. Создать schema для provider-specific eval delta.
2. Создать delta cases для quality, security, latency, cost и reliability.
3. Зафиксировать веса scoring rubric.
4. Проверить, что веса суммируются в 1.
5. Связать delta с experiment result и provider allowlist.
6. Подключить validation к общему gate.

## Acceptance Criteria

- Eval delta проходит schema validation.
- Все обязательные provider eval types покрыты.
- Веса равны 1.
- Rubric содержит threshold `quality_score >= 0.90`.
- `npm test` проходит.
