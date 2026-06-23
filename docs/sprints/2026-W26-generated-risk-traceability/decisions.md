# Decisions

Версия процесса: 0.1.0

## DEC-017-001

`risk-traceability.json` считается генерируемым артефактом.

Причина: ручное сопровождение links между рисками, НФТ, eval cases и evidence повышает вероятность дрейфа.

Последствие: изменения трассировки выполняются через source artifacts:

- `risk-registry.json`;
- `traceability-matrix.json`;
- `provider-specific-eval-delta.json`;
- `risk-evidence-map.json`.

## DEC-017-002

`risk-evidence-map.json` остается ручным источником.

Причина: evidence paths нельзя надежно вывести только из требований, потому что evidence может быть runtime output, budget, security doc или scorer result.
