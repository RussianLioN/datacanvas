# Decisions

Версия процесса: 0.1.0

## DEC-S14-001

Решение: risk traceability выделяется в отдельный typed artifact.

Причина: risk linkage должен проверяться независимо от человекочитаемых НФТ и общей traceability matrix.

## DEC-S14-002

Решение: prompt-injection, cost и latency violations должны приводить к rollback decision.

Причина: controlled provider experiment не может быть принят при нарушении security или budget stop-rules.
