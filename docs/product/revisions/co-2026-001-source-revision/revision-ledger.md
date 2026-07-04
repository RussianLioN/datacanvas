# Ledger Ревизии Исходных Документов `CO-2026-001`

Навигация: [DataCanvas](../../../../README.md) / [Документация](../../../README.md) / [Продукт](../../README.md) / [Исходные документы](../../sources/README.md) / Ledger ревизии

Статус: draft
Владелец: Product Owner
Проверка: `npm run validate:change-set-approval`

## Назначение

Ledger фиксирует, какие ранее выпущенные документы требуют правки после принятия `CO-2026-001` — смены продуктового приоритета DataCanvas, — и какой статус имеет каждая правка.

## Статусы

| Документ | Статус До Ревизии | Требуемое Действие | Статус Решения |
|---|---|---|---|
| `docs/product-vision.md` | active, частично обновлен | Разделить основной сценарий по двум режимам | applied |
| `docs/product/bmc/bmc-v0.2.md` | accepted, needs_revision | Убрать технические обозначения из стейкхолдерского текста и развести каналы | applied |
| `docs/product/requirements/business-requirements.md` | draft, needs_revision | Разделить правило подтверждения для Лисы и запуска другим агентом | applied |
| `docs/product/requirements/acceptance-criteria.md` | draft, needs_revision | Добавить отдельный сценарий приемки для запуска другим агентом | applied |
| `docs/product/analysis/ba/ba-spec.json` | draft, needs_revision | Закрыть устаревшее утверждение о канале доставки | pending |
| `docs/architecture/system-analysis/sa-spec.json` | draft, needs_revision | Добавить альтернативный путь без пользовательского подтверждения | pending |
| `docs/product/specs/feature-spec-a2a-launch.json` | draft, needs_revision | Обновить решение о доставке без расширения рабочих интеграций | pending |
| `docs/product/requirements/traceability-matrix.json` | draft, needs_revision | Разделить трассировку по двум режимам | pending |
| `docs/process/cascading-governance/runs/2026-07-02-co-2026-001-q3-priority-impact/` | historical blocked evidence | Не переписывать; оставить историческим доказательством | not_required |

## Текущий Блокер

Смысловые правки `EDIT-005` — BA-утверждения по каналу доставки, `EDIT-006` — системный анализ, `EDIT-007` — feature spec и `EDIT-008` — трассировка ожидают принятия Product Owner.

До принятия они не должны попадать в рабочие документы как примененные изменения.
