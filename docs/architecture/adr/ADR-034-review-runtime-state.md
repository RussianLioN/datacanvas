# ADR-034: Review Runtime State

## Статус

Accepted

## Контекст

План DataCanvas требует human-in-the-loop review и MVP flow. После review UI fixture оставался gap: UI был статическим, а состояние review не было оформлено как сохраняемый runtime contract.

## Решение

Добавить `docs/product/ux/review-runtime-state-fixture.json`, схему `schemas/review-runtime-state.schema.json`, описание `docs/product/ux/review-runtime-state.md` и валидатор `scripts/validate-review-runtime-state.mjs`.

Валидатор проверяет, что:

- каждый переход существует в `human-review-flow.json`;
- роль события разрешена для перехода;
- export возможен только из `approved`;
- `current_state` совпадает с последним переходом и session artifact.

## Последствия

- Runtime state становится проверяемым контрактом.
- Real user UAT не подменяется fixture-артефактом.
- Следующий UI increment должен сохранять такой state из реального интерактивного runtime.
