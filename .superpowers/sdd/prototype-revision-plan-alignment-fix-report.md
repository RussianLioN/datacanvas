# Отчёт о синхронизации плана с кандидатом CO-2026-003

## Изменено

- В `docs/plans/co-2026-003-svg-prototype-revision-implementation-plan.md` три события открытия вложений заменены на точные значения из кандидатного договора: `open_attachment_slidedoc`, `open_attachment_sber2025`, `open_attachment_mag`.
- В порядке `stakeholder_gallery_order` кадр `lisa-presentation-chat-list` поставлен перед `lisa-presentation-sent`.
- Остальной порядок галереи сохранён: после трёх презентаций последними остаются `lisa-order-not-accepted`, `lisa-delivery-delayed`, `lisa-delivery-partial`.
- Навигация, JSON, SVG, PNG, HTML, генераторы, тесты и активный выпуск не менялись.

## Самопроверка

```text
rg -n "старые три имени событий открытия вложений" docs/plans/co-2026-003-svg-prototype-revision-implementation-plan.md
код завершения: 1

rg -n "open_attachment_slidedoc|open_attachment_sber2025|open_attachment_mag|stakeholder_gallery_order" docs/plans/co-2026-003-svg-prototype-revision-implementation-plan.md docs/product/analysis/presentation-link-lisa-user-journey/source/prototype-revision-candidate.json
код завершения: 0
```

## Проверки

- `git diff --check` — пройдено перед коммитом.
- `git show --check HEAD` — пройдено на финальном локальном коммите.

## Остаточные риски

- Изменение только синхронизирует план с уже проверенным кандидатом; будущая реализация прототипа этим коммитом не выполняется.
- В рабочем дереве остаётся чужое незакоммиченное изменение `.superpowers/sdd/progress.md`; оно не входит в этот коммит.
