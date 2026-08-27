# Release И Evidence DataCanvas

Навигация: [DataCanvas](../../README.md) / [Документация](../README.md) / Release

Статус: active
Владелец: Delivery/GitOps Lead
Проверка: `npm run validate:docs-navigation`

## Стартовые Документы

- [MVP release evidence pack](mvp-release-evidence-pack.md)
- [MVP release evidence JSON](mvp-release-evidence-pack.json)
- [Commit/PR evidence](commit-pr-evidence.md)
- [Pilot report](pilot-report.md)
- [Pilot execution handoff](pilot-execution-handoff.md)
- [Черновой пакет документации CO-2026-003](co-2026-003-draft-documentation-archive.md) — текущий состав документов и принятого 11-кадрового прототипа до чистового выпуска.
- [Скачать полный черновой пакет](../product/analysis/presentation-link-lisa-user-journey/candidate-evidence/co-2026-003-current-documentation-draft.zip?raw=true) — автономный ZIP с текущими документами и прототипом.
- [RCA визуального выпуска CO-2026-003](co-2026-003-visual-prototype-rca.md) — причина дефекта наложения и обязательный порядок SVG → PNG → HTML → архив.
- [RCA импорта презентаций CO-2026-003](co-2026-003-presentation-pdf-import-rca.md) — причина неверной SVG-реконструкции и правило контролируемого PDF → PNG для трёх вариантов презентации.
- [RCA каскадного расхождения CO-2026-003](../knowledge/rca/2026-08-25-co-2026-003-amendment-cascade-drift.md) — причина рассинхронизации дополнений владельца и защита от подмены черновика чистовым выпуском.
- [Commit/PR evidence template](templates/commit-pr-evidence-template.md)

## Перед Review

Используй `.github/PULL_REQUEST_TEMPLATE.md`, укажи затронутые `ART-*`, docs routes, validation evidence, release impact и rollback/forward-fix.
