# PROC-007: Controlled External LLM Provider

ID: `PROC-007`
Статус: draft
Автор: Codex
Дата: 2026-06-22
Целевая версия процесса: 0.2.0

## Проблема

DataCanvas должен в будущем подключить внешний LLM provider, но текущее правило no-network-by-default запрещает сетевые вызовы в стандартном контуре.

## Причина Изменения

Внешний provider меняет trust boundaries, стоимость, latency, observability, failure modes и требования к секретам. Его нельзя включать как обычную техническую правку.

## Предлагаемое Изменение

Ввести controlled provider integration gate:

- provider должен быть в `docs/architecture/llm/provider-allowlist.yaml`;
- статус provider по умолчанию `disabled`;
- перед включением нужен accepted ADR и security review;
- должен быть cost/latency budget;
- должен быть offline fallback через `scripts/llm-mock-adapter.mjs`;
- должен быть trace coverage для `model_call`;
- секреты не хранятся в репозитории и не печатаются в logs.

## Влияние

- Затронутые роли: Process Owner, Security/Privacy Lead, SRE/LLM Ops Lead, QA/Evals Lead, Product Owner.
- Затронутые артефакты: tool allowlist, provider allowlist, trace contract, eval pack, CI gates, sprint evidence.
- Затронутые спринты: Sprint 8 и будущий спринт фактического подключения provider.
- Риск для текущего Sprint Goal: низкий, потому что provider не включается.
- Влияние на CI/evidence: добавляется `npm run validate:provider`.

## Метрика Успеха

До фактического подключения provider команда имеет 100% обязательных readiness артефактов: allowlist, budget, trace requirements, fallback, stop rules и проверку `validate:provider`.

## План Проверки

Проверить:

```bash
npm run validate:provider
npm test
```

## Rollback

Удалить provider readiness gate из `npm test`, оставить no-network-by-default и mock adapter как единственный AI boundary.

## Решение

Статус решения: draft.
Дата решения: не принято.
Решающий владелец: Process Owner.
