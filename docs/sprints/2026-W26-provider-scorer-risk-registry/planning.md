# Planning

Версия процесса: 0.1.0

## Контекст

Sprint 11 дал rubric и eval delta, но `linked_risk` не проверялся по registry, а `quality_score` не вычислялся автоматически.

## План

1. Создать risk registry schema.
2. Создать risk registry для provider experiment.
3. Реализовать offline scorer.
4. Сгенерировать scored result artifact.
5. Проверить scored result по schema.
6. Проверить, что все `linked_risk` есть в registry.
7. Подключить scorer к общему gate.

## Acceptance Criteria

- Risk registry проходит schema validation.
- Все `linked_risk` из provider eval delta существуют в registry.
- Scored result проходит `ProviderExperimentResult` schema.
- `quality_score >= 0.90` на frozen/mock output.
- `npm test` проходит.
