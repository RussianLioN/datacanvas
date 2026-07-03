# Ledger Ревизии Исходных Документов `CO-2026-001`

Навигация: [DataCanvas](../../../../README.md) / [Документация](../../../README.md) / [Продукт](../../README.md) / [Исходные документы](../../sources/README.md) / Ledger ревизии

Статус: draft
Владелец: Product Owner
Проверка: `npm run validate:change-set-approval`

## Назначение

Ledger фиксирует, какие ранее выпущенные документы требуют правки после принятия `CO-2026-001`, и какой статус имеет каждая правка.

## Статусы

| Документ | Статус До Ревизии | Требуемое Действие | Статус Решения |
|---|---|---|---|
| `docs/product-vision.md` | active, частично обновлен | Разделить основной сценарий по двум режимам | applied |
| `docs/product/bmc/bmc-v0.2.md` | accepted, needs_revision | Убрать технические обозначения из стейкхолдерского текста и развести каналы | applied |
| `docs/product/requirements/business-requirements.md` | draft, needs_revision | Разделить approval gate для Лисы и агентского запуска | pending |
| `docs/product/requirements/acceptance-criteria.md` | draft, needs_revision | Добавить отдельный acceptance path для агентского запуска | pending |
| `docs/product/analysis/ba/ba-spec.json` | draft, needs_revision | Закрыть устаревший delivery-channel claim | pending |
| `docs/architecture/system-analysis/sa-spec.json` | draft, needs_revision | Добавить альтернативный путь без approval | pending |
| `docs/product/specs/feature-spec-a2a-launch.json` | draft, needs_revision | Обновить delivery decision без расширения live integrations | pending |
| `docs/product/requirements/traceability-matrix.json` | draft, needs_revision | Разделить traceability по двум режимам | pending |
| `docs/process/cascading-governance/runs/2026-07-02-co-2026-001-q3-priority-impact/` | historical blocked evidence | Не переписывать; оставить историческим evidence | not_required |

## Текущий Блокер

Смысловые правки `EDIT-003..EDIT-008` ожидают принятия Product Owner.

До принятия они не должны попадать в рабочие документы как примененные изменения.
