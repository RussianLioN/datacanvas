# Process Backlog

Источник: `docs/plans/datacanvas-adaptive-scrum-implementation-plan.md`
Статус: active

## Done

| ID | Название | Цель | Тип | Приоритет | Статус | Evidence | Проверка |
|---|---|---|---|---:|---|---|---|
| PROC-001 | Принять процесс `0.1.0` | Зафиксировать управляемый стартовый процесс | governance | 1 | done | `docs/process/current/process-change-ledger.json` | `npm run validate:process-change-ledger` |
| PROC-006 | Подключить bootstrap validator | Сделать базовый delivery gate исполняемым | automation | 1 | done | `scripts/validate-bootstrap-artifacts.sh` | `npm run validate:bootstrap` |
| PROC-039 | Интегрировать методику разработки проектной документации | Встроить методику по итогам исследования до возобновления интервью по требованиям и переоприоритезации | governance | 1 | done | `docs/process/methodology/project-documentation-methodology.md` | `npm run validate:documentation-methodology` |

## Ready

| ID | Название | Цель | Тип | Приоритет | Статус | Evidence | Проверка |
|---|---|---|---|---:|---|---|---|
| PROC-002 | Назначить владельцев ролей | Убрать временную неопределенность ответственности | governance | 2 | ready | - | - |
| PROC-003 | Проверить недельный cadence | Подтвердить или скорректировать длину спринта | experiment | 3 | ready | - | - |

## Draft

| ID | Название | Цель | Тип | Приоритет | Статус | Evidence | Проверка |
|---|---|---|---|---:|---|---|---|
| PROC-004 | Автоматизировать проверку sprint evidence | Снизить ручную ошибку в Review gate | automation | 4 | draft | - | - |
| PROC-005 | Формализовать переносимость процесса | Подготовить шаблоны для других ИТ-проектов | portability | 5 | draft | - | - |
| PROC-007 | Controlled external LLM provider | Подготовить управляемое подключение внешнего LLM без нарушения no-network-by-default | governance | 2 | draft | - | - |

## Правило Приоритизации

Сначала выполняются изменения, которые уменьшают риск хаоса процесса, повышают воспроизводимость или закрывают блокирующие evidence gaps.
