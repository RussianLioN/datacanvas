# Operational Readiness Checklist

Инкремент DataCanvas готов к приемке только если выполнены все условия:

- Trace spans определены в `docs/architecture/observability/trace-contract.md` или явно помечены как `n/a` с причиной.
- Метрики качества, стоимости и задержки зафиксированы в process metrics или имеют `n/a` с причиной.
- Failure modes описаны в `docs/architecture/observability/runbook.md`.
- Rollback/disable path определен до включения инкремента.
- Cost/latency impact понятен для LLM, export и render изменений.
- Smoke/synthetic check определен и воспроизводим командой.
- Incident-to-backlog loop не имеет открытых blocking items: инцидент ведет к RCA, backlog item и regression check.
