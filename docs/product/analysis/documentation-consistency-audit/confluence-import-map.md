# Карта Импорта Документации В Confluence

Навигация: [DataCanvas](../../../../README.md) / [Документация](../../../README.md) / [Продукт](../../README.md) / [Аналитика](../README.md) / [Аудит согласованности](README.md) / Confluence import

Статус: draft
Владелец: Product Owner / Documentation Owner
Проверка: `npm run validate:doc-links`, `npm run validate:data-leakage`

## Правило

Этот документ задает порядок страниц и состав исходных файлов для корпоративного Confluence. Он не выполняет загрузку и не создает отдельный export-каталог.

Перед импортом нужно проверить, что нет открытых блокирующих решений Product Owner — владельца продукта, generated artifacts — автоматически создаваемые артефакты — актуальны, а sensitive/confidential data — чувствительные или конфиденциальные данные — не попадают в публичные страницы.

## Структура Пространства

| Страница Confluence | Источник | Формат | Статус |
|---|---|---|---|
| Обзор DataCanvas | `README.md`, `docs/README.md`, `docs/product/README.md` | Markdown | draft до закрытия аудита. |
| Vision — видение продукта | `docs/product-vision.md` | Markdown | active. |
| Stories — пользовательские истории | `docs/stories.md` | Markdown | active, но `DC-ST-23..DC-ST-28` — истории запуска другим агентом — требуют оценки. |
| Формализованные пользовательские истории | `docs/product/requirements/user-stories.md` | Markdown | active; обновлены по `UDW-DEC-003` — решению Product Owner о замене старых `US-*` на `DC-ST-*` — пользовательские истории DataCanvas. |
| BMC — Business Model Canvas, бизнес-модель | `docs/product/bmc/bmc-v0.2.md`, `docs/product/bmc/source/derived/datacanvas-bmc.png`, `docs/product/bmc/source/derived/datacanvas-bmc.pdf` | Markdown/PNG/PDF | active; повторный цикл правок после доставки удален по `BAQ-001`, дополнительные BMC-смягчения B1, B5, B8 и B9 применены по `BAQ-001.1`; ответ `1` по `BAQ-001.2` получен, но финальный импорт ждет завершения оставшихся вопросов BMC-интервью и дальнейший BA-опросник. |
| Business requirements — бизнес-требования | `docs/product/requirements/business-requirements.md` | Markdown | draft; `BT-*` — бизнес-требования для `DC-ST-23..DC-ST-28` уточнены, финальный импорт ожидает полный BA-опросник DataCanvas. |
| Acceptance criteria — критерии приемки | `docs/product/requirements/acceptance-criteria.md` | Markdown | draft. |
| Product backlog — продуктовый список работ | `docs/product/backlog/product-backlog.md`, `docs/product/backlog/agent-launch-candidate-stories-2026-q3.md` | Markdown | draft до полного BA-опросника, ревизии зависимых артефактов и оценки емкости. |
| Roadmap — дорожная карта | `docs/product/roadmap/roadmap-v0.1.md` | Markdown | draft до BA-опросника, оценки команды и решения по 3-4 ближайшим спринтам. |
| Traceability — трассировка | `docs/product/requirements/traceability-matrix.json` | JSON как вложение или таблица после преобразования | draft; связи `DC-ST-23..DC-ST-28` обновлены, финальный импорт ожидает полный BA-опросник и возможные зависимые правки. |
| Specs — спецификации | `docs/product/specs/README.md`, `docs/product/specs/feature-spec-a2a-launch.json` | Markdown/JSON | внутренний технический раздел. |
| Audit package — пакет аудита | `docs/product/analysis/documentation-consistency-audit/README.md` и связанные файлы | Markdown | internal evidence, импортировать после удаления незакрытых вопросов или как служебное приложение. |

## Исключения До Дополнительного Решения

- Raw local источники, Excel, OPML и любые локальные пути не импортируются.
- Evidence — проверочные свидетельства — с sensitive/confidential data — чувствительными или конфиденциальными данными — импортируются только как redacted metadata — обезличенные метаданные.
- Generated navigation — автоматически созданная навигация — не является бизнесовым источником истины, но может использоваться как технический индекс.

## Перед Импортом

1. Закрыть `UDW-DEC-005` — решение Product Owner о полном BA-опроснике DataCanvas, включая оставшиеся вопросы BMC-интервью после `BAQ-001.2` — вопроса короткого BMC-интервью по сегментам пользователей.
2. Обновить зависимые ручные артефакты только после согласованных ответов Product Owner.
3. Запустить генераторы навигации, BMC при необходимости и hash manifest — манифест хэшей.
4. Запустить `npm run validate:doc-links`, `npm run validate:data-leakage`, `npm run validate:artifact-hashes`.
