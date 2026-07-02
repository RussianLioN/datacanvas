# ADR-065: Cascading Documentation Governance

## Статус

Принято как подготовительный архитектурный контракт.

Это решение разрешает схемы, evidence artifacts, runner и validators для draft `PROC-038`, но не принимает сам process rule и не делает cascade gate обязательным для процесса `0.1.0`.

## Контекст

DataCanvas уже разделяет business-first источники, технические контракты, generated navigation и evidence. При этом правка верхнеуровневого продукта или backlog может затронуть BMC, stories, requirements, roadmap, capacity, sprint artifacts, release evidence и Jira import package.

Без явного dependency graph и decision queue агент может закрыть локальную правку, оставив downstream документы несогласованными или подставив неподтвержденные capacity, сроки, приоритеты и Jira mapping.

## Решение

Ввести контракт каскадного ведения документации:

- `DocumentationChangeRequest` является обязательным входом для значимых правок проектной документации.
- `artifact-dependency-graph.json` фиксирует upstream/downstream связи, update rules, owners, validation commands и условия пользовательского подтверждения.
- `ImpactAnalysisReport` описывает affected artifacts, тип влияния, required/optional edits, blocking decisions, derived facts, forbidden assumptions и validation plan.
- `UserDecisionQueue` блокирует Done при открытых blocking decisions.
- `CapacityPlan` и `ReprioritizationImpactReport` отделяют расчет влияния от пользовательского решения о trade-off.
- `JiraFieldMappingRequest` и `JiraImportPackageManifest` запрещают считать Jira package готовым без approved mapping или явного `pending_external`.
- `CascadingUpdateRun` хранит evidence: change request, impact analysis, decision queue, changed artifacts, no-change rationales, generated artifacts и validation results.

Runner и validators не применяют semantic edits со статусом `requires_user_confirmation`. Generated navigation и hash artifacts обновляются только штатными генераторами.

## Последствия

Положительные:

- upstream правки Vision, BMC, stories, requirements и backlog получают проверяемую cascade-трассировку;
- Done нельзя заявить при незакрытых пользовательских решениях;
- capacity overrun и missing capacity становятся явными blocking states;
- Jira custom fields согласуются per package, а не угадываются глобально;
- artifact registry/hash и navigation остаются воспроизводимыми.

Ограничения:

- контракт не заменяет продуктовые решения Product Owner;
- конкретные capacity, сроки, приоритеты, scope, регламенты и Jira mapping остаются внешним вводом;
- универсальное автоматическое применение semantic edits не вводится без отдельного подтвержденного решения и trust boundary review.
