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
- [Архив поставки чистового прототипа CO-2026-003](co-2026-003-prototype-delivery-archive.md) — текущий состав документов и автономного браузерного прототипа.
- [Скачать полный архив поставки](../../artifacts/delivery/co-2026-003-q4-lisa-profile-delivery.zip?raw=1) — единый автономный ZIP с текущими документами и локальным запуском прототипа.
- [Доказательства чистового браузерного прототипа](co-2026-003-browser-native-phone-prototype-release-evidence.md) — единый отпечаток кандидата, 4K-ресурсы и границы данных.
- [RCA визуального выпуска CO-2026-003](co-2026-003-visual-prototype-rca.md) — причина дефекта наложения и обязательный порядок SVG → PNG → HTML → архив.
- [RCA импорта презентаций CO-2026-003](co-2026-003-presentation-pdf-import-rca.md) — причина неверной SVG-реконструкции и правило контролируемого PDF → PNG для трёх вариантов презентации.
- [RCA каскадного расхождения CO-2026-003](../knowledge/rca/2026-08-25-co-2026-003-amendment-cascade-drift.md) — причина рассинхронизации дополнений владельца и защита от подмены черновика чистовым выпуском.
- [RCA статуса чистового выпуска CO-2026-003](../knowledge/rca/2026-09-03-browser-final-acceptance-gate-drift.md) — защита от повторного сохранения принятого результата в статусе черновика.
- [Commit/PR evidence template](templates/commit-pr-evidence-template.md)

## Перед Review

Используй `.github/PULL_REQUEST_TEMPLATE.md`, укажи затронутые `ART-*`, docs routes, validation evidence, release impact и rollback/forward-fix.
