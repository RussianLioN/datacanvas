# Planning

## Scope

Инкремент добавляет локальный интерактивный prototype для review state persistence. Реальная UAT-сессия не проводится в этом инкременте, потому что требует участия пользователя.

## Acceptance Criteria

- Prototype работает без dev server и внешней сети.
- Review actions соответствуют `docs/product/ux/human-review-flow.json`.
- Export action доступен только из `approved`.
- Сохраняемые поля соответствуют `schemas/review-runtime-state.schema.json`.
- Validator проверяет HTML, manifest, schema linkage и forbidden patterns.
