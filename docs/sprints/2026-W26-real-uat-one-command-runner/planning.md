# Planning

## Scope

Инкремент автоматизирует проведение UAT-сессии: пользователь запускает одну команду, проходит реальные действия в браузере, а runner сохраняет export и запускает importer.

## Out Of Scope

- Подмена пользователя.
- Автоматическое принятие продукта без реального review.
- Pilot report и commit/PR evidence.

## Acceptance

- `npm run validate:real-uat-one-command-runner` проходит.
- `npm test` проходит.
- Existing completion audit остается blocked до фактической UAT-сессии.
