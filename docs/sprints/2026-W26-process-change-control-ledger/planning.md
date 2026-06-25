# Planning

Версия процесса: 0.1.0

## Scope

В scope входит проверяемый ledger для уже принятого process gate `PROC-035`. Не создается новая версия процесса и не принимается `PROC-007`.

## Acceptance

- `PROC-035` имеет accepted PCR.
- `process-changelog.md` содержит запись `PROC-035`.
- `process-change-ledger.json` проходит schema validation.
- `npm run validate:process-change-ledger` проходит и включен в `npm test`.
