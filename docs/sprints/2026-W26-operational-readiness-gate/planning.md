# Planning

## Цель

Сделать Operational Readiness Gate воспроизводимым и применимым к следующим product increments.

## Scope

В scope входят checklist, runbook, manifest, schema, validator, ADR, registry, bootstrap, CI и evidence pack.

## Out Of Scope

- Production on-call playbook.
- Интеграция с внешним мониторингом.
- Автоматический сбор live metrics.

## Done When

- `npm run validate:ops-readiness` проходит.
- `npm test` проходит.
- Plan coverage audit больше не содержит gap по runbook/checklist.
