# Planning

Версия процесса: 0.1.0

## Scope

В scope входит backfill manifest и forward rule. Отдельные исторические security meetings не создаются задним числом.

## Acceptance

- Каждый `docs/sprints/*` имеет запись в `threat-model-delta-manifest.json`.
- S21 explicit `threat-model-delta.md` остается evidence.
- Новый sprint folder без записи в manifest ломает validator.
- `npm run validate:threat-model-delta` включен в `npm test`.
