# Аудит Исходных Документов DataCanvas

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Продукт](../README.md) / [Исходные документы](README.md) / Аудит исходных документов

Статус: draft
Владелец: Product Owner
Проверка: `npm run validate:product-sources`
Дата: 2026-07-03

## Назначение

Аудит фиксирует текущее состояние исходных документов DataCanvas перед применением правок по `CO-2026-001`.

## Вывод

`CO-2026-001` принят как смена продуктового приоритета: первым направлением становится запуск DataCanvas другим агентом, вторым - диалоговый режим в Лисе.

Часть документов уже отражает новое решение, но downstream-слой требует ревизии. Смысловые правки вынесены в пакет согласования и не применяются без решения Product Owner.

## Текущее Покрытие

| Документ | Роль | Состояние |
|---|---|---|
| `docs/product-vision.md` | Текущий Vision | `EDIT-001` применен: основной сценарий разделен на запуск другим агентом и диалоговый режим в Лисе |
| `docs/product/vision/vision-v0.1.md` | Исторический snapshot | Используется для сравнения, не конкурирует с текущим Vision |
| `docs/stories.md` | Каталог stories | Содержит `DC-ST-23..DC-ST-28` как candidate stories |
| `docs/product/backlog/product-backlog.md` | Product backlog | Содержит кандидаты `DC-ST-23..DC-ST-28`; состав backlog требует отдельного PO-согласования |
| `docs/product/backlog/agent-launch-candidate-stories-2026-q3.md` | Истории-кандидаты | Непосредственный источник строк `DC-ST-23..DC-ST-28` для backlog |
| `docs/product/roadmap/roadmap-v0.1.md` | Roadmap | Используется как плановый контекст для проверки влияния `CO-2026-001`; смысловые изменения требуют отдельного решения PO |
| `docs/product/hypotheses/hypothesis-board.md` | Гипотезы | Прямое расхождение с `CO-2026-001` в первом пакете ревизии не зафиксировано |
| `docs/product/hypotheses/hypothesis-validation.md` | Проверка гипотез | План проверки гипотез; прямое расхождение с `CO-2026-001` в первом пакете ревизии не зафиксировано |
| `docs/product/change-orders/co-2026-001-a2a-first-priority.md` | Принятое изменение | Accepted, источник нового приоритета |
| `docs/product/bmc/bmc-v0.2.md` | BMC | `EDIT-002` применен: BMC разделяет запуск другим агентом, диалоговый режим в Лисе и доставку файла по электронной почте |
| `docs/product/requirements/business-requirements.md` | Бизнес-требования | Требует разделить общий approval gate по режимам |
| `docs/product/requirements/acceptance-criteria.md` | Критерии приемки | Требует отдельный сценарий для запуска другим агентом |
| `docs/product/analysis/ba/ba-spec.json` | BA claims | Содержит устаревшее утверждение о неподтвержденном delivery channel |
| `docs/architecture/system-analysis/sa-spec.json` | Системный анализ | Требует альтернативный путь без пользовательского approval для агентского запуска |
| `docs/product/specs/feature-spec-a2a-launch.json` | FeatureSpec | Требует обновить delivery decision после принятия `CO-2026-001` |
| `docs/product/requirements/traceability-matrix.json` | Traceability | Требует связать новый приоритет с requirements/specs/acceptance |
| `docs/process/cascading-governance/runs/2026-07-02-co-2026-001-q3-priority-impact/` | Исторический cascade evidence | Должен остаться historical/blocked или быть перекрыт новой ревизией |

## Следующий Шаг

Продолжить согласование с первой незакрытой правки из `docs/product/revisions/co-2026-001-source-revision/revision-approval-state.json`.
