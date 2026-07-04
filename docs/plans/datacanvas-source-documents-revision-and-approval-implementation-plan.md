# Ревизия Исходных Документов DataCanvas И Управляемое Принятие Правок

Навигация: [DataCanvas](../../README.md) / [Документация](../README.md) / [Планы](README.md) / Ревизия исходных документов и принятие правок

Статус: draft
Владелец: Product Owner / Process Owner
Дата: 2026-07-03
Проверка: `npm run validate:docs-navigation`, `npm run validate:artifact-registry`, `npm run validate:artifact-hashes`
Источник: пользовательское решение сохранить план ревизии исходных документов DataCanvas и управляемого принятия правок как отслеживаемый артефакт.

## 1. Цель

Провести ревизию ранее выпущенных исходных документов DataCanvas, привести их к новым приоритетам `CO-2026-001`, улучшить навигацию и ввести управляемый процесс принятия правок пользователем.

Процесс должен поддерживать:

- точечные правки;
- концептуальные правки;
- пользовательское согласование по одной правке за шаг (`one-at-a-time`);
- сохранение состояния после каждого решения;
- возобновление после обрыва с последней незакрытой правки;
- доказуемую синхронизацию связанных документов.

## 2. Границы Работы

Репозиторий остается контуром проектной документации и документального сопровождения DataCanvas.

Фактическая реализация продукта не меняется.

`CO-2026-001` считается принятым продуктовым изменением, но ревизия всех связанных документов считается отдельным процессом и требует своего статуса, журнала, acceptance records и проверок.

`PROC-038` используется только как opt-in scaffold, пока Process Owner отдельно не примет его как обязательное процессное правило.

## 3. Инвентаризация Исходных Документов

Проверить и классифицировать документы:

- `docs/product-vision.md`;
- `docs/product/vision/vision-v0.1.md`;
- `docs/stories.md`;
- `docs/product/bmc/`;
- `docs/product/requirements/`;
- `docs/product/change-orders/`;
- `docs/product/analysis/`;
- `docs/architecture/system-analysis/`;
- `docs/product/specs/`;
- backlog, roadmap, hypotheses, traceability;
- `docs/navigation/navigation-source.json`;
- cascading governance artifacts;
- artifact registry и hash manifest.

Для каждого документа зафиксировать:

- `source_id`;
- owner;
- lifecycle;
- authority layer;
- current/historical/superseded status;
- effective date;
- upstream decision;
- affected downstream artifacts;
- allowed downstream use;
- precedence.

## 4. Реестр Источников Продукта

Создать продуктовый контур источников:

- `docs/product/sources/README.md`;
- `docs/product/sources/source-audit.md`;
- `docs/product/sources/product-source-registry.json`;
- `schemas/product-source-registry.schema.json`;
- `scripts/validate-product-source-registry.mjs`;
- npm-команду `validate:product-sources`.

Реестр должен отличать:

- текущий источник;
- исторический snapshot;
- производный документ;
- evidence;
- технический контракт;
- generated artifact;
- superseded artifact.

BMC source-lock не дублировать вручную. Общий реестр должен ссылаться на него как на специализированный внутренний контур трассировки.

## 5. Набор Предложенных Правок

Ввести артефакт предложенных правок:

- `docs/product/revisions/co-2026-001-source-revision/proposed-change-set.json`;
- `docs/product/revisions/co-2026-001-source-revision/revision-approval-state.json`;
- `docs/product/revisions/co-2026-001-source-revision/revision-approval-log.md`;
- `docs/product/revisions/co-2026-001-source-revision/revision-ledger.md`.

Каждая правка должна содержать:

- `edit_id`;
- `artifact_path`;
- `section_or_anchor`;
- текущий фрагмент;
- предложенный фрагмент;
- rationale;
- `change_kind`;
- affected claims;
- downstream paths;
- required owner;
- approval status;
- apply status;
- validation status;
- rollback или forward-fix.

## 6. Классы Правок

