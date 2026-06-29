# Technical Backlog

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Продукт](../README.md) / [Backlog](README.md) / Technical backlog

Версия процесса: 0.1.0
Статус: active
Владелец: Development Team
Проверка: `npm run validate:docs-navigation`

| ID | Название | Связь | Приоритет | Статус | Evidence | Проверка |
|---|---|---|---:|---|---|---|
| TECH-001 | Поддерживать JSON Schema gates | NFR-002 | 1 | active | `scripts/validate-json-schema.mjs` | `npm run validate:schemas` |
| TECH-002 | Валидировать artifact registry | Process Gate | 2 | done | `scripts/validate-artifact-registry.mjs` | `npm run validate:artifact-registry` |
| TECH-003 | Валидировать process versioning | Process Gate | 3 | done | `scripts/validate-process-versioning.mjs` | `npm run validate:process-versioning` |
| TECH-004 | Добавить backlog registry validator | Process Gate | 4 | done | `scripts/validate-backlog-registry.mjs` | `npm run validate:backlog-registry` |
| TECH-005 | Нормализовать contract schema coverage без повторного смысла `TECH-*` | Plan Section 7 | 5 | draft | - | - |

## Правило

Технический backlog должен ссылаться на requirement, NFR, architecture decision или process gate.
