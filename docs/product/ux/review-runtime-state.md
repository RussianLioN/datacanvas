# Review Runtime State

Версия процесса: 0.1.0

## Назначение

`docs/product/ux/review-runtime-state-fixture.json` фиксирует минимальный контракт сохранения состояния human review: текущий state, разрешение export, историю переходов, actor, role, timestamp и reason.

## Правило

Export разрешен только из состояния `approved`. Любой переход должен существовать в `docs/product/ux/human-review-flow.json` и быть доступен роли, указанной в событии.

## Ограничение

Это fixture для проверки runtime state contract. Он не доказывает, что проведена настоящая пользовательская UAT-сессия.
