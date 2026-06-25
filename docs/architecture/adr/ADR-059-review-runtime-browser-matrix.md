# ADR-059: Review Runtime Browser Matrix

Дата: 2026-06-22

## Статус

Принято.

## Контекст

UX/prototype coverage фиксирует gap: нет browser matrix для будущих layouts и real UAT. Real UAT еще не проведена, поэтому нельзя создавать acceptance evidence, но можно проверить статическую готовность runtime к mobile/tablet/desktop ручной проверке.

## Решение

Добавить `docs/product/ux/review-runtime-browser-matrix.json`, guide и validator `scripts/validate-review-runtime-browser-matrix.mjs`.

Validator проверяет:

- viewport meta;
- mobile breakpoint;
- responsive layout constraints;
- wrapping controls;
- required real UAT controls;
- mobile/tablet/desktop viewport targets.

## Последствия

Перед real UAT команда имеет проверяемую browser/viewport matrix. Этот gate не заменяет screenshot/browser assertions и не закрывает real UAT evidence.

## Проверки

- `npm run validate:review-runtime-browser-matrix`
- `npm run validate:review-runtime-interactive`
- `npm test`
