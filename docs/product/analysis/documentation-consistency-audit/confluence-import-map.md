# Карта Импорта Документации В Confluence

Навигация: [DataCanvas](../../../../README.md) / [Документация](../../../README.md) / [Продукт](../../README.md) / [Аналитика](../README.md) / [Аудит согласованности](README.md) / Confluence import

## Правило

Этот документ задает порядок страниц и состав исходных файлов для корпоративного Confluence. Он не выполняет загрузку и не создает отдельный export-каталог.

Перед импортом нужно проверить, что нет открытых блокирующих решений Product Owner — владельца продукта, производные артефакты актуальны, а конфиденциальные данные не попадают в опубликованные страницы.

## Структура Пространства

| Страница Confluence | Источник | Формат | Статус |
|---|---|---|---|
| Обзор DataCanvas | `docs/product/README.md` | Markdown | draft до закрытия аудита. |
| Vision — видение продукта | `docs/product-vision.md` | Markdown | active. |
| BMC — Business Model Canvas, бизнес-модель | `docs/product/bmc/bmc-v0.2.md`, `docs/product/bmc/source/derived/datacanvas-bmc.png`, `docs/product/bmc/source/derived/datacanvas-bmc.pdf` | Markdown/PNG/PDF | active; повторный цикл правок после доставки удален по `BAQ-001`, дополнительные BMC-смягчения B1, B5, B8 и B9 применены по `BAQ-001.1`; ответ `1` по `BAQ-001.2` получен, но финальный импорт ждет завершения оставшихся вопросов BMC-интервью и дальнейший BA-опросник. |
| Stories — пользовательские истории | `docs/product/requirements/user-stories.md` | Markdown | active; канонический каталог `DC-ST-01..DC-ST-29`, включая истории запуска другим агентом и подготовки результата. |
| Business requirements — бизнес-требования | `docs/product/requirements/business-requirements.md` | Markdown | draft; `BT-*` — бизнес-требования для `DC-ST-23..DC-ST-29` уточнены, финальный импорт ожидает полный BA-опросник DataCanvas. |
| Non-functional requirements — нефункциональные требования | `docs/product/requirements/non-functional-requirements.md` | Markdown | draft; требования качества импортируются как отдельный слой между бизнес-требованиями и критериями приемки. |
| Acceptance criteria — критерии приемки | `docs/product/requirements/acceptance-criteria.md` | Markdown | draft. |
| Product backlog — продуктовый список работ | `docs/product/backlog/product-backlog.md`, `docs/product/backlog/agent-launch-candidate-stories-2026-q3.md` | Markdown | draft до ревизии зависимых артефактов, проверки емкости и решения по вытеснению работ. |
| Оценка историй запуска другим агентом | `docs/product/analysis/documentation-consistency-audit/agent-launch-p1-effort-estimation.md` | Markdown | рабочая страница для планирования ресурсов; в бизнесовый импорт входит только после решения о формате Confluence-пакета. |
| Roadmap — дорожная карта | `docs/product/roadmap/roadmap-v0.1.md` | Markdown | draft до BA-опросника, оценки команды и решения по 3-4 ближайшим спринтам. |
| Traceability — трассировка | `docs/product/requirements/traceability-matrix.json` | JSON как вложение или таблица после преобразования | draft; связи `DC-ST-23..DC-ST-29` обновлены, финальный импорт ожидает полный BA-опросник и возможные зависимые правки. |
| Specs — спецификации | `docs/product/specs/README.md`, `docs/product/specs/feature-spec-a2a-launch.json` | Markdown/JSON | внутренний технический раздел, не включается в бизнесовый пакет без отдельного решения. |
| Audit package — пакет аудита | `docs/product/analysis/documentation-consistency-audit/README.md` и связанные файлы | Markdown | внутренний пакет проверки, не входит в бизнесовый импорт до отдельной подготовки экспортной версии. |

## Исключения До Дополнительного Решения

- Исходные локальные источники, рабочие книги и служебные журналы не импортируются как страницы бизнесового пакета.
- Проверочные свидетельства с конфиденциальными данными не импортируются в бизнесовый пакет.
- Автоматически созданная навигация не является бизнесовым источником истины, но может использоваться как технический индекс.

## Перед Импортом

1. Проверить емкость, порядок работ и вытеснение для `DC-ST-23..DC-ST-29` — историй запуска DataCanvas другим агентом и подготовки результата.
2. Обновить зависимые ручные артефакты только после согласованных ответов Product Owner и решений по планированию.
3. Обновить производные артефакты только штатными генераторами.
4. Проверить ссылки, отсутствие утечек и актуальность производных артефактов перед импортом.
