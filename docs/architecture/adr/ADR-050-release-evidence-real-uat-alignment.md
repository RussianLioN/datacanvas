# ADR-050: Release Evidence Real UAT Alignment

Дата: 2026-06-22
Статус: accepted

## Контекст

Release candidate evidence pack должен отражать текущие gates. После S47-S49 появились real UAT operator handoff, session importer readiness и conditional leakage guard. Без обновления release evidence pack G9 candidate не показывает фактическую готовность к реальному UAT run.

## Решение

Обновить `docs/release/mvp-release-evidence-pack.json` и `scripts/validate-release-evidence-pack.mjs`, чтобы release candidate ссылался на:

- `docs/product/ux/real-uat-runtime-import.json`
- `docs/product/ux/real-uat-operator-handoff.json`
- `docs/product/ux/real-uat-session-importer.json`
- `docs/architecture/security/real-uat-leakage-guard.json`
- `npm run validate:real-uat-operator-handoff`
- `npm run validate:real-uat-session-importer`

Статус release pack остается `release_candidate`.

## Последствия

Release evidence больше не отстает от текущих real UAT readiness gates. G9 acceptance остается pending до настоящей UAT-сессии.

## Валидация

- `npm run validate:release-pack`
- `npm test`
