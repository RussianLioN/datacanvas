# Decisions

Версия процесса: 0.1.0

## DEC-S36-001

Решение: accepted process changes фиксируются в `process-change-ledger.json`.

Причина: changelog и PCR должны быть связаны машинно, иначе процесс можно изменить вручную без evidence.

## DEC-S36-002

Решение: `PROC-035` принимается как managed improvement текущей версии `0.1.0`.

Причина: gate уже реализован и прошел validation; новая версия процесса не требуется, потому что cadence и роли не менялись.
