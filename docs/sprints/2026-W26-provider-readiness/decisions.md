# Decisions

Версия процесса: 0.1.0

## DEC-S8-001

Решение: Sprint 8 не подключает внешний provider, а только готовит управляемый readiness gate.

Причина: no-network-by-default остается обязательным инвариантом до принятия `PROC-007`.

## DEC-S8-002

Решение: provider должен иметь offline fallback через `scripts/llm-mock-adapter.mjs`.

Причина: DataCanvas должен оставаться воспроизводимым при недоступности provider или нарушении output contract.
