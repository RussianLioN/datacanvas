# ADR-026: Human Review And UAT Gate

Дата: 2026-06-22
Статус: accepted

## Контекст

План DataCanvas требует MVP flow с human review и UAT script. До этого были renderer, traceability, evals и export checks, но не было формализованного human-in-the-loop skeleton, UAT сценариев и gate для `G9 MVP Accepted`.

## Решение

Добавить `docs/product/ux/human-review-flow.md`, `docs/product/ux/human-review-flow.json`, `docs/product/ux/uat-script.md`, `docs/product/ux/uat-manifest.json` и validation gate `scripts/validate-uat-human-review.mjs`.

`npm run validate:uat-human-review` проверяет роли, состояния, действия, сценарии UAT и правило: export разрешен только из состояния `approved`.

## Последствия

- MVP Gate получает проверяемый skeleton human review flow.
- UAT pack становится частью CI и `npm test`.
- Интерактивный UI и полноценный PDF/PNG export остаются отдельными следующими increments.
