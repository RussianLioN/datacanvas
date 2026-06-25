# Export PNG Pixel Smoke

## Назначение

Этот gate добавляет pixel-level проверку для `artifacts/examples/presentation-smoke.png`.

Раньше export smoke проверял PNG signature и hash. Этого недостаточно: файл мог выглядеть как PNG на уровне magic bytes, но не декодироваться через zlib. Новый gate читает PNG chunks, проверяет IHDR, распаковывает IDAT и сверяет первый RGBA pixel.

## Что Проверяется

- PNG signature;
- chunk order `IHDR -> IDAT -> IEND`;
- width `1`, height `1`;
- bit depth `8`, color type `6` RGBA;
- успешный zlib inflate для IDAT;
- scanline filter `0`;
- первый pixel `[37, 99, 235, 255]`;
- SHA256 из `export-smoke-manifest.json`.

## Ограничения

Проверка не запускает браузер, не делает screenshot и не заменяет visual regression реальных слайдов. Это lightweight smoke для контроля минимальной декодируемости PNG export fixture.

## Команды

```bash
npm run generate:golden
npm run validate:export-smoke
npm run validate:export-png-pixel-smoke
npm test
```
