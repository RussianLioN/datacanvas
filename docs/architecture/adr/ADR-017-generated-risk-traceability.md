# ADR-017: Генерируемая трассировка рисков

Дата: 2026-06-22
Статус: accepted

## Контекст

`risk-traceability.json` связывает риски provider-интеграции с НФТ, eval cases и evidence. Ручное сопровождение такого файла создает риск дрейфа между `risk-registry.json`, `traceability-matrix.json`, provider eval delta и фактическими evidence-файлами.

## Решение

`docs/architecture/risks/risk-traceability.json` считается генерируемым артефактом. Источники истины:

- `docs/architecture/risks/risk-registry.json` для списка рисков;
- `docs/product/requirements/traceability-matrix.json` для связей risk -> requirement/NFR;
- `tests/evals/provider-specific-eval-delta.json` для связей risk -> eval case;
- `docs/architecture/risks/risk-evidence-map.json` для evidence paths, которые нельзя надежно вывести из требований.

Генератор: `scripts/generate-risk-traceability.mjs`.

## Последствия

- Новый риск без NFR, eval case или evidence path блокирует генерацию.
- `npm run generate:golden` сначала обновляет `risk-traceability.json`, затем пересобирает `risk-matrix.md`.
- Ручные правки `risk-traceability.json` не являются устойчивым способом изменения трассировки; менять нужно исходные артефакты.

## Ограничения

`risk-evidence-map.json` остается ручным источником, потому что один риск может иметь несколько evidence-файлов с разной природой: scorer output, требования, budget или security-документ.
