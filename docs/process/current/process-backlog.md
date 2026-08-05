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
| PROC-048 | Закрепить обязательное CLI-friendly форматирование таблиц | Использовать установленный навык `cli-table-output` и обновить проектные инструкции DataCanvas: табличные данные в чате, опросниках, планах и отчетах выводить через этот навык или его правила компактного CLI-friendly представления | governance | 2 | done | `docs/process/change-requests/PROC-048-cli-table-output.md`; `docs/process/audits/codex-cli-table-output-process-audit.md` | `npm run validate:universal-documentation-workflow` |
| PROC-062 | Защитить XLSX-источник и историю Git | Удалить локальные пути из активной истории, разделить оригинальный SHA, очищенный источник и рабочую книгу, блокировать проверку не того SHA | security | 1 | done | `docs/process/change-requests/PROC-062-xlsx-source-history-hygiene.md` | `npm run validate:xlsx-source-security`; `npm run validate:git-history-hygiene` |

## В Работе

| ID | Название | Цель | Тип | Приоритет | Статус | Доказательства | Проверка |
|---|---|---|---|---:|---|---|---|
| PROC-064 | Выделить автоматизацию проектной документации в отдельный проект | Создать переносимое ядро для нового и существующего неполного проекта, сохранив DataCanvas пилотом и эталоном видов, связей, форматов и проверок без переноса продуктового содержания | automation | 1 | in_progress | `docs/process/change-requests/PROC-064-project-documentation-automation-extraction.md`; `docs/process/audits/project-documentation-automation-stage-0-consilium.md` | `npm run validate:process-change-ledger`; `npm run validate:docs-navigation` |

## Ready

