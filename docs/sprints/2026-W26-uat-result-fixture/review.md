# Review

## Что Изменено

- Добавлен исполняемый UAT result fixture.
- Добавлена schema и validator.
- Validator проверяет сценарии, thresholds, approval decision и evidence paths.
- Gate подключен к CI и `npm test`.

## Acceptance Evidence

- `npm run validate:uat-result`
- `npm run validate:schemas`
- `npm run validate:bootstrap`
- `npm test`

## Ограничения

Fixture не заменяет реальную UAT-сессию и interactive review UI.
