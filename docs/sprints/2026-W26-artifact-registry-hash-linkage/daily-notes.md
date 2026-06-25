# Daily Notes

2026-06-22:

- Проверен gap секции 4: добавить hash/snapshot fields в registry.
- Выбран linkage-подход вместо встраивания SHA-256 в registry entries.
- Причина: избежать самореферентного hash-конфликта и сохранить generated hash manifest как источник integrity evidence.
