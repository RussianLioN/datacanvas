# PDF/PNG Export Strategy

Статус: draft
Версия процесса: `0.1.0`

## Цель

Подготовить следующий слой export после HTML baseline без преждевременного выбора тяжелого toolchain.

## Текущий Baseline

- HTML export создается deterministic renderer-ом.
- `RenderResult` фиксирует путь и SHA-256 HTML artifact.
- Export sanitization и structural visual baseline уже входят в `npm test`.

## Предлагаемый Путь

1. Использовать HTML как canonical render source.
2. Добавить PDF/PNG export через headless browser только после stabilization HTML baseline.
3. Для PDF/PNG сохранять отдельные `RenderResult.outputs[]` с форматами `pdf` и `png`.
4. Для PNG добавить screenshot-based visual regression после появления устойчивого эталона.

## Blocking Gates

- HTML export проходит sanitization.
- HTML export проходит visual baseline.
- `PresentationSpec` проходит schema validation.
- `RenderResult` содержит SHA каждого export.
- Export не содержит raw traces, hidden notes, local paths, internal prompts, PII или secrets.

## Открытые Вопросы

- Выбрать конкретный browser automation toolchain.
- Определить размеры viewport для PNG baseline.
- Определить, хранить ли PDF/PNG в git или только как release artifacts.

