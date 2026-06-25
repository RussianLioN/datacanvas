# ADR-064: Documentation Navigation Indexing

## Статус

Принято.

## Контекст

Документы DataCanvas покрывают продукт, процесс, архитектуру, BMC, release evidence, sprint artifacts и security boundaries. Без управляемого navigation layer root `README.md` разрастается в каталог, а агенту трудно понять, какие документы можно индексировать публично.

Нужен воспроизводимый слой, который отделяет ручной источник истины от generated outputs и не раскрывает confidential evidence.

## Решение

Ввести `docs/navigation/navigation-source.json` как ручной контракт маршрутов, owners, lifecycle, visibility, data class, `navigation_group` и update triggers.

`navigation_group` фиксирует смысловую группу документа или маршрута:

- `business`;
- `delivery`;
- `technical`;
- `governance`;
- `evidence`;
- `generated`.

Добавить генератор `scripts/generate-docs-navigation.mjs`, который создает:
- `docs/navigation/documentation-index.json`;
- `docs/navigation/navigation-map.md`;
- `docs/navigation/orphan-docs-report.md`;
- `docs/navigation/stale-status-report.md`.

Generated map строится группами из `navigation_groups`, а business-группа выводится первой. Генератор не использует дату, `mtime`, ветку, абсолютные пути и сеть. Generated navigation artifacts не редактируются вручную и имеют `canonical_source`.

`visibility` и `data_class` разделены:

- `visibility: public` означает видимый маршрут в репозитории;
- `data_class: public` означает возможность внешней публикации;
- draft business documents остаются `data_class: internal`, пока нет privacy/sanitization review.

Generator и validator проверяют не только reachability, но и смысловую группу маршрута: business routes не могут вести в plans, PROC, ADR, schemas, scripts, tests или raw evidence как в первичный источник продукта.

## Последствия

Положительные:
- root `README.md` остается коротким маршрутным входом;
- root `README.md`, `docs/README.md` и `docs/product/README.md` становятся business-first;
- public navigation/search corpus управляется deny-by-default;
- sensitive/confidential evidence попадает только как metadata-only;
- generated navigation map становится группированной и пригодной для Product Owner, delivery, technical и governance маршрутов;
- stale release/process wording проверяется отдельным gate.

Ограничения:
- новый документ требует классификации в navigation source или explicit ignore;
- изменение navigation source требует регенерации index/map/reports;
- публикация индекса вне репозитория требует отдельный Process Change Request.
