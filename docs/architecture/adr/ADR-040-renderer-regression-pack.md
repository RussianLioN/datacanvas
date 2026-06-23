# ADR-040: Renderer Regression Pack

Дата: 2026-06-22
Статус: accepted

## Контекст

В DataCanvas уже есть HTML baseline и PDF/PNG smoke outputs. Но для UX/prototype track нужен отдельный regression pack, который связывает HTML, PDF, PNG, source spec, render result, export smoke и обязательные gates в один проверяемый артефакт.

## Решение

Добавить generated `artifacts/examples/renderer-regression-manifest.json`, схему и validator:

- `schemas/renderer-regression-manifest.schema.json`;
- `scripts/generate-renderer-regression-manifest.mjs`;
- `scripts/validate-renderer-regression.mjs`.

Regression pack проверяет HTML trace markers, PDF/PNG signatures, hashes, minimum byte sizes и связь с export smoke manifest.

## Последствия

Renderer quality gate становится более явным, чем одиночный smoke check. Полноценный browser/PDF renderer regression для всех layouts остается следующим этапом после real UAT и расширения renderer engine.

## Валидация

- `npm run validate:renderer-regression`
- `npm run validate:export-smoke`
- `npm run validate:visual`
- `npm test`
