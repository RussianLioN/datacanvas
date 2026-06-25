# DataCanvas BMC Package

Пакет содержит чистовой Business Model Canvas DataCanvas, визуальные производные файлы и служебные доказательства генерации.

## Основные файлы

| Файл | Назначение |
|---|---|
| `docs/product/bmc/bmc-v0.2.md` | Чистовой BMC в Markdown. |
| `docs/product/bmc/source/derived/datacanvas-bmc.svg` | Канонический визуальный источник. |
| `docs/product/bmc/source/derived/datacanvas-bmc.png` | Переносимый PNG-рендер из SVG. |
| `docs/product/bmc/source/derived/datacanvas-bmc.pdf` | PDF-рендер из SVG. |
| `docs/product/bmc/source/derived/datacanvas-bmc.puml` | Вторичный инженерный PlantUML-вид. |
| `docs/product/bmc/bmc-validation-needs.json` | Companion JSON для проверок и исследований. |

## Команды

```bash
npm run generate:bmc
npm run generate:bmc -- --check
npm run validate:bmc
```

## Правило

Публичные BMC-файлы остаются чистыми. Статусы проверки, источники, SHA и служебная трассировка хранятся только в JSON и evidence-файлах.
