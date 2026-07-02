# Schema Registry

Статус: draft

| Схема | Назначение | Статус |
|---|---|---|
| InputPackageSchema | Входной пакет от другого агента | draft: `schemas/input-package.schema.json` |
| SourceRegistry | Реестр источников | planned |
| FactLedger | Реестр атомарных фактов | planned |
| NormalizedDataSchema | Нормализованные данные | draft: `schemas/normalized-data.schema.json` |
| BriefSchema | Краткое задание на презентацию | planned |
| PresentationSpec | Контракт презентации | draft: `schemas/presentation-spec.schema.json` |
| RenderRequest | Запрос рендера | planned |
| RenderResult | Результат рендера | draft: `schemas/render-result.schema.json` |
| LLMRequest | Контракт будущего LLM-вызова | draft: `schemas/llm-request.schema.json` |
| LLMResult | Контракт результата LLM-вызова | draft: `schemas/llm-result.schema.json` |
| EvalCase | Eval/test сценарий | planned |
| TraceManifest | Трассировка запуска | draft: `schemas/trace-manifest.schema.json` |
| ClaimMap | Связь claims со слайдами и FACT IDs | draft: `schemas/claim-map.schema.json` |
| EvalCaseSet | Набор eval cases | draft: `schemas/eval-case.schema.json` |
| SprintEvidenceManifest | Evidence спринта | draft: `schemas/sprint-evidence-manifest.schema.json` |
| ArtifactRegistry | Реестр артефактов | draft: `schemas/artifact-registry.schema.json` |
| DocsNavigationSource | Источник истины для маршрутов, visibility и indexing rules | active: `schemas/docs-navigation-source.schema.json` |
| DocsNavigationIndex | Generated индекс документации и reachability metadata | generated: `schemas/docs-navigation-index.schema.json` |
| DocumentationChangeRequest | Обязательный вход значимой правки проектной документации | draft: `schemas/documentation-change-request.schema.json` |
| ArtifactDependencyGraph | Machine-readable dependency graph проектных артефактов | draft: `schemas/artifact-dependency-graph.schema.json` |
| ImpactAnalysisReport | Отчет влияния change request на downstream artifacts | draft: `schemas/impact-analysis-report.schema.json` |
| UserDecisionQueue | Очередь пользовательских решений, блокирующих Done | draft: `schemas/user-decision-queue.schema.json` |
| CapacityPlan | Источник квартальной емкости и ресурсных ограничений | draft: `schemas/capacity-plan.schema.json` |
| ReprioritizationImpactReport | Расчет влияния backlog reprioritization на capacity | draft: `schemas/reprioritization-impact-report.schema.json` |
| CascadingUpdateRun | Evidence одного cascade run | draft: `schemas/cascading-update-run.schema.json` |
| JiraFieldMappingRequest | Per-package запрос согласования Jira custom fields | draft: `schemas/jira-field-mapping-request.schema.json` |
| JiraImportPackageManifest | Manifest Jira import package readiness | draft: `schemas/jira-import-package-manifest.schema.json` |

Breaking change любой схемы требует ADR или Process Change Request и migration note.

## Проверка

Bootstrap-проверка выполняется командой `scripts/validate-bootstrap-artifacts.sh`. JSON Schema validation выполняется командой `npm run validate:schemas`.
