# Отчёт об исправлении плана пересборки SVG-прототипа CO-2026-003

## Изменено

- Восстановлен и переписан `docs/plans/co-2026-003-svg-prototype-revision-implementation-plan.md`.
- В план внесены все 9 обязательных исправлений из краткого задания:
  - текущий кандидат остаётся v1 со значением `version` `"1.0.0"`;
  - будущая версия `"3.0.0"` относится только к новому `canonical-svg-frame-pipeline-contract.json`;
  - единый цикл выбора текста применён ко всем пяти темам;
  - добавлены отрицательные сценарии для 29 кандидатов, пропущенного шага, неанонимной второй волны и преждевременного рендера;
  - активный `evidence/**` не используется для будущих черновиков до переключения;
  - перечислены блокирующие тесты, валидаторы, генераторы, браузерная проверка, проверка доказательств и архивный шлюз;
  - RCA уточняет обязательную связку `active-contracts.json`, `journey-contract.json`, кадрового договора, каталога SVG-рендеров и производных PNG/HTML;
  - зафиксированы три состояния: кандидат v1, будущий SVG-первичный кандидат и активный выпуск;
  - добавлена самопроверка плана.
- В `docs/plans/README.md` добавлена русскоязычная ссылка на план.
- В `docs/navigation/navigation-source.json` сохранена модель `navigable: false`; уточнён русский текст `update_trigger`.
- Штатным генератором обновлены `docs/navigation/documentation-index.json` и `docs/navigation/orphan-docs-report.md`.

## Самопроверка через поиск

```text
rg -n "candidate_contract_version|version = \"3\\.0\\.0\"|\\bTask\\b|\\bFiles\\b|\\bRead\\b|\\bInterfaces\\b|\\bStep\\b|\\bRun\\b|\\bExpected\\b|\\bSelf-review\\b|\\bModify\\b|\\bTest\\b|\\bValidate\\b|\\bConsumes\\b|\\bProduces\\b|\\bpush\\b" docs/plans/co-2026-003-svg-prototype-revision-implementation-plan.md
код завершения: 1

rg -n "/Users/|file://" docs/plans/co-2026-003-svg-prototype-revision-implementation-plan.md
код завершения: 1

rg -n "План реализации пересборки SVG-прототипа CO-2026-003|co-2026-003-svg-prototype-revision-implementation-plan" docs/plans/README.md docs/navigation/documentation-index.json docs/navigation/navigation-map.md docs/navigation/orphan-docs-report.md docs/navigation/stale-status-report.md
код завершения: 0
```

## Проверки

- `npm run generate:docs-navigation` — пройдено.
- `npm run generate:docs-navigation -- --check` — пройдено.
- `npm run validate:doc-links` — пройдено.
- `npm run validate:docs-navigation` — пройдено.
- `npm run validate:doc-stale-status` — пройдено.
- `npm run validate:data-leakage` — пройдено до отчёта и повторно пройдено после отчёта.
- `git diff --check` — пройдено.
- `git show --check HEAD` — пройдено; после обновления отчёта проверка повторяется на финальном локальном коммите.

## Остаточные риски

- План описывает будущую реализацию, но не выполняет её: SVG, PNG, HTML, ZIP, активные договоры, кандидатный или активный контракт не менялись.
- В рабочем дереве до этой правки уже был изменён `.superpowers/sdd/progress.md`; он не относится к этому исправлению и не включается в коммит.
