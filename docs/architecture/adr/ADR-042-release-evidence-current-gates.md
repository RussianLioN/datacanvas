# ADR-042: Release Evidence Current Gates

Дата: 2026-06-22
Статус: accepted

## Контекст

G9 release evidence pack был создан как pre-commit candidate и после этого процесс получил новые обязательные проверки: interactive review runtime, renderer regression, data leakage gate и automatic process metrics snapshot. Если release pack не требует эти checks, команда может получить зеленый release evidence на устаревшем наборе gates.

## Решение

Расширить `docs/release/mvp-release-evidence-pack.json` и `scripts/validate-release-evidence-pack.mjs`.

Release pack теперь обязан содержать evidence для:

- `npm run validate:review-runtime-interactive`;
- `npm run validate:renderer-regression`;
- `npm run validate:data-leakage`;
- `npm run validate:process-metrics-snapshot`;
- runtime, renderer, leakage и metrics artifact paths.

Старый risk id `no-interactive-review-ui` запрещен validator как устаревший. Реальный риск теперь формулируется точнее: нет real user runtime session.

## Последствия

Release candidate не может пройти локальный gate, если он отстал от текущего процесса. Это не закрывает real UAT и pilot gate, а только делает release evidence актуальным перед внешней приемкой.

## Валидация

- `npm run validate:release-pack`
- `npm run validate:bootstrap`
- `npm test`
