# Версии Процесса

Здесь хранятся исторические версии процесса. Активная версия находится в `docs/process/current/`.

## Правило

Каждая версия процесса должна иметь отдельную папку:

```text
docs/process/versions/X.Y.Z/
  process-version-manifest.json
  process-snapshot.md
```

`process-version-manifest.json` фиксирует дату вступления версии, ссылки на snapshot/current/changelog и список sprint IDs, к которым применялась версия. Проверка выполняется командой:

```sh
npm run validate:process-versioning
```
