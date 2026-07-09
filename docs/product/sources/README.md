# Исходные Документы Продукта DataCanvas

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Продукт](../README.md) / Исходные документы

Статус: draft
Владелец: Product Owner
Проверка: `npm run validate:product-sources`, `npm run validate:xlsx-backlog`

## Назначение

Этот раздел показывает, какие документы считаются исходными для продуктового смысла DataCanvas, а какие являются производными, историческими или проверочными.

Если документы расходятся, решение принимается по актуальному источнику с более высоким приоритетом, а не по generated artifacts, старым evidence или техническим схемам.

## Текущий Порядок Доверия

1. Принятые решения Product Owner и accepted `CO-*`.
2. Текущее видение продукта.
3. Принятый BMC и каталог stories.
4. Требования, критерии приемки и traceability.
5. BA/SA analysis и specs.
6. Evidence, журналы, generated artifacts и исторические snapshots.

## Основные Источники

- [Текущее видение](../../product-vision.md) - действующий обзорный источник продуктового смысла.
- [Snapshot Vision v0.1](../vision/vision-v0.1.md) - историческая версия для сравнения.
- [Каталог stories](../../stories.md) - канонический каталог пользовательских историй.
- [BMC](../bmc/README.md) - бизнесовая модель и локальный контур трассировки BMC.
- [Change Orders](../change-orders/README.md) - принятые и обсуждаемые изменения продукта.
- [Требования](../requirements/README.md) - формализованный downstream-слой.
- [Бизнес-анализ](../analysis/README.md) - claims, business rules, deltas и открытые решения.
- [System analysis](../../architecture/system-analysis/README.md) - системные сценарии, состояния и ошибки.
- [Specs](../specs/README.md) - контекст для реализации и проверок.

## Машинный Реестр

Машинно-проверяемый реестр находится в [`product-source-registry.json`](product-source-registry.json).

Он фиксирует `source_id`, владельца, жизненный цикл, статус доверия, допустимое использование и связанные документы.

## Сырые Исходники

Сырые файлы Product Owner хранятся в `docs/product/sources/raw/` и учитываются через машинный реестр.

- `docs/product/sources/raw/bl-value-rm-data-canvas.xlsx` - сохраненная копия Excel-источника stories, приоритетов, сроков и оценок. Файл не является публичной страницей документации и используется для аудита происхождения stories, поиска прежнего преобразования в OPML и проверки пакета импорта в Jira.

## Рабочие Excel-Версии

Рабочие Excel-версии хранятся в `docs/product/sources/working/` и учитываются через машинный реестр. Они не заменяют raw-источники Product Owner и не считаются утвержденными оценками без отдельного решения.

- `docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.xlsx` - рабочая версия backlog: версия исходного листа `Лист1` с добавленными строками `DC-ST-23..DC-ST-29` и рабочими значениями ПШЕ для проверки командой реализации.
- `docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.provenance.json` - машинный манифест происхождения рабочей версии: фиксирует raw-источник, SHA-256, допустимое отличие, строки, аналоги и статус согласования.
- `docs/product/sources/story-catalog-content-lock.json` - машинный lock-файл каталога пользовательских историй: помогает проверить, что очистка структуры `docs/stories.md` не меняет согласованный текст историй и бизнес-ценностей.

## Индексы Восстановления И Экспорта

- `docs/product/sources/xlsx-opml-jira-recovery-index.json` - машинный индекс текущего состояния цепочки `XLSX -> OPML -> Jira import`: какие исходники найдены, какие артефакты еще нужно восстановить и какие файлы связаны с Confluence-ready package — комплектом для Confluence.

## Проверка Excel-Оценок

Рабочие Excel-версии backlog проверяются командой:

```bash
npm run validate:xlsx-backlog
```

Эта проверка сверяет raw XLSX, working XLSX, provenance manifest — манифест происхождения — и golden-описание допустимых изменений. Она обязательна перед переносом утвержденных командой оценок ПШЕ в sprint planning — планирование спринта.

## Ревизия По CO-2026-001

Пакет ревизии по принятому изменению `CO-2026-001` находится в [`../revisions/co-2026-001-source-revision/revision-ledger.md`](../revisions/co-2026-001-source-revision/revision-ledger.md).

Смысловые правки не применяются автоматически. Каждая такая правка должна иметь запись принятия или явную причину, почему документ остается без изменений.
