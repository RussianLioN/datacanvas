# ADR-019: Проверяемое Версионирование Процесса

Дата: 2026-06-22
Статус: accepted

## Контекст

DataCanvas использует процесс как отдельный управляемый продукт. Спринтовые evidence-манифесты указывают `process_version`, но до этого не было машинной проверки, что версия существует в `docs/process/versions/`, описана в changelog и действительно применялась к конкретным спринтам.

## Решение

Добавить `docs/process/versions/0.1.0/process-version-manifest.json`, snapshot процесса и `scripts/validate-process-versioning.mjs`.

Валидатор проверяет:

- manifest версии процесса по JSON Schema;
- существование source plan, snapshot, current registry и changelog;
- совпадение active version в registry;
- наличие записи версии в changelog;
- наличие каждого sprint evidence в `applied_sprint_ids`;
- отсутствие ссылок на несуществующие sprint IDs.

## Последствия

- Новый спринт должен быть добавлен в manifest версии процесса.
- Новая версия процесса требует нового version manifest и changelog entry.
- История применения процесса становится проверяемой, а не только описательной.
