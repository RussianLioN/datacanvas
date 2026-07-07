# PROC-048: CLI-Friendly Форматирование Таблиц

ID: `PROC-048`
Статус: accepted
Автор: Codex
Дата: 2026-07-07
Целевая версия процесса: `0.1.0`

## Проблема

Табличные данные в рабочем чате Codex CLI могут отображаться плохо, если выводить их как обычные Markdown pipe tables. Пользователь уже указал, что отчеты и вопросы должны быть UX-friendly — удобными для чтения — и не должны заставлять вручную разбирать плохо отформатированные таблицы.

## Причина Изменения

В пользовательском окружении установлен навык `cli-table-output`, который задает читаемый формат таблиц для Codex CLI: списки для коротких сравнений, fenced `text` Unicode-таблицы для матриц и запрет Markdown pipe table в чате по умолчанию. Это правило нужно закрепить в проектных инструкциях DataCanvas и универсальном рабочем процессе документации.

## Предлагаемое Изменение

- Закрепить в `AGENTS.md`, что табличные данные в рабочем чате выводятся через `cli-table-output` или его правила.
- Закрепить аналогичное правило в универсальном рабочем процессе документации для вопросов, отчетов, планов, статусов и матриц.
- Проверять наличие правила через `npm run validate:universal-documentation-workflow`.
- Не менять продуктовый смысл DataCanvas и не добавлять эту задачу в продуктовые backlog, stories, требования, BMC или Vision.

## Влияние

- Затронутые роли: Process Owner, Documentation Owner, пользователь рабочего чата Codex.
- Затронутые артефакты: `AGENTS.md`, универсальный workflow, process backlog, process changelog, process change ledger, процессный аудит `PROC-048`.
- Затронутые спринты: текущий процессный проход `SPRINT-2026-W27`.
- Риск для текущего Sprint Goal: низкий; меняется только формат рабочего диалога и процессные инструкции.
- Влияние на CI/evidence: усиливается `validate:universal-documentation-workflow`, обновляются navigation, artifact registry, hash manifest и process metrics snapshot.

## Метрика Успеха

Любой табличный ответ в рабочем чате по умолчанию оформляется через `cli-table-output`: короткие сравнения становятся списками, а матрицы и статусные сводки — fenced `text` Unicode-таблицами шириной до 88 символов.

## План Проверки

```bash
npm run validate:universal-documentation-workflow
npm run validate:process-change-ledger
npm run generate:docs-navigation -- --check
npm run validate:doc-links
npm run validate:docs-navigation
npm run validate:artifact-registry
npm run validate:artifact-hashes
npm run validate:process-metrics-snapshot
git diff --check
npm test
```

## Rollback

Вернуть `PROC-048` в Draft, удалить правило `cli-table-output` из `AGENTS.md` и UDW-инструкций, убрать проверку из `validate-universal-documentation-workflow`, затем регенерировать navigation, hash manifest и process metrics snapshot.

## Решение

Статус решения: accepted.
Дата решения: 2026-07-07.
Решающий владелец: Process Owner.
