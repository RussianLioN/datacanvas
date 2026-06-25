# Planning

## Цель

Синхронизировать release evidence с текущими gates процесса.

## Ограничения

- Не создавать `human-review-session-real.json` без реальной пользовательской сессии.
- Не заполнять commit SHA и PR evidence до фактического commit/PR.
- Не менять release status на published.

## Definition Of Done

- `npm run validate:release-pack` проходит.
- `npm run validate:bootstrap` проходит.
- `npm test` проходит.
- Known limitations сохраняют внешний блокер real UAT.
