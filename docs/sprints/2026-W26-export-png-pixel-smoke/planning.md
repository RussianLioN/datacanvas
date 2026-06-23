# Planning

## Scope

Инкремент закрывает минимальный pixel-level smoke для generated PNG fixture.

## Out Of Scope

- Browser screenshots.
- Pixel diff реального layout.
- Real UAT evidence.

## Acceptance

- `npm run generate:golden` создает декодируемый PNG.
- `npm run validate:export-png-pixel-smoke` проходит.
- `npm test` проходит.
