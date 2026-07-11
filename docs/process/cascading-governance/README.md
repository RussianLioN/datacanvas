# Каскадное Ведение Документации

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Процесс](../README.md) / Каскадное ведение документации

Статус: draft
Владелец: Process Owner
Проверка: `npm run validate:cascade-impact`, `npm run validate:cascading-governance`, `npm run validate:cascade-verification`, `npm run validate:xlsx-cascade`

## Назначение

Этот каталог хранит подготовительные контракты и evidence для управляемого изменения проектной документации DataCanvas. `PROC-038` имеет статус draft / not_decided, поэтому каталог работает как opt-in проверочная заготовка и не заменяет принятое правило процесса.

## Контракт

- Opt-in проверка значимой правки Vision, BMC, stories, requirements, backlog, capacity, sprint artifacts, roadmap или Jira import package начинается с `DocumentationChangeRequest`.
- Impact analysis строится по `artifact-dependency-graph.json` как полный конус влияния вверх и вниз и не принимает бизнесовые решения за пользователя.
- `user-decision-queue.json` блокирует Done claim внутри opt-in запуска, пока есть blocking decision со статусом `pending` или `deferred`.
- Capacity и reprioritization фиксируются отдельно; конкретная емкость команды не заполняется без пользовательского или внешнего источника.
- Jira custom fields согласуются через отдельный `JiraFieldMappingRequest`; import package не считается готовым без approved mapping или явного `pending_external`.
- Изменение любого главного артефакта требует проверки полного конуса: документы ниже по цепочке проверяются на необходимость обновления, а источники выше по цепочке — на логическое противоречие и необходимость решения владельца.
- XLSX backlog и provenance manifest считаются high-impact upstream: если они изменились, impact analysis обязан закрыть каждый зависимый артефакт обновлением или no-change rationale.
- Циклические связи допустимы только как явно объявленные группы. Внутри группы каждый артефакт разрешается один раз, а измененный корень не включается в собственный список влияния.
- Полный no-change rationale хранится в impact analysis. Business Markdown, product source registry и dependency graph не используются как журналы конкретного запуска.
- Generated navigation и hash artifacts обновляются только генераторами.
- В профиле DataCanvas runner, финализатор и verifier используют только канонический граф `docs/process/cascading-governance/artifact-dependency-graph.json`; Excel-маршрут дополнительно использует только канонический `docs/product/sources/product-source-registry.json`. Альтернативный путь нельзя передать как способ сузить конус или набор исходных файлов.

## Сухой Запуск И Проверка Завершения

Предпросмотр без записи файлов:

```bash
npm run cascade:preview -- --files docs/product/requirements/user-stories.md
```

Сухой запуск создает новый каталог evidence, но не меняет продуктовые документы:

```bash
npm run cascade:run -- --change-request docs/process/cascading-governance/documentation-change-request.json --output-dir docs/process/cascading-governance/runs/<run-id>
```

В пакете сохраняются полный конус влияния, очередь решений, человекочитаемый отчет и baseline-манифест. При создании сухого запуска фиксируются контрольные суммы самого запроса и всех исходных доказательств запуска. Финализация прекращается, если хотя бы один из этих файлов был изменён. После согласованных правок машинный вход разрешений отдельно закрывает каждый измененный корень и каждый элемент конуса: фактическим изменением или, если изменение не требуется, содержательным no-change rationale — обоснованием отсутствия правки.

Исходный generated-пакет вручную не редактируется. Финализатор создает новую закрытую версию impact analysis и очереди решений:

```bash
npm run cascade:finalize -- --run docs/process/cascading-governance/runs/<run-id>/cascading-update-run-<suffix>.json --resolution-input <resolution-json> --output-dir docs/process/cascading-governance/runs/<finalization-id>
```

Отдельная проверка завершения выполняется в новый каталог:

```bash
npm run cascade:verify -- --run docs/process/cascading-governance/runs/<finalization-id>/cascading-update-run-resolved-<suffix>.json --output-dir docs/process/cascading-governance/runs/<verification-id>
```

Финализатор заново рассчитывает конус по активному графу и требует точного покрытия изменённых корней, всех путей конуса и всех решений очереди. Для разных владельцев создаются отдельные решения с уникальными для запуска идентификаторами. Решение владельца должно ссылаться на запись принятия типа `owner_decision_acceptance`, которая находится в активном журнале, имеет статус `accepted` и совпадает по идентификатору и точному пути исходного запуска, запросу на изменение, владельцу, решению и выбранному варианту. Произвольный JSON-файл, историческая запись без этих связей или запись из неактивного журнала не считаются подтверждением.

Финализатор фиксирует хэши исходного запуска, baseline, запроса на изменение, исходных и закрытых отчетов, входа разрешений и использованных журналов принятия. Runner, финализатор и verifier используют одну функцию расчёта обязательных проверок по изменённым корням и полному конусу влияния. Сократить этот список правкой отчёта нельзя: финализатор отклонит пакет, а verifier независимо пересчитает список и не выдаст статус `verified`. Verifier — итоговая проверка — также повторно рассчитывает конус и блокирует завершение при любом расхождении. Если целостность нарушена или осталось незакрытое обязательство, проверочные команды не запускаются. В неизменном контуре выполняются только заранее заданные безопасные `npm run`-команды, которые одновременно присутствуют в проверяемом каталоге команд. Runner — средство сухого запуска — не применяет смысловые правки и не поддерживает `--apply`.

## Исходные Артефакты

- [artifact-dependency-graph.json](artifact-dependency-graph.json)
- [documentation-change-request.json](documentation-change-request.json)
- [impact-analysis-report.json](impact-analysis-report.json)
- [user-decision-queue.json](user-decision-queue.json)
- [capacity-plan-2026-q3.json](capacity-plan-2026-q3.json)
- [reprioritization-impact-report.json](reprioritization-impact-report.json)
- [jira-field-mapping-request.json](jira-field-mapping-request.json)
- [jira-import-package-manifest.json](jira-import-package-manifest.json)
- [runs/2026-07-02-cascade-contract/cascading-update-run.json](runs/2026-07-02-cascade-contract/cascading-update-run.json)
- [runs/2026-07-02-co-2026-001-q3-priority-impact/cascading-update-run-2026-07-02-002.json](runs/2026-07-02-co-2026-001-q3-priority-impact/cascading-update-run-2026-07-02-002.json)

## Проверки

Основной gate:

```bash
npm run validate:cascading-governance
npm run validate:cascade-impact
npm run validate:cascade-verification
```

Профильные gates доступны отдельно: `validate:documentation-change-request`, `validate:artifact-dependency-graph`, `validate:impact-analysis`, `validate:decision-queue`, `validate:capacity-plan`, `validate:reprioritization-impact`, `validate:cascading-update`, `validate:jira-field-mapping` и `validate:xlsx-cascade`.
