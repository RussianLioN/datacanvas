# ADR-060: Static Browser Smoke Gate For Review Runtime

## Статус

Принято.

## Контекст

S59 добавил browser/viewport matrix для interactive review runtime, но проверка оставалась описательной и не фиксировала отдельный smoke gate для DOM, CSS, runtime hooks и trust boundary.

Реальный UAT и browser-specific rendering bugs нельзя закрыть статическим анализом, но перед ручной проверкой нужен быстрый воспроизводимый gate.

## Решение

Добавить `docs/product/ux/review-runtime-browser-smoke.json`, схему `schemas/review-runtime-browser-smoke.schema.json` и валидатор `scripts/validate-review-runtime-browser-smoke.mjs`.

Валидатор проверяет:
- связь с `review-runtime-browser-matrix.json`;
- responsive viewport и mobile breakpoint;
- required DOM controls;
- layout stability rules;
- localStorage/runtime export hooks;
- отсутствие network URL, iframe, cookie access и `eval`.

## Последствия

Положительные:
- перед real UAT есть быстрый deterministic smoke gate;
- browser-readiness assertions становятся частью `npm test`;
- сохраняется запрет на фиктивное real UAT evidence.

Ограничения:
- gate не запускает браузерный движок;
- gate не делает pixel screenshot;
- gate не создает `review-runtime-state-export.json` и `human-review-session-real.json`.
