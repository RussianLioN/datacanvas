# ADR-036: Process Change Ledger

## Статус

Accepted

## Контекст

План DataCanvas требует, чтобы процесс можно было менять через PCR, changelog и migration notes без ручного переписывания методологии. До этого changelog фиксировал только стартовую версию, а принятые validation gates не имели единого проверяемого ledger.

## Решение

Добавить `docs/process/current/process-change-ledger.json`, схему `schemas/process-change-ledger.schema.json` и валидатор `scripts/validate-process-change-ledger.mjs`.

Ledger связывает:

- PCR markdown;
- changelog anchor;
- affected artifacts;
- validation commands;
- migration notes;
- rollback.

## Последствия

- Принятые изменения процесса становятся проверяемыми.
- `process-changelog.md` должен содержать anchor для каждого accepted ledger entry.
- Командное решение по будущим PCR все равно должно приниматься людьми; ledger проверяет структуру и evidence.
