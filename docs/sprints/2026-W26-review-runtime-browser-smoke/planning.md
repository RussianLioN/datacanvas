# Planning

## Sprint Goal

Снизить риск ручного UAT на неготовом runtime, добавив воспроизводимый static browser smoke gate.

## Scope

В scope входит только локальная проверка существующего `review-runtime-interactive.html`. Real UAT, screenshot artifacts и browser-engine automation остаются вне scope.

## Acceptance

- `npm run validate:review-runtime-browser-smoke` проходит.
- Новый gate включен в `npm test`.
- Completion audit остается `blocked_pending_external`.
