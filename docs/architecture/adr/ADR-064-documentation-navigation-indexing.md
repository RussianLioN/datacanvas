# ADR-064: Documentation Navigation Indexing

## Статус

Принято.

## Контекст

Документы DataCanvas покрывают продукт, процесс, архитектуру, BMC, release evidence, sprint artifacts и security boundaries. Без управляемого navigation layer root `README.md` разрастается в каталог, а агенту трудно понять, какие документы можно индексировать публично.

Нужен воспроизводимый слой, который отделяет ручной источник истины от generated outputs и не раскрывает confidential evidence.

## Решение

Ввести `docs/navigation/navigation-source.json` как ручной контракт маршрутов, owners, lifecycle, visibility, data class и update triggers.

Добавить генератор `scripts/generate-docs-navigation.mjs`, который создает:
- `docs/navigation/documentation-index.json`;
- `docs/navigation/navigation-map.md`;
- `docs/navigation/orphan-docs-report.md`;
- `docs/navigation/stale-status-report.md`.

Генератор не использует дату, `mtime`, ветку, абсолютные пути и сеть. Generated navigation artifacts не редактируются вручную и имеют `canonical_source`.

## Последствия

Положительные:
- root `README.md` остается коротким маршрутным входом;
- public navigation/search corpus управляется deny-by-default;
- sensitive/confidential evidence попадает только как metadata-only;
- stale release/process wording проверяется отдельным gate.

Ограничения:
- новый документ требует классификации в navigation source или explicit ignore;
- изменение navigation source требует регенерации index/map/reports;
- публикация индекса вне репозитория требует отдельный Process Change Request.
