# Отчёт по сохранению неактивного результата брейншторма CO-2026-003

`CO-2026-003` — изменение Q4_2026 для заказа презентации из агента «Справка по клиенту» в Лисе.

## Итоговый статус

Статус: `GREEN`.

Результат брейншторма сохранён только в неактивном `candidate-evidence/**`. Активные договоры, действующий маршрут, рендеры, архивы, `demo/**`, `derived/**`, `evidence/**` и `.superpowers/sdd/progress.md` не менялись.

Коммит создан. `push` не выполнялся.

Базовый `HEAD` перед коммитом: `627479cdf72637f0ce32650a221620920772f1d9`.

Итоговый SHA коммита передаётся в рабочем отчёте исполнителя после фиксации. Его нельзя надёжно встроить в файл, который входит в этот же коммит: изменение строки с SHA меняет сам SHA коммита.

## RED

Команда:

```bash
npm run validate:co-2026-003-brainstorm-evidence
```

Первое ожидаемое падение:

```text
отсутствует docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/delivery-success-message/brainstorming-topic-result.json
```

## GREEN

Команда:

```bash
npm run validate:co-2026-003-brainstorm-evidence
```

Результат:

```text
3 теста пройдены.
Проверка неактивного результата брейншторма CO-2026-003 пройдена.
```

Проверка подтверждает:

- 19 участников первой фазы;
- ровно 20 вариантов у каждого участника;
- ровно 380 сырых вариантов;
- ровно 30 консолидированных вариантов;
- 19 независимых анонимных ранжирований второй фазы;
- правило подсчёта 5–1 балл за позиции 1–5;
- итоговые варианты `1`, `2`, `9`, `6`, `14`;
- `selected_text: null`;
- `render_allowed: false`, `archive_allowed: false`, `generator_input_allowed: false`;
- отсутствие локальных путей, `file:`, `.docx`, почтовых адресов и 64-символьных хэшей.

## RCA по schema-only findings рецензента

Симптом: JSON Schema напрямую не отклоняла 21-й вариант у участника, `.DOCX` в верхнем регистре и 64-символьный SHA-256; часть отрицательных сценариев проверяла только общий отказ.

Корневая причина: у `phase_1.participants[].variants` не было `maxItems: 20`, а `safeText` не содержал SHA-256 и использовал недостаточно точные шаблоны для `.docx` и почты.

Исправление: в схеме добавлены `maxItems: 20`, регистронезависимый `.docx`, почтовый адрес и SHA-256; в тесты добавлен прямой Ajv schema-only сценарий для 21-го варианта, `.DOCX`, почты, SHA-256 и `generator_input_allowed: true`; отрицательная фикстура получила конкретные признаки отказа.

RED: добавленный schema-only тест падал на `twenty-first-participant-variant`, потому что старая схема принимала 21-й вариант.

GREEN: `npm run validate:co-2026-003-brainstorm-evidence` проходит с тремя подтестами.

## RCA по старому отрицательному сценарию

Симптом: после усиления `brainstorming-contract.schema.json` команда `npm run validate:co-2026-003-prototype-revision` падала на сценарии `invalid-brainstorming-phases`.

Корневая причина: `tests/fixtures/co-2026-003-prototype-revision-negative.json` ожидал старое ручное сообщение `brainstorming topic button_label phase_1 must consolidate exactly 30 candidates`, но нарушение `consolidated_candidate_count = 29` теперь корректно останавливается раньше на JSON Schema с сообщением `/topics/0/phase_1/consolidated_candidate_count: must be equal to constant`.

Исправление: в `tests/fixtures/co-2026-003-prototype-revision-negative.json` обновлено только ожидаемое сообщение для сценария `invalid-brainstorming-phases`. Тестовый код не менялся, запрет не ослаблялся.

RED:

```bash
npm run validate:co-2026-003-prototype-revision
```

Ошибка:

```text
invalid-brainstorming-phases: ERROR: docs/product/analysis/presentation-link-lisa-user-journey/source/brainstorming-contract.json does not match docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/brainstorming-contract.schema.json: /topics/0/phase_1/consolidated_candidate_count: must be equal to constant
```

GREEN:

```bash
npm run validate:co-2026-003-prototype-revision
```

Результат:

```text
2 теста пройдены.
Проверка кандидата пересборки прототипа CO-2026-003 пройдена.
```

## Состав изменений

Создан неактивный пакет свидетельств:

- `docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/delivery-success-message/brainstorming-topic-result.json`;
- `docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/delivery-success-message/brainstorming-topic-result.md`;
- `docs/product/analysis/presentation-link-lisa-user-journey/candidate-evidence/delivery-success-message/raw-variants-ledger.md`.

Добавлены или обновлены проверки:

- `docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/brainstorming-topic-result.schema.json`;
- `docs/product/analysis/presentation-link-lisa-user-journey/source/schemas/brainstorming-contract.schema.json`;
- `scripts/validate-co-2026-003-brainstorm-evidence.mjs`;
- `tests/co-2026-003-brainstorm-evidence.test.mjs`;
- `tests/fixtures/co-2026-003-brainstorm-evidence-negative.json`;
- `tests/fixtures/co-2026-003-prototype-revision-negative.json`;
- `scripts/validate-json-schema.mjs`;
- `package.json`.

Обновлены навигационные артефакты:

- `docs/navigation/navigation-source.json`;
- `docs/navigation/documentation-index.json`;
- `docs/navigation/orphan-docs-report.md`.

Не трогалось: `.superpowers/sdd/progress.md` — файл уже был изменён до этой работы и остаётся чужим изменением.

## Проверки

Зелёные:

```bash
npm run validate:co-2026-003-brainstorm-evidence
npm run validate:co-2026-003-prototype-revision
npm run validate:schemas
npm run validate:data-leakage
npm run scan:secrets
npm run generate:docs-navigation -- --check
npm run validate:doc-links
npm run validate:docs-navigation
npm run validate:doc-stale-status
git diff --check
git show --check --stat --oneline HEAD
```

## Остаточный риск

Остаточный риск: итоговый SHA коммита не встроен в этот файл, потому что изменение строки с SHA меняет сам коммит. Фактический SHA передаётся в рабочем сообщении после `git commit --amend --no-edit`.
