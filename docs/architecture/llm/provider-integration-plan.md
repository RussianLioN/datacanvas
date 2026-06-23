# Controlled External LLM Provider Integration Plan

Статус: draft  
Версия процесса: 0.1.0  
Владелец: SRE/LLM Ops Lead

## Цель

Подготовить управляемое подключение внешнего LLM provider без нарушения текущего no-network-by-default режима.

## Принципы

- Внешний provider выключен по умолчанию.
- Default local path остается `scripts/llm-mock-adapter.mjs`.
- Любой сетевой вызов требует accepted `PROC-007`, ADR и security review.
- Provider не получает raw traces, secrets или upstream instructions.
- `PresentationSpec` остается единственным выходом AI boundary.
- Renderer не принимает невалидированный LLM output.

## Этапы Подключения

1. Readiness: создать allowlist, budgets, trace requirements и offline fallback.
2. Security review: проверить data classes, secrets, logging и stop rules.
3. Eval review: подтвердить `npm run validate:evals` и добавить provider-specific cases.
4. Controlled experiment: включить provider только в отдельном эксперименте на 1-2 спринта.
5. Decision: accept, extend, rollback или reject.

## Stop Rules

- Provider требует секрет в репозитории.
- Provider не поддерживает structured output boundary.
- Нет offline fallback.
- Нет cost/latency budget.
- Нет trace evidence для `model_call`.
- Provider output содержит claim без `FACT-*`.

## Offline Fallback

Fallback path:

```bash
npm run generate:golden
```

Если внешний provider недоступен или нарушает contract, pipeline возвращается к `scripts/llm-mock-adapter.mjs`.

## Machine-Readable Artifacts

- Канонический allowlist: `docs/architecture/llm/provider-allowlist.json`.
- Человекочитаемая копия: `docs/architecture/llm/provider-allowlist.yaml`.
- Budget: `docs/architecture/llm/provider-budget.json`.
- Schemas: `schemas/provider-allowlist.schema.json`, `schemas/provider-budget.schema.json`.

`provider-allowlist.json` является источником для automated readiness gates.
