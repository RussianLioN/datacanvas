# Review

## Что Изменено

- Добавлены deterministic PDF и PNG smoke artifacts.
- Добавлен manifest с SHA-256 и required gates.
- Добавлен validator сигнатур PDF/PNG и hash consistency.
- Gate подключен к CI и `npm test`.

## Acceptance Evidence

- `npm run validate:export-smoke`
- `npm run validate:schemas`
- `npm run validate:bootstrap`
- `npm test`

## Ограничения

Smoke artifact не является полноценным PDF/PNG renderer и не проверяет визуальное соответствие HTML.
