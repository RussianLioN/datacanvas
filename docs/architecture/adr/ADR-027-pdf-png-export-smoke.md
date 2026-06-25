# ADR-027: PDF/PNG Export Smoke Fixture

Дата: 2026-06-22
Статус: accepted

## Контекст

План DataCanvas требует visual acceptance и HTML/PDF/PNG export. HTML baseline уже генерируется и проходит sanitization/visual gates, но PDF/PNG export пока не имел проверяемого smoke fixture.

## Решение

Добавить deterministic smoke artifacts `artifacts/examples/presentation-smoke.pdf` и `artifacts/examples/presentation-smoke.png`, генерируемые из текущего HTML baseline через `scripts/generate-export-smoke-fixtures.mjs`.

`scripts/validate-export-smoke.mjs` проверяет manifest schema, наличие PDF/PNG, SHA-256 и файловые сигнатуры.

## Последствия

- MVP Gate получает проверяемый PDF/PNG export smoke без выбора тяжелого browser toolchain.
- Smoke fixture не заменяет полноценный PDF/PNG renderer.
- Полный screenshot/PDF regression остается отдельным будущим increment.
