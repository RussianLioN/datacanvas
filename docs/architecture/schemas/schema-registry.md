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

Breaking change любой схемы требует ADR или Process Change Request и migration note.

## Проверка

Bootstrap-проверка выполняется командой `scripts/validate-bootstrap-artifacts.sh`. JSON Schema validation выполняется командой `npm run validate:schemas`.
