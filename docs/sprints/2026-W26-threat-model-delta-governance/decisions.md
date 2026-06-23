# Decisions

Версия процесса: 0.1.0

## DEC-S35-001

Решение: использовать единый `threat-model-delta-manifest.json` для historical backfill и forward rule.

Причина: это дает машинную проверку покрытия всех sprint folders без переписывания старых sprint summaries.

## DEC-S35-002

Решение: новый sprint folder без coverage entry должен ломать validation gate.

Причина: требование плана о threat model delta в каждом спринте должно быть enforceable.
