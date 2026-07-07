# Карта Источников Истины Для Аудита Согласованности

Навигация: [DataCanvas](../../../../README.md) / [Документация](../../../README.md) / [Продукт](../../README.md) / [Аналитика](../README.md) / [Аудит согласованности](README.md) / Карта источников

Статус: active
Владелец: Product Owner / Process Owner
Проверка: `npm run validate:product-sources`, `npm run validate:product-source-consistency`

## Правило Приоритета

Приоритет источников берется из `docs/product/sources/product-source-registry.json`: принятое продуктовое решение, текущий Vision — видение продукта, accepted BMC — принятая бизнес-модель, story catalog — каталог пользовательских историй, product planning — планирование продукта, formalized requirements — формализованные требования, traceability — трассировка, analysis source — аналитический источник, technical spec — техническая спецификация, evidence — проверочное свидетельство, generated output — автоматически созданный результат, historical snapshot — исторический снимок.

## Основные Источники

| Источник | Роль | Статус | Вывод для аудита |
|---|---|---|---|
| `CO-2026-001` — заявка на приоритет запуска другим агентом: `docs/product/change-orders/co-2026-001-a2a-first-priority.md` | Принятое продуктовое решение | accepted | Канонический приоритет: первым направлением становится запуск DataCanvas другим агентом, вторым — запрос пользователя через Лису. |
| Vision — видение продукта: `docs/product-vision.md` | Текущий продуктовый смысл | active | Подтверждает два режима, доставку по электронной почте и отсутствие пользовательского подтверждения при запуске другим агентом после проверки данных. |
| BMC — Business Model Canvas, бизнес-модель продукта: `docs/product/bmc/bmc-v0.2.md` | Accepted BMC | accepted | После ответа `BAQ-001` — вопроса бизнес-анализа о BMC-границе — чистовой BMC больше не утверждает повторный цикл правок после доставки. После ответа `BAQ-001.1` — вопроса бизнес-анализа по дополнительным BMC-правкам — B1, B5, B8 и B9 смягчены; `BAQ-001.2` — вопрос короткого BMC-интервью — должен подтвердить пользовательские сегменты BMC. |
| `DC-ST-*` — пользовательские истории DataCanvas: `docs/stories.md` | Канонический каталог stories | active | Содержит `DC-ST-23..DC-ST-28` — подтвержденные Product Owner P1-истории запуска другим агентом; численные ПШЕ требуют оценки по Excel-матрице трудозатрат и ролей. |
| `BT-*` — бизнес-требования: `docs/product/requirements/business-requirements.md` | Формализованные требования | draft | `BT-005` — бизнес-требование о запуске подготовки презентации — относится только к маршруту через Лису по команде КМ. Для запуска другим агентом созданы `BT-015` — бизнес-требование о приеме запроса, `BT-016` — бизнес-требование о входном пакете, `BT-017` — бизнес-требование о проверке входа — и `BT-018` — бизнес-требование о статусах обработки без утверждения реальной callback-интеграции. `BT-014` — бизнес-требование о трассировке жизненного цикла — уточнено для двух маршрутов. |
| Acceptance criteria — критерии приемки: `docs/product/requirements/acceptance-criteria.md` | Формализованные проверки поведения | draft | Подтверждают запуск другим агентом без пользовательского подтверждения и диалоговый выбор в Лисе. |
| Product backlog — продуктовый список работ: `docs/product/backlog/product-backlog.md` | Product planning | draft | Хранит `DC-ST-23..DC-ST-28` как P1-истории без численной оценки ПШЕ; для оценки подготовлена матрица `docs/product/analysis/documentation-consistency-audit/agent-launch-p1-effort-estimation.md`, а утвержденный sprint backlog — список работ спринта — ждет оценки команды, полного BA-опросника DataCanvas и решения по вытеснению работ. |
| Roadmap — дорожная карта: `docs/product/roadmap/roadmap-v0.1.md` | Product planning | draft | Пока не отражает явное перепланирование 3-4 недельных спринтов под запуск другим агентом; перепланирование отложено до BA-опросника и оценки команды. |
| Traceability — трассировка: `docs/product/requirements/traceability-matrix.json` | Traceability | draft | Покрывает `BT-*`, но требует проверки связи `DC-ST-23..DC-ST-28` с требованиями и будущими задачами. |
| BA/SA artifacts — артефакты бизнес- и системного анализа | Analysis/technical spec | draft | Подтверждают принятый маршрут, но не заменяют полный BA-опросник DataCanvas и решения Product Owner по BMC, stories, требованиям и будущему backlog refinement — уточнению продуктового списка работ. |

## Generated Artifacts

| Артефакт | Источник | Генератор | Правило |
|---|---|---|---|
| BMC SVG/PNG/PDF — производные файлы бизнес-модели | `docs/product/bmc/bmc-v0.2.md` и `docs/product/bmc/bmc-trace.v0.1.json` | `npm run generate:bmc` | Не редактировать вручную. |
| Navigation map — карта навигации | `docs/navigation/navigation-source.json` | `npm run generate:docs-navigation` | Не редактировать вручную. |
| Artifact hash manifest — манифест хэшей | `docs/architecture/schemas/artifact-registry.json` | `node scripts/generate-artifact-hash-manifest.mjs` | Не редактировать вручную. |

## Запрещенные Источники Первичного Продуктового Смысла

`ADR-*` — архитектурные решения, schemas — схемы, scripts — скрипты, generated artifacts — автоматически создаваемые артефакты — и release evidence — релизные проверочные свидетельства — используются для проверки и технической трассировки, но не как первичный источник бизнесового смысла.
