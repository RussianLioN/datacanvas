# Sprint Backlog

Версия процесса: 0.1.0

## Items

- `TECH-023`: добавить `RenderRequest` schema.
- `PROC-023`: добавить `ProcessChangeRequest` schema.
- `SEC-023`: добавить `ToolAllowlist` schema.
- `OPS-023`: добавить `TraceContract` schema.
- `QA-024`: добавить contract schema validator.
- `ADR-023`: зафиксировать contract schemas decision.

## Definition of Done

- `npm run validate:contracts` проходит.
- Contract validation включен в `npm test` и CI.
- Plan coverage audit переводит раздел contract schemas в `covered`.
- Evidence-манифест содержит фактические результаты проверок.
