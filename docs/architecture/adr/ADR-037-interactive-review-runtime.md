# ADR-037: Interactive Review Runtime

Дата: 2026-06-22
Статус: accepted

## Контекст

В DataCanvas уже есть статический `review-ui-fixture.html` и `review-runtime-state-fixture.json`, но они не доказывают, что review state может сохраняться из работающего интерфейса. Это оставляет gap в UX/prototype track перед реальной UAT-сессией.

## Решение

Добавить отдельный интерактивный HTML prototype `artifacts/examples/review-runtime-interactive.html` и манифест `docs/product/ux/review-runtime-interactive.json`.

Prototype:

- реализует state machine `draft -> in_review -> changes_requested -> draft -> in_review -> approved`;
- блокирует export до `approved`;
- сохраняет runtime state в `localStorage`;
- позволяет скачать state как JSON evidence;
- не использует network, iframe, cookies или external assets.

Проверка выполняется командой `scripts/validate-review-runtime-interactive.mjs`.

## Последствия

Появляется воспроизводимый local runtime evidence для следующей real UAT-сессии. При этом артефакт остается prototype и не заменяет `human-review-session-real.json`.

## Валидация

Обязательные проверки:

- `npm run validate:review-runtime-interactive`
- `npm run validate:schemas`
- `npm run validate:bootstrap`
- `npm test`
