# ADR-048: Real UAT Session Importer

Дата: 2026-06-22
Статус: accepted

## Контекст

Real UAT runtime import gate проверяет готовность и может валидировать exported runtime state. Для управляемого процесса нужен отдельный explicit importer, который создает `human-review-session-real.json` только после настоящей UAT-сессии и не смешивает readiness validation с записью артефакта.

## Решение

Добавить:

- `docs/product/ux/real-uat-session-importer.json`
- `docs/product/ux/real-uat-session-importer.md`
- `schemas/real-uat-session-importer.schema.json`
- `scripts/prepare-real-uat-session.mjs`
- `scripts/validate-real-uat-session-importer.mjs`

Без `--input` importer выполняет только readiness validation. С `--input` он создает session artifact только из `recorded_real_user` runtime export.

## Последствия

Процесс перехода от real runtime export к `human-review-session-real.json` становится воспроизводимым. G9 все равно остается pending до фактического exported runtime state.

## Валидация

- `npm run validate:real-uat-session-importer`
- `npm test`
