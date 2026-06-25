# Decisions

Версия процесса: 0.1.0

## DEC-S13-001

Решение: scorer должен иметь positive и negative fixture.

Причина: validation без rollback branch не доказывает способность процесса отклонять опасный provider output.

## DEC-S13-002

Решение: provider risks должны быть связаны с НФТ через traceability matrix.

Причина: риски должны быть частью требований и acceptance gates, а не отдельным списком.
