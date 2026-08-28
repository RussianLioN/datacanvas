# Task 1 — предварительная проверка и единый вход XLSX

## Сделанное

- Добавлен валидатор `scripts/validate-active-xlsx-backlog-source.mjs`, который проверяет, что общий сценарий `validate:xlsx-backlog` использует текущий источник `SRC-DC-BACKLOG-DRAFT-PSHE-2026-08-19`, а исторический `SRC-DC-BACKLOG-DRAFT-PSHE-2026-08-17` не возвращён в общий вход.
- Добавлен отдельный сценарий `validate:xlsx-backlog-2026-08-19` и перенастроен общий `validate:xlsx-backlog` на `2026-08-19`.
- Добавлен golden-файл `tests/golden/xlsx-backlog-draft-pshe-2026-08-19.json`.
- Расширен `scripts/validate-datacanvas-xlsx-backlog.py`: добавлен профиль `2026-08-19`, проверка всех `xl/comments*.xml` и отрицательные мутации для текущей санитарной книги.
- Обновлён `docs/product/sources/product-source-registry.json`: активный источник `SRC-DC-BACKLOG-DRAFT-PSHE-2026-08-19` теперь ссылается на полный профильный валидатор, а `SRC-DC-BACKLOG-DRAFT-PSHE-2026-08-17` остаётся отдельным superseded-источником с исторической проверкой.

## Файлы

- `package.json`
- `scripts/validate-active-xlsx-backlog-source.mjs`
- `scripts/validate-datacanvas-xlsx-backlog.py`
- `tests/golden/xlsx-backlog-draft-pshe-2026-08-19.json`
- `docs/product/sources/product-source-registry.json`
- `.superpowers/sdd/task-1-report.md`

Не изменялись и не добавлялись в коммит: `docs/plans/co-2026-003-p1-cascade-methodology-implementation-plan.md`, `docs/architecture/schemas/artifact-hash-manifest.json`, `docs/navigation/documentation-index.json`, `docs/navigation/orphan-docs-report.md`.

## RED/GREEN TDD

RED:

```bash
node scripts/validate-active-xlsx-backlog-source.mjs
```

Результат до реализации:

```text
ERROR: validate:xlsx-backlog must call validate:xlsx-backlog-2026-08-19
```

GREEN:

```bash
node scripts/validate-active-xlsx-backlog-source.mjs
```

Результат после реализации:

```text
Active XLSX backlog source validation passed
```

## Команды и результаты

```bash
npm run validate:xlsx-backlog-2026-08-19
```

Результат: прошли `validate:xlsx-backlog-2026-08-19-source-security`, основной XLSX-валидатор и отрицательные self-tests для `2026-08-19`.

```bash
npm run validate:xlsx-backlog
```

Результат: общий сценарий прошёл через `scripts/validate-active-xlsx-backlog-source.mjs` и `validate:xlsx-backlog-2026-08-19`.

```bash
npm run validate:product-sources
npm run validate:product-source-consistency
npm run validate:xlsx-backlog-2026-08-17
npm run validate:xlsx-cascade
npm run validate:schemas
npm run scan:secrets
npm run validate:data-leakage
git diff --check
```

Результат: все команды завершились с кодом `0`.

## Саморевью

- Изменения ограничены зоной Task 1: package-сценарии, XLSX-валидаторы, реестр источников, golden-описание и локальный отчёт.
- Историческая книга `2026-08-17` сохранена и проверяется отдельной командой `validate:xlsx-backlog-2026-08-17`.
- Общий сценарий больше не вызывает исторический `validate:xlsx-backlog-2026-08-17`.
- Исходный внешний XLSX и локальные пути не раскрывались; проверки `scan:secrets` и `validate:data-leakage` прошли.

## Риски

- Полный `npm test` не запускался, чтобы не пересобирать и не затрагивать чужие уже изменённые generated-артефакты в этой общей рабочей копии.
- Generated navigation/hash-артефакты уже были изменены до этой задачи и намеренно не включались в коммит Task 1.
