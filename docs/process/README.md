# Процесс DataCanvas

Навигация: [DataCanvas](../../README.md) / [Документация](../README.md) / Процесс

Статус: active
Владелец: Process Owner
Проверка: `npm run validate:docs-navigation`

## Стартовые Документы

- [Паспорт процесса](current/process-passport.md)
- [Реестр процесса](current/process-registry.md)
- [Definition of Ready](current/definition-of-ready.md)
- [Definition of Done](current/definition-of-done.md)
- [Process backlog](current/process-backlog.md)
- [Process change ledger](current/process-change-ledger.json)
- [Методика проектной документации](methodology/README.md)
- [Каскадное ведение документации](cascading-governance/README.md)

## Изменение Процесса

Изменение правила процесса оформляется через `PROC-*`, синхронизируется с реестром процесса и проходит navigation gate, если затрагивает документы или маршруты.

Draft `PROC-038` предоставляет opt-in контракт `DocumentationChangeRequest` и cascade impact analysis для проверочных запусков. Он не является обязательным правилом процесса до отдельного решения Process Owner.

## Методика Документации

`PROC-039` подключает BABOK-исследование как baseline методического ядра. `PROC-040` фиксирует минимально полный контур: policy, source index, traceability model, coverage map, templates, validator diagnostics, fixtures и navigation/hash registration. Этот этап не меняет бизнес-содержание требований; он добавляет правила применения, шаблоны и проверки.
