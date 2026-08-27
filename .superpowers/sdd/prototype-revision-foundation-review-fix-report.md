# Отчёт об исправлении замечаний к фундаменту кандидата CO-2026-003

## Исходный brief

Источник требований: `.superpowers/sdd/prototype-revision-foundation-review-fix-brief.md`.

## RED

Команда:

```bash
npm run validate:co-2026-003-prototype-revision
```

Результат красной фазы: команда упала на новом отрицательном сценарии
`missing-svg-first-step`.

Первая точная ошибка:

```text
missing-svg-first-step: ERROR: docs/product/analysis/presentation-link-lisa-user-journey/source/prototype-revision-candidate.json does not match docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/prototype-revision-candidate.schema.json: /visual_acceptance_contract/frame_flow: must NOT have fewer than 5 items
```

После красной фазы тестовая мутация была уточнена так, чтобы проходить базовую
схему и проверять профильный инвариант точного SVG-first порядка.

## GREEN

Выполненные целевые проверки:

```bash
npm run validate:co-2026-003-prototype-revision
npm run validate:schemas
npm run validate:data-leakage
npm run scan:secrets
npm run generate:docs-navigation -- --check
npm run validate:doc-links
npm run validate:docs-navigation
npm run validate:doc-stale-status
git diff --check
```

Все перечисленные проверки завершились с кодом `0`.

## Изменённые области

- `prototype-revision-candidate.json`: добавлены точные `lifecycle` и
  `inspection` рёбра, раздельные внешние источники и обязательный SVG-gate до
  рендера.
- `prototype-revision-candidate.schema.json`: уточнены форматы внешних
  источников и обязательность флага канонического SVG до рендера.
- `validate-co-2026-003-prototype-revision.mjs`: добавлены проверки точного
  SVG-first договора, точного множества рёбер, внешних источников, сырых следов
  исходника, отсутствия кандидата в активном реестре и временного 13-кадрового
  активного договора.
- `co-2026-003-prototype-revision.test.mjs` и отрицательная фикстура:
  добавлены сценарии из independent review.
- `prototype-revision-candidate.md`: уточнено, что внешний источник презентации
  не разрешает рендер без канонического SVG кадра.
- `co-2026-003-visual-prototype-rca.md`: добавлен подраздел профилактики
  повторения при будущей пересборке кандидата.
- `documentation-index.json`: пересобран штатным генератором навигации.

## Что не менялось

- Действующий `journey-contract.json`.
- Действующий `active-contracts.json`.
- SVG, PNG, HTML, архив, `demo/**`, `derived/**`, доказательства текущего
  выпуска.
- Визуальный генератор и полный `npm test`.

## Остаточные блокеры

- Не выбраны итоговые формулировки по пяти темам.
- Не получены четыре внешних источника: три редактируемых источника вариантов
  презентации и один канонический SVG-источник письма.
- Не выполнено отдельное транзакционное переключение кандидата в активный
  визуальный выпуск.
