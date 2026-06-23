# Sprint Backlog

Версия процесса: 0.1.0

## Items

- `QA-018`: добавить валидатор artifact registry.
- `ADR-018`: зафиксировать правило registry validation.
- `TECH-020`: подключить проверку к `npm test` и CI.
- `ART-072..ART-074`: обновить реестр артефактов.

## Definition of Done

- `npm run validate:artifact-registry` проходит.
- Проверка включена в `npm test`.
- Bootstrap знает о новом валидаторе, ADR и evidence-манифесте.
- Evidence-манифест содержит фактические результаты проверок.
