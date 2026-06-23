# Real UAT One-Command Runner

## Назначение

Runner минимизирует действия пользователя до одной команды:

```bash
npm run uat:real
```

Команда запускает локальный сервер, открывает interactive review runtime, принимает exported runtime state через `/uat-export`, сохраняет его в `artifacts/manual/real-uat/review-runtime-state-export.json`, запускает dry-run проверки и создает `docs/product/ux/human-review-session-real.json` через importer.

## Что Делает Runner

- запускает preflight checks;
- открывает UAT-страницу на `127.0.0.1`;
- добавляет кнопку автоматической передачи state в runner;
- сохраняет real runtime export;
- запускает `validate:real-uat-import -- --dry-run`;
- запускает `prepare:real-uat-session -- --dry-run`;
- запускает `prepare:real-uat-session` без `--dry-run`.

## Что Делает Пользователь

1. Запускает `npm run uat:real`.
2. В браузере нажимает `Сбросить session`.
3. Включает `Real UAT`.
4. Указывает реальный `Actor ID`.
5. Выполняет review flow: `submit_for_review`, `comment`, `record_decision approved`, `export`.
6. Дожидается сообщения runner об успешной записи session artifact.

## Stop Rules

- Не использовать `fixture`, `template`, `sample`, `placeholder`, `TO_BE_FILLED` в `Actor ID`.
- Не запускать с неготовым runtime.
- Не перезаписывать существующий real evidence без осознанного `--force`.
- Не считать runner pilot evidence.

## Команды

```bash
npm run validate:real-uat-one-command-runner
npm run uat:real
npm run uat:real -- --no-open
npm run uat:real -- --force
```
