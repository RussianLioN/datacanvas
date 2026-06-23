# Decisions

Версия процесса: 0.1.0

## DEC-S12-001

Решение: scorer работает на frozen/mock output до запуска реального provider experiment.

Причина: scorer должен быть проверяемым до появления внешней сети и нестабильного provider.

## DEC-S12-002

Решение: `linked_risk` в provider eval delta должен ссылаться на risk registry.

Причина: eval cases должны быть связаны с управляемыми рисками, а не свободным текстом.