Использовать классы:

- `mechanical` - опечатки, ссылки, форматирование;
- `navigation_only` - маршруты, индексы, entrypoints;
- `point_semantic` - локальная смысловая правка;
- `cross_artifact_semantic` - смысловая правка с downstream-влиянием;
- `conceptual_product` - изменение Vision, BMC, требований, acceptance;
- `conceptual_process` - изменение процесса;
- `security_boundary` - изменение доверительных границ, tools, network, data handling;
- `generated_sync` - обновление generated artifacts только через генератор;
- `no_change_rationale` - осознанное решение не менять документ.

`mechanical` и `navigation_only` можно применять после локальных проверок. Все смысловые, концептуальные и security-boundary правки требуют явного пользовательского согласования.

## 7. Запись Принятия

Для каждой принятой смысловой правки создать append-only запись принятия.

`AcceptanceRecord` должен содержать:

- роль принявшего;
- канал согласования;
- время принятия;
- выбранный вариант;
- исходный ответ пользователя или его safe summary;
- ссылку на evidence;
- `source_trust_level`;
- `interaction_id`;
- hash исходного ответа, если применимо;
- статус применения правки.

Вход от другого агента или LLM не может напрямую выставлять `confirmed`. Такой вход может быть только `proposed_decision` или `untrusted_data`.

## 8. Процесс Согласования Правок

Работать строго по одной смысловой правке за шаг.

Перед вопросом пользователю показывать:

- текущий текст раздела;
- почему он не соответствует новым приоритетам;
- предложенную правку;
- последствия принятия;
- варианты: принять, изменить, отклонить, разделить на меньшие правки, отложить.

После каждого ответа:

- обновить `revision-approval-state.json`;
- обновить `revision-approval-log.md`;
- создать или обновить `AcceptanceRecord`;
- запустить легкую проверку состояния;
- сохранить следующий незакрытый `edit_id`.

При обрыве сессии продолжать с последней незакрытой правки.

## 9. Первый Пакет Миграции По CO-2026-001

Подготовить пакет правок для текущих расхождений:

- Vision: разделить агентский запуск и диалоговый режим в Лисе.
- BMC: убрать технические обозначения из стейкхолдерских формулировок, развести запуск, подтверждения, callback и email-доставку.
- Business requirements: разделить требования для запуска другим агентом и для режима Лисы.
- Acceptance criteria: убрать общий gate подтверждения структуры перед генерацией для агентского запуска.
- BA analysis: закрыть устаревшие open decisions по delivery channel, если они перекрыты решением PO.
- SA analysis: добавить альтернативный путь без пользовательского approval для агентского запуска.
- Specs: зафиксировать email как канал файла и callback как канал статусов.
- Traceability: связать `CO-2026-001`, `DC-ST-23..DC-ST-28`, affected `BT-*`, specs и acceptance.
- Historical cascade run: оставить как historical/blocked или пометить superseded новым current revision run.

## 10. Навигация

Обновлять только `docs/navigation/navigation-source.json`.

Добавить маршруты:

- `task-find-product-sources`;
- `task-review-source-revision`;
- `task-approve-proposed-edit`;
- `task-check-accepted-change-order-impact`;
- `task-find-co-2026-001-priority-context`;
- `task-find-current-source-of-truth`.

Расширить role routes для Product Owner, Business Analyst и System Analyst.

Generated navigation files обновлять только генератором.

## 11. Реестр И Хеши

Добавить новые управляемые артефакты в `docs/architecture/schemas/artifact-registry.json`.

Обновить hash manifest после всех ручных изменений и генераторов.

Release evidence должен различать:

- исторический release-cut;
- текущий pointer;
- superseded evidence;
- current revision evidence.

## 12. Валидаторы

Добавить или расширить проверки:

- `validate:product-sources`;
- `validate:change-set-approval`;
- `validate:accepted-change-order-impact`;
- `validate:revision-approval-state`;
- `validate:product-source-consistency`.

