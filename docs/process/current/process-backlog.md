# Process Backlog

Источник: `docs/plans/datacanvas-adaptive-scrum-implementation-plan.md`
Статус: active

## Done

| ID | Название | Цель | Тип | Приоритет | Статус | Evidence | Проверка |
|---|---|---|---|---:|---|---|---|
| PROC-001 | Принять процесс `0.1.0` | Зафиксировать управляемый стартовый процесс | governance | 1 | done | `docs/process/current/process-change-ledger.json` | `npm run validate:process-change-ledger` |
| PROC-006 | Подключить bootstrap validator | Сделать базовый delivery gate исполняемым | automation | 1 | done | `scripts/validate-bootstrap-artifacts.sh` | `npm run validate:bootstrap` |
| PROC-039 | Интегрировать методику разработки проектной документации | Встроить методику по итогам исследования до возобновления интервью по требованиям и переоприоритезации | governance | 1 | done | `docs/process/methodology/project-documentation-methodology.md` | `npm run validate:documentation-methodology` |
| PROC-040 | Довести BABOK methodology MVA до минимально полного контура | Добавить policy, source index, traceability model, coverage map, templates, fixtures, navigation и diagnostics без изменения бизнес-содержания требований | governance | 1 | done | `docs/process/methodology/README.md` | `npm run validate:documentation-methodology` |
| PROC-046 | Внедрить контракт сохранения PO-опросника | Сохранять состояние, журнал и точку продолжения после каждого ответа Product Owner | governance | 1 | done | `docs/product/change-orders/product-change-questionnaire-protocol.md` | `npm run validate:co-questionnaire` |
| PROC-047 | Завершить PO-опросник `CO-2026-001` — изменение приоритета запуска DataCanvas другим агентом | Закрыть сверку Vision и связанных продуктовых артефактов после сохранённой остановки с Продукта 21 | governance | 1 | done | `docs/product/change-orders/co-2026-001-acceptance-questionnaire-log.md` | `npm run validate:co-questionnaire` |

## Ready

| ID | Название | Цель | Тип | Приоритет | Статус | Evidence | Проверка |
|---|---|---|---|---:|---|---|---|
| PROC-002 | Назначить владельцев ролей | Убрать временную неопределенность ответственности | governance | 2 | ready | - | - |
| PROC-003 | Проверить недельный cadence | Подтвердить или скорректировать длину спринта | experiment | 3 | ready | - | - |
| PROC-041 | Развернуть SA artifact pack в проектных SRS artifacts | Применить `system-context`, `use-case/spec`, `domain-data-model`, `interface-contract`, `nfr-profile`, `error-catalog` и `acceptance-verification-map` к новым или изменяемым SRS | governance | 2 | ready | `docs/process/methodology/templates/srs-template.md` | `npm run validate:documentation-methodology` |
| PROC-042 | Подготовить traceability validator and coverage report | Расширить проектные traceability checks до coverage report по требованиям, backlog, acceptance, evidence и orphan links | automation | 2 | ready | `docs/process/methodology/traceability-model.json` | `npm run validate:documentation-methodology` |
| PROC-043 | Внедрить architecture handoff rules | Связать system requirements с ADR impact, contract artifacts, NFR verification и error behavior acceptance | governance | 2 | ready | `docs/process/methodology/documentation-methodology-policy.json` | `npm run validate:documentation-methodology` |

## Draft

| ID | Название | Цель | Тип | Приоритет | Статус | Evidence | Проверка |
|---|---|---|---|---:|---|---|---|
| PROC-004 | Автоматизировать проверку sprint evidence | Снизить ручную ошибку в Review gate | automation | 4 | draft | - | - |
| PROC-005 | Формализовать переносимость процесса | Подготовить шаблоны для других ИТ-проектов | portability | 5 | draft | - | - |
| PROC-007 | Controlled external LLM provider | Подготовить управляемое подключение внешнего LLM без нарушения no-network-by-default | governance | 2 | draft | - | - |
| PROC-044 | Выровнять legacy artifacts по BABOK coverage report | Провести отдельную миграцию существующих product/process/architecture artifacts без подмены проектного смысла методикой | governance | 3 | draft | `docs/process/methodology/babok-coverage-map.json` | `npm run validate:documentation-methodology` |
| PROC-045 | Включить strict validation rollout | Перевести strict checks с methodology artifacts на новые и существенно измененные product/process artifacts после advisory phase | automation | 3 | draft | `docs/process/methodology/documentation-methodology-policy.json` | `npm run validate:documentation-methodology` |
| PROC-048 | Закрепить обязательное CLI-friendly форматирование таблиц | Использовать установленный навык `cli-table-output` и обновить проектные инструкции DataCanvas: табличные данные в чате, опросниках, планах и отчетах выводить через этот навык или его правила компактного CLI-friendly представления | governance | 2 | draft | `$CODEX_HOME/skills/cli-table-output/SKILL.md`; `docs/process/audits/codex-cli-table-output-process-audit.md` | ручная проверка в Codex CLI |

## Правило Приоритизации

Сначала выполняются изменения, которые уменьшают риск хаоса процесса, повышают воспроизводимость или закрывают блокирующие evidence gaps.
