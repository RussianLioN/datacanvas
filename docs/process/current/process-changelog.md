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

### PROC-036 - Documentation Navigation Governance

Статус: accepted
Дата: 2026-06-25
Источник: `docs/process/change-requests/PROC-036-documentation-navigation-governance.md`

#### Изменение

Закреплен business-first порядок для `README.md`, `docs/README.md` и `docs/product/README.md`. В navigation contract добавлен `navigation_group`, а generated navigation строится группами: business, delivery, technical, governance, evidence и generated.

#### Миграция

Бизнесовые документы DataCanvas добавлены в product index, business routes, artifact registry и generated navigation. Technical backlog явно классифицирован как `technical`, а archived documentation implementation plan классифицирован как governance artifact.

#### Rollback

Откатить `docs/navigation/navigation-source.json`, schemas, generator, validator, registry, hash manifest, generated navigation outputs и business-first README changes одним PR, затем повторить docs navigation, artifact и security gates.

### PROC-037 - Governed BA/SA Discovery Loop

Статус: draft
Дата: 2026-07-02
Источник: `docs/process/change-requests/PROC-037-governed-ba-sa-discovery-loop.md`

#### Изменение

Предложено добавить BA/SA interview evidence, claim status, evidence requests, open question ownership, SA contract/security/NFR check и rollback signals в DoR, DoD и process event log.

#### Миграция

До Process Owner acceptance правило остается draft. Артефакты и валидаторы можно использовать как подготовленный gate, но они не меняют принятую версию процесса.

#### Rollback

Откатить DoR/DoD/process event additions и убрать BA/SA gates из `npm test`.
