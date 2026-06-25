# Decisions

## DEC-S38-001

Collector считает только репозиторные факты: количество sprint folders, evidence manifests, registry entries, accepted PCR и статусы evidence checks.

## DEC-S38-002

`generated_at` фиксируется детерминированно для текущего bootstrap period, чтобы snapshot был воспроизводимым в CI.
