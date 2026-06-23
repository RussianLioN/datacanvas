# Decisions

Версия процесса: 0.1.0

## DEC-S11-001

Решение: provider-specific eval weights должны суммироваться в 1.

Причина: иначе `quality_score` нельзя воспроизводимо интерпретировать.

## DEC-S11-002

Решение: threshold принятия provider experiment равен `quality_score >= 0.90`.

Причина: внешний provider должен улучшать качество без ослабления безопасности, стоимости и reliability.
