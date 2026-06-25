# Журнал Изменений Процесса

## 0.1.0 - 2026-06-22

Статус: active
PCR: `PROC-001`

### Добавлено

- Стартовый паспорт процесса.
- Реестр процесса.
- Process Backlog.
- Шаблон Process Change Request.
- Шаблон процессного эксперимента.
- Метрики здоровья процесса.
- Definition of Ready и Definition of Done.
- Sprint 0 evidence package.

### Причина

Запуск DataCanvas требует управляемого процесса разработки до начала продуктовой реализации.

### Миграции

Миграций нет: это первая версия процесса.

## Управляемые Улучшения Процесса В 0.1.0

### PROC-035 - Threat Model Delta Governance

Статус: accepted
Дата: 2026-06-22
Источник: `docs/process/change-requests/PROC-035-threat-model-delta-governance.md`

#### Изменение

Добавлен обязательный gate `npm run validate:threat-model-delta`, который проверяет, что каждый `docs/sprints/*` имеет запись в `docs/architecture/security/threat-model-delta-manifest.json`.

#### Миграция

Все существующие sprint folders получили coverage entry в manifest. Для будущих спринтов migration rule простое: создать sprint folder можно до Review, но закрыть Review нельзя, пока sprint не добавлен в threat-model delta manifest.

#### Rollback

Удалить gate из `npm test` и CI, вернуть section 9 plan coverage в `partial`, оставить S21 explicit `threat-model-delta.md` как единственный обязательный artifact до нового PCR.
