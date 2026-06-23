# ADR-025: Operational Readiness Gate

Дата: 2026-06-22
Статус: accepted

## Контекст

План DataCanvas требует Operational Readiness Gate: трассы, метрики, runbook, failure modes, rollback/disable path, cost/latency impact и smoke/synthetic check. Checklist существовал, но не был связан с runbook, manifest и автоматической проверкой.

## Решение

Добавить `docs/architecture/observability/operational-readiness-manifest.json`, `docs/architecture/observability/runbook.md` и validation gate `scripts/validate-operational-readiness.mjs`.

`npm run validate:ops-readiness` проверяет schema manifest, наличие checklist/runbook/evidence paths и обязательные operational readiness условия.

## Последствия

- Operational readiness становится проверяемым gate, а не только текстовой рекомендацией.
- Каждый следующий инкремент может ссылаться на один manifest и один runbook.
- Production runtime runbook еще не создается; текущий runbook покрывает pre-MVP и artifact-first режим.
