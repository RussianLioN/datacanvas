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
- [Prompt-only согласование артефактов проектной документации](prompt-only-artifact-review/README.md)
- [Универсальный рабочий процесс документации](universal-documentation-workflow/README.md)
- [Синхронизация Excel backlog DataCanvas](guides/datacanvas-excel-backlog-sync.md)
- [Массовый импорт пользовательских историй DataCanvas в Jira](guides/datacanvas-jira-story-bulk-import.md)

## Изменение Процесса

Изменение правила процесса оформляется через `PROC-*`, синхронизируется с реестром процесса и проходит navigation gate, если затрагивает документы или маршруты.

Draft `PROC-038` предоставляет opt-in контракт `DocumentationChangeRequest` и cascade impact analysis для проверочных запусков. Он не является обязательным правилом процесса до отдельного решения Process Owner.

Текущие процессные аудиты хранятся в `docs/process/audits/`. Аудит разделения задачи форматирования таблиц Codex CLI от продуктового пилота DataCanvas зафиксирован в [аудите форматирования таблиц Codex CLI](audits/codex-cli-table-output-process-audit.md). Исправленный протокол трехфазного брейншторма для полного BA-пакета DataCanvas зафиксирован в [аудите трехфазного брейншторма BA-пакета](audits/datacanvas-ba-package-three-phase-brainstorm.md).

## Методика Документации

`PROC-039` подключает BABOK-исследование как baseline методического ядра. `PROC-040` фиксирует минимально полный контур: policy, source index, traceability model, coverage map, templates, validator diagnostics, fixtures и navigation/hash registration. Этот этап не меняет бизнес-содержание требований; он добавляет правила применения, шаблоны и проверки.

`PROC-046` добавляет контракт сохранения PO-опросника: активное состояние и журнал обновляются после каждого ответа, а продолжение выполняется с вопроса, записанного в state. Для `CO-2026-001` контракт описан в [протоколе PO-опросника](../product/change-orders/product-change-questionnaire-protocol.md).

Prompt-only согласование артефактов проектной документации задает рабочий процесс, который запускается одним текстовым запросом и ведет просмотр, ссылки, решения, правки источников, генерацию производных файлов и проверки без ручного запуска команд пользователем.

Универсальный рабочий процесс документации выделяет переносимое ядро методики, профиль конкретного ИТ-продукта и экземпляр изменения. DataCanvas в нем используется как пилотный профиль; продуктовые решения остаются в продуктовых источниках истины, а правила workflow живут в домене `documentation_operations`.
