# Planning

## Цель

Сделать G10 управляемым gate, который явно блокируется до внешнего pilot evidence.

## Ограничения

- Не создавать фиктивный pilot report.
- Не создавать fake commit SHA или PR evidence.
- Не считать G10 принятым без real UAT.

## Definition Of Done

- `npm run validate:pilot-gate` проходит.
- Manifest остается `blocked_pending_external`.
- Full quality gate проходит.
