# ADR-061: PNG Pixel Smoke Gate

## Статус

Принято.

## Контекст

Export smoke уже проверял наличие PNG output, hash и signature. Этого оказалось недостаточно: файл мог иметь PNG signature, но не декодироваться через zlib IDAT.

Для UX/prototype track нужен минимальный pixel-level assertion без добавления browser dependency.

## Решение

Сделать generated PNG smoke fixture валидным 1x1 RGBA PNG и добавить `scripts/validate-export-png-pixel-smoke.mjs`.

Валидатор проверяет:
- signature и chunk order;
- IHDR width/height;
- bit depth `8` и color type `6`;
- zlib inflate для IDAT;
- scanline filter `0`;
- первый RGBA pixel `[37, 99, 235, 255]`;
- SHA256 из `export-smoke-manifest.json`.

## Последствия

Положительные:
- export PNG fixture теперь проверяется на декодируемость;
- `npm test` ловит поврежденный IDAT;
- не нужна новая browser dependency.

Ограничения:
- это не browser screenshot;
- это не visual diff реальных слайдов;
- real UAT остается внешним blocker.
