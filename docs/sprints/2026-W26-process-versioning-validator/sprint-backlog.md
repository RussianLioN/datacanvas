# Sprint Backlog

Версия процесса: 0.1.0

## Items

- `PROC-019`: добавить manifest версии процесса.
- `PROC-020`: добавить snapshot процесса `0.1.0`.
- `QA-019`: добавить validator process versioning.
- `ADR-019`: зафиксировать правило проверяемого версионирования процесса.
- `ART-075..ART-080`: обновить artifact registry.

## Definition of Done

- `npm run validate:process-versioning` проходит.
- Проверка включена в `npm test` и CI.
- Bootstrap и schema validation знают о новых артефактах.
- Evidence-манифест содержит фактические результаты проверок.
