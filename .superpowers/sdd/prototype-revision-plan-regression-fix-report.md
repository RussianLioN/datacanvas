# Отчёт о регрессионном исправлении плана CO-2026-003

## Изменено

- В `docs/plans/co-2026-003-svg-prototype-revision-implementation-plan.md` восстановлен блок реального маршрута с точными рёбрами `lifecycle` и `inspection`.
- В план возвращён порядок демонстрационной галереи из 11 будущих кадров: сначала полный успешный путь, затем три альтернативных исхода.
- В задаче входных источников явно названы четыре `source_id`: `presentation_variant_slidedoc_editable_source`, `presentation_variant_sber2025_editable_source`, `presentation_variant_mag_editable_source`, `email_frame_canonical_svg_source`.
- В задачах SVG-каталога и высокого выпуска добавлен запрет `draft_png_upscale_for_final`: высокий PNG создаётся заново из согласованного SVG, а не масштабированием черновика.
- В транзакционном переключении и откате восстановлен единый комплект: `active-contracts.json`, `journey-contract.json`, кадровый и визуальный договор, `source-render-catalog.json`, `demo/**`, `derived/**`, `evidence/**`, манифесты, переносимый ZIP и архив поставки.
- Штатным генератором обновлён только `docs/navigation/documentation-index.json`, потому что обязательная проверка навигации выявила устаревшие якоря плана после изменения заголовков.

## Самопроверка через поиск

```text
rg -n "lisa-materials-full-reference.*validating|validating.*lisa-order-not-accepted|lisa-presentation-sent.*lisa-presentation-chat-list|open_delivery_email|open_slidedoc_attachment|delivery_partial_or_unconfirmed" docs/plans/co-2026-003-svg-prototype-revision-implementation-plan.md
код завершения: 0

rg -n "presentation_variant_slidedoc_editable_source|presentation_variant_sber2025_editable_source|presentation_variant_mag_editable_source|email_frame_canonical_svg_source|прямым входом рендера|прямого рендера из внешнего" docs/plans/co-2026-003-svg-prototype-revision-implementation-plan.md
код завершения: 0

rg -n "draft_png_upscale_for_final|масштабирован|масштабированием чернового PNG|HTML/CSS/PNG/дополнительного SVG-наложений|SVG-хэш" docs/plans/co-2026-003-svg-prototype-revision-implementation-plan.md
код завершения: 0

rg -n "demo/\*\*|derived/\*\*|source-render-catalog\.json|переносим|архив поставки|старые PNG|новыми договорами" docs/plans/co-2026-003-svg-prototype-revision-implementation-plan.md
код завершения: 0

rg -n "candidate_contract_version|version = \"3\.0\.0\"|\bTask\b|\bFiles\b|\bRead\b|\bInterfaces\b|\bStep\b|\bRun\b|\bExpected\b|\bSelf-review\b|\bModify\b|\bTest\b|\bValidate\b|\bConsumes\b|\bProduces\b|\bpush\b|/Users/|file://" docs/plans/co-2026-003-svg-prototype-revision-implementation-plan.md
код завершения: 1
```

## Проверки

- `npm run generate:docs-navigation -- --check` — пройдено после штатной генерации.
- `npm run validate:doc-links` — пройдено.
- `npm run validate:docs-navigation` — пройдено.
- `npm run validate:doc-stale-status` — пройдено.
- `npm run validate:data-leakage` — пройдено до отчёта и повторно после отчёта.
- `git diff --check` — пройдено до отчёта и повторно после отчёта.
- `git show --check HEAD` — пройдено на финальном локальном коммите.

## Остаточные риски

- План только возвращает обязательные требования в будущую реализацию; SVG, PNG, HTML, ZIP, кандидатные и активные договоры, `demo/**`, `derived/**`, действующие доказательства и генераторы не менялись.
- В рабочем дереве остаётся чужое незакоммиченное изменение `.superpowers/sdd/progress.md`; оно не входит в этот коммит.
