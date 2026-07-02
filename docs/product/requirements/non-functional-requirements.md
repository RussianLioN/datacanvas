# Нефункциональные Требования v0.1

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Продукт](../README.md) / [Требования](README.md) / Нефункциональные требования

Статус: draft
Владелец: Product Owner
Проверка: `npm run validate:docs-navigation`

| ID | Категория | Требование | Метрика |
|---|---|---|---|
| NFR-001 | Достоверность | Неподтвержденный claim не попадает в финальную презентацию | unsupported claims count = 0 |
| NFR-002 | Воспроизводимость | Запуск связывает input hash, schema version и output hash | trace completeness |
| NFR-003 | Безопасность | Секреты и PII не попадают в prompt, trace, evidence или export | leakage count = 0 |
| NFR-004 | Производительность | Стоимость и задержка фиксируются для каждого запуска | cost/latency recorded |
| NFR-005 | Визуальное качество | Export не содержит критического overflow | critical visual defects = 0 |

## BA/SA Fit Criteria

| ID | Категория | Fit Criterion | Проверка |
|---|---|---|---|
| NFR-001 | Достоверность | Неподтвержденный interview claim не становится acceptance gate | `npm run validate:ba-spec` |
| NFR-002 | Воспроизводимость | Interview-derived coverage связывает answer, claim, requirement, acceptance, UAT, eval, fixture и gate | `npm run validate:interview-derived-coverage` |
| NFR-003 | Privacy/security | AgentPromptSpec содержит только safe context и `raw_transcript_included=false` | `npm run validate:spec-task-prompt-readiness` |
| NFR-004 | Наблюдаемость | Process run ledger фиксирует `run_id`, command, input paths, output paths, duration, exit code и redacted log hash | `npm run validate:sa-spec` |
| NFR-005 | Совместимость | Interface control содержит schema refs и validation commands для каждого boundary | `npm run validate:interface-contracts` |

## Risk Links

- `NFR-001` связан с risk `unsupported_claims`.
- `NFR-003` связан с risk `prompt_injection_or_secret_leak`.
- `NFR-004` связан с risks `latency_budget_exceeded`, `cost_budget_exceeded`, `provider_unreliability`.
