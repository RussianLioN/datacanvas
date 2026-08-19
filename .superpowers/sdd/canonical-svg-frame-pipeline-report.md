# Отчет по неактивному договору SVG-first кадров

## Срез

Создан неактивный договор будущего SVG-first контура `CO-2026-003` — заявки на продолжение профиля Лисы в четвертом квартале 2026 года. Договор не включен в активный реестр, не является входом генератора и не разрешает рендер или архив.

## RED

Команда:

```bash
node --test tests/canonical-svg-frame-pipeline.test.mjs
```

Первое ожидаемое падение:

```text
Отсутствует обязательный файл: docs/product/analysis/presentation-link-lisa-user-journey/source/canonical-svg-frame-pipeline-contract.json
```

## GREEN

Команда:

```bash
npm run validate:canonical-svg-frame-pipeline
```

Результат:

```text
5/5 tests passed
Проверка неактивного договора SVG-first кадров CO-2026-003 пройдена.
```

## Доработка после рецензии

Рецензент указал Minor: JSON Schema не должна полагаться только на доменный валидатор для состава `future_frame_ids` и порядка `stakeholder_gallery_order`.

Дополнительный RED:

```bash
npm run validate:canonical-svg-frame-pipeline
```

Первое ожидаемое падение:

```text
Schema должна отклонять пропущенный будущий кадр

true !== false
```

Исправление: схема теперь сама задает точный массив из 11 будущих кадров и использует его же для `stakeholder_gallery_order.ordered_state_ids`.

Дополнительный GREEN:

```text
6/6 tests passed
Проверка неактивного договора SVG-first кадров CO-2026-003 пройдена.
```

## Измененные файлы

- `package.json`
- `docs/product/analysis/presentation-link-lisa-user-journey/source/canonical-svg-frame-pipeline-contract.json`
- `docs/product/analysis/presentation-link-lisa-user-journey/source/canonical-svg-frame-pipeline-contract.md`
- `docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/canonical-svg-frame-pipeline-contract.schema.json`
- `scripts/validate-canonical-svg-frame-pipeline.mjs`
- `tests/canonical-svg-frame-pipeline.test.mjs`
- `tests/fixtures/canonical-svg-frame-pipeline-negative.json`
- `docs/navigation/navigation-source.json`
- `docs/navigation/documentation-index.json`
- `docs/navigation/orphan-docs-report.md`
- `.superpowers/sdd/canonical-svg-frame-pipeline-report.md`

## Проверки

- `npm run validate:canonical-svg-frame-pipeline` — прошло.
- `npm run validate:co-2026-003-prototype-revision` — прошло.
- `npm run validate:schemas` — прошло.
- `npm run validate:data-leakage` — прошло.
- `npm run scan:secrets` — прошло.
- `npm run generate:docs-navigation -- --check` — прошло.
- `npm run validate:doc-links` — прошло.
- `npm run validate:docs-navigation` — прошло.
- `npm run validate:doc-stale-status` — прошло.
- `git diff --check` — прошло.
- `git show --check HEAD` — прошло после локального commit.

## Подтверждение границ

Активный выпуск и визуальные выходы не менялись: `active-contracts.json`, `journey-contract.json`, текущие SVG/PNG/HTML, генераторы текущего прототипа, `demo/**`, `derived/**`, `evidence/**`, архив и история интервью не изменялись.

Чужое изменение `.superpowers/sdd/progress.md` не относится к этому срезу и не включается в commit.
