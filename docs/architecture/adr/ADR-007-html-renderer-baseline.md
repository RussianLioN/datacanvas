# ADR-007: HTML Renderer Baseline

Статус: accepted
Дата: 2026-06-22

## Контекст

После `PresentationSpec` нужен первый deterministic renderer target, который можно проверять локально без PDF/PNG toolchain.

## Решение

Использовать `scripts/render-presentation.mjs` для генерации HTML export из `PresentationSpec`. Результат фиксируется в `artifacts/examples/presentation-minimal.html` и `artifacts/examples/render-result-minimal.json`.

## Последствия

- Renderer не вызывает LLM.
- Export проходит sanitization check.
- PDF/PNG и визуальные screenshot checks остаются следующим слоем.