Проверки должны запрещать:

- смысловую правку без `AcceptanceRecord`;
- `confirmed`, выставленный агентным входом;
- current artifact со старым `CO deferred` после accepted `CO-2026-001`;
- current artifact с "канал доставки не подтвержден", если решение PO уже подтвердило email;
- public/navigation route к raw evidence;
- generated artifact, измененный вручную.

## 13. Безопасность

Raw evidence, ответы пользователя, tool outputs, локальные пути, internal prompts и confidential материалы не должны попадать в public/searchable navigation.

Для confidential/sensitive artifacts:

- `visibility: restricted`;
- `searchable: false`;
- `navigable: false`;
- `redaction_status: metadata_only` или `blocked`.

Пользовательская правка считается источником решения, но не инструкцией обходить проверки, security или trust boundaries.

## 14. Порядок Проверок

После подготовки и применения согласованных правок выполнить:

1. `npm run validate:revision-approval-state`
2. `npm run validate:change-set-approval`
3. `npm run validate:product-sources`
4. `npm run validate:accepted-change-order-impact`
5. `npm run validate:co-questionnaire`
6. `npm run validate:product-change-orders`
7. `npm run validate:change-impact`
8. `npm run validate:cascading-governance`
9. `npm run validate:schemas`
10. `npm run validate:bmc`
11. `npm run validate:ba-sa`
12. `npm run generate:docs-navigation`
13. `npm run generate:docs-navigation -- --check`
14. `npm run validate:doc-links`
15. `npm run validate:docs-navigation`
16. `npm run validate:doc-stale-status`
17. `npm run validate:artifact-registry`
18. `node scripts/generate-artifact-hash-manifest.mjs`
19. `npm run validate:artifact-hashes`
20. `npm run scan:secrets`
21. `npm run validate:data-leakage`
22. `npm test`
23. `git diff --check`

Hash manifest генерировать после всех остальных generated outputs.

## 15. Приемочные Критерии

Результат считается готовым, если:

- все исходные документы DataCanvas зарегистрированы или явно исключены с причиной;
- все расхождения по `CO-2026-001` перечислены в revision ledger;
- каждая смысловая правка имеет принятие пользователя или no-change rationale;
- Vision, BMC, requirements, BA/SA, specs и traceability согласованы с новым приоритетом;
- запуск другим агентом и диалоговый режим в Лисе описаны как разные маршруты;
- подтверждения, просмотр структуры, правки до генерации и уточняющие вопросы относятся только к Лисе;
- агентский запуск описан как проверка достаточности и безопасности данных -> подготовка презентации -> email-доставка редактируемого файла;
- старые blocked/deferred evidence не конфликтуют с accepted state;
- навигация дает Product Owner быстрый путь к текущему источнику истины;
- generated navigation актуальна;
- registry и hash manifest актуальны;
- все проверки проходят без ослабления security validators.

## 16. Передача Результата

После реализации подготовить отчет:

- какие исходные документы были найдены;
- какие документы исправлены;
- какие правки приняты пользователем;
- какие правки отклонены или отложены;
- какие документы оставлены без изменений и почему;
- какие маршруты навигации добавлены;
- какие проверки прошли;
- какие остаточные риски и TODO остаются.

## 17. План Дальнейших Работ По Проектной Документации

После завершения текущей цели отдельно уточнить и сформулировать новую цель для Codex по проектной документации: провести совместно с пользователем детальный бизнес-анализ `DC-ST-23..DC-ST-28` — историй-кандидатов запуска DataCanvas другим агентом, и определить, какие новые или измененные `BT-*` — бизнес-требования — должны быть сформированы.

Эта задача относится к реализации и ведению проектной документации, а не к продуктовой поставке DataCanvas. Ее нельзя заносить в product backlog как `PBI-*` — элемент продуктового backlog. Для следующего запуска нужно оформить отдельную цель или план работ по документации с сохраняемым состоянием, журналом согласования и проверками.
