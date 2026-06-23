# ADR-028: UAT Result Fixture

Дата: 2026-06-22
Статус: accepted

## Контекст

После добавления UAT script и human review skeleton у DataCanvas все еще не было исполняемого UAT result artifact. Это оставляло gap между описанными сценариями и проверяемым результатом MVP Gate.

## Решение

Добавить `docs/product/ux/uat-result-minimal.json`, schema `schemas/uat-result.schema.json` и gate `scripts/validate-uat-result.mjs`.

Validator проверяет, что все сценарии из `uat-manifest.json` присутствуют, прошли, thresholds соблюдены, review завершен, состояние `approved`, решение `accepted`, а evidence paths существуют.

## Последствия

- G9 получает исполняемый UAT result fixture.
- UAT result можно включить в `npm test`, CI, artifact registry и hash governance.
- Реальная пользовательская UAT-сессия и interactive review UI остаются отдельными increments.
