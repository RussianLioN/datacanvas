# Planning

## Цель

Закрыть отсутствие UAT script и human review skeleton без преждевременной реализации UI.

## Scope

В scope входят документы UX/UAT, JSON state model, schemas, validator, ADR, registry, bootstrap, CI и evidence.

## Out Of Scope

- Интерактивный UI.
- Реальный экран редактирования.
- PDF/PNG export runtime.
- Production UAT report.

## Done When

- `npm run validate:uat-human-review` проходит.
- `npm test` проходит.
- Audit больше не утверждает, что UAT/human review skeleton отсутствует полностью.