| ID | Название | Цель | Тип | Приоритет | Статус | Evidence | Проверка |
|---|---|---|---|---:|---|---|---|
| PROC-002 | Назначить владельцев ролей | Убрать временную неопределенность ответственности | governance | 2 | ready | - | - |
| PROC-003 | Проверить недельный cadence | Подтвердить или скорректировать длину спринта | experiment | 3 | ready | - | - |
| PROC-041 | Развернуть SA artifact pack в проектных SRS artifacts | Применить `system-context`, `use-case/spec`, `domain-data-model`, `interface-contract`, `nfr-profile`, `error-catalog` и `acceptance-verification-map` к новым или изменяемым SRS | governance | 2 | ready | `docs/process/methodology/templates/srs-template.md` | `npm run validate:documentation-methodology` |
| PROC-042 | Подготовить traceability validator and coverage report | Расширить проектные traceability checks до coverage report по требованиям, backlog, acceptance, evidence и orphan links | automation | 2 | ready | `docs/process/methodology/traceability-model.json` | `npm run validate:documentation-methodology` |
| PROC-043 | Внедрить architecture handoff rules | Связать system requirements с ADR impact, contract artifacts, NFR verification и error behavior acceptance | governance | 2 | ready | `docs/process/methodology/documentation-methodology-policy.json` | `npm run validate:documentation-methodology` |
| PROC-049 | Блокер: ввести контракт генерации бизнес-артефактов | Перед доработкой валидаторов и повторной генерацией бизнес-документов закрепить машинный контракт генерации для каждого документа из `business-artifact-content-contract.json` | governance | 1 | ready | `docs/process/universal-documentation-workflow/business-artifact-generation-contract.json` | `npm run validate:business-docs` |
| PROC-050 | Блокер: контракт генерации перехода старого каталога историй | Для `docs/stories.md` закрепить только короткий переход к каноническому каталогу без повторения таблицы историй, ПШЕ, provenance и служебных разделов | governance | 1 | ready | `docs/process/universal-documentation-workflow/business-artifact-generation-contract.json` | `npm run validate:business-docs` |
| PROC-051 | Блокер: контракт генерации канонического каталога пользовательских историй | Для `docs/product/requirements/user-stories.md` закрепить генерацию классического каталога пользовательских историй без технических контрактов, runtime-полей и служебной истории обработки | governance | 1 | ready | `docs/process/universal-documentation-workflow/business-artifact-generation-contract.json` | `npm run validate:business-docs` |
| PROC-052 | Блокер: контракт генерации бизнес-требований | Для `docs/product/requirements/business-requirements.md` закрепить генерацию бизнес-требований без служебной трассировки, доказательств проверок и команд как основного текста | governance | 1 | ready | `docs/process/universal-documentation-workflow/business-artifact-generation-contract.json` | `npm run validate:business-docs` |
| PROC-053 | Блокер: контракт генерации критериев приемки | Для `docs/product/requirements/acceptance-criteria.md` закрепить генерацию критериев приемки без журналов генерации, локальных путей и технических evidence-деталей | governance | 1 | ready | `docs/process/universal-documentation-workflow/business-artifact-generation-contract.json` | `npm run validate:business-docs` |
| PROC-054 | Блокер: контракт генерации нефункциональных требований | Для `docs/product/requirements/non-functional-requirements.md` закрепить генерацию нефункциональных требований без команд проверки и истории генерации в человекочитаемом тексте | governance | 1 | ready | `docs/process/universal-documentation-workflow/business-artifact-generation-contract.json` | `npm run validate:business-docs` |
| PROC-055 | Блокер: контракт генерации продуктового backlog | Для `docs/product/backlog/product-backlog.md` закрепить генерацию продуктового backlog без служебных правил генерации и технических деталей реализации как бизнесовых элементов | governance | 1 | ready | `docs/process/universal-documentation-workflow/business-artifact-generation-contract.json` | `npm run validate:business-docs` |
| PROC-056 | Блокер: контракт генерации кандидатных историй Q3 | Для `docs/product/backlog/agent-launch-candidate-stories-2026-q3.md` закрепить генерацию рабочих историй без смешения с локальными источниками, JSON, командами и проверочными следами | governance | 1 | ready | `docs/process/universal-documentation-workflow/business-artifact-generation-contract.json` | `npm run validate:business-docs` |
| PROC-057 | Блокер: контракт генерации CSV кандидатных историй Q3 | Для `docs/product/backlog/agent-launch-candidate-stories-2026-q3.csv` закрепить CSV-форму с теми же смысловыми ограничениями, что и Markdown-документ кандидатных историй | automation | 1 | ready | `docs/process/universal-documentation-workflow/business-artifact-generation-contract.json` | `npm run validate:business-docs` |
| PROC-058 | Блокер: контракт генерации карты импорта в Confluence | Для `docs/product/analysis/documentation-consistency-audit/confluence-import-map.md` закрепить генерацию карты импорта без внутренних служебных деталей, локальных путей и чувствительных evidence-следов | governance | 1 | ready | `docs/process/universal-documentation-workflow/business-artifact-generation-contract.json` | `npm run validate:business-docs` |
| PROC-059 | Блокер: контракт генерации roadmap | Для `docs/product/roadmap/roadmap-v0.1.md` закрепить дорожную карту как план поставки без повторения backlog, пользовательских историй, ПШЕ и технических контрактов | governance | 1 | ready | `docs/process/universal-documentation-workflow/business-artifact-generation-contract.json` | `npm run validate:business-docs` |
| PROC-060 | Блокер: контракт генерации доски гипотез | Для `docs/product/hypotheses/hypothesis-board.md` закрепить только продуктовые гипотезы без process-only экспериментов, служебных заголовков и evidence-журналов | governance | 1 | ready | `docs/process/universal-documentation-workflow/business-artifact-generation-contract.json` | `npm run validate:business-docs` |
| PROC-061 | Блокер: контракт генерации проверки гипотез | Для `docs/product/hypotheses/hypothesis-validation.md` закрепить план проверки без повторения полного текста доски гипотез и без process metrics как продуктовой гипотезы | governance | 1 | ready | `docs/process/universal-documentation-workflow/business-artifact-generation-contract.json` | `npm run validate:business-docs` |

## Draft

| ID | Название | Цель | Тип | Приоритет | Статус | Evidence | Проверка |
|---|---|---|---|---:|---|---|---|
| PROC-004 | Автоматизировать проверку sprint evidence | Снизить ручную ошибку в Review gate | automation | 4 | draft | - | - |
| PROC-005 | Формализовать переносимость процесса | Подготовить шаблоны для других ИТ-проектов | portability | 5 | draft | - | - |
| PROC-007 | Controlled external LLM provider | Подготовить управляемое подключение внешнего LLM без нарушения no-network-by-default | governance | 2 | draft | - | - |
| PROC-044 | Выровнять legacy artifacts по BABOK coverage report | Провести отдельную миграцию существующих product/process/architecture artifacts без подмены проектного смысла методикой | governance | 3 | draft | `docs/process/methodology/babok-coverage-map.json` | `npm run validate:documentation-methodology` |
| PROC-045 | Включить strict validation rollout | Перевести strict checks с methodology artifacts на новые и существенно измененные product/process artifacts после advisory phase | automation | 3 | draft | `docs/process/methodology/documentation-methodology-policy.json` | `npm run validate:documentation-methodology` |

## Правило Приоритизации

Сначала выполняются изменения, которые уменьшают риск хаоса процесса, повышают воспроизводимость или закрывают блокирующие evidence gaps.
