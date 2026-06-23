# Risk Matrix

Статус: generated
Версия процесса: 0.1.0
Источник: `docs/architecture/risks/risk-registry.json`, `docs/architecture/risks/risk-traceability.json`, `docs/product/requirements/traceability-matrix.json`

| Risk | Severity | Owner | NFR | Eval | Evidence | Mitigation |
|---|---|---|---|---|---|---|
| `unsupported_claims` Provider output содержит claim без подтверждения в NormalizedData | critical | QA/Evals Lead | `NFR-001` | `EVAL-101` | `tests/provider/provider-experiment-result-rollback.json`<br>`docs/product/requirements/traceability-matrix.json` | Блокировать output через fact traceability и provider eval scorer. |
| `prompt_injection_or_secret_leak` Provider output содержит upstream instructions, raw traces или секреты | critical | Security/Privacy Lead | `NFR-003` | `EVAL-102` | `tests/provider/provider-experiment-result-security-rollback.json`<br>`docs/product/requirements/non-functional-requirements.md` | Проверять forbidden strings, export sanitization и no-network-by-default boundaries. |
| `latency_budget_exceeded` Provider p95 latency превышает budget | medium | SRE/LLM Ops Lead | `NFR-004` | `EVAL-103` | `tests/provider/provider-experiment-result-latency-rollback.json`<br>`docs/architecture/llm/provider-budget.json` | Останавливать controlled experiment или откатывать на offline fallback. |
| `cost_budget_exceeded` Provider cost per run превышает budget | medium | Product Owner | `NFR-004` | `EVAL-104` | `tests/provider/provider-experiment-result-cost-rollback.json`<br>`docs/architecture/llm/provider-budget.json` | Ограничивать retries, scope и provider usage до пересмотра budget. |
| `provider_unreliability` Provider failure rate превышает budget | high | SRE/LLM Ops Lead | `NFR-004` | `EVAL-105` | `tests/provider/provider-experiment-result-failure-rollback.json`<br>`docs/architecture/llm/provider-budget.json` | Использовать offline fallback и не принимать provider без стабильности. |

## Проверка

```bash
npm run validate:risk-matrix
```

## Ограничения

- Отчёт генерируется из локальных артефактов и не подтверждает качество реального внешнего provider.
- Риски и связи требуют review команды перед принятием process version выше `0.1.0`.
