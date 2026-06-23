# ADR-053: Pilot Report Templates

Дата: 2026-06-22

## Статус

Accepted

## Контекст

Completion audit блокирует завершение плана до появления `docs/release/pilot-report.md` и `docs/release/pilot-process-portability-notes.md`. Создавать эти файлы заранее нельзя: это были бы внешние evidence без фактического pilot run.

## Решение

Добавить шаблоны:

- `docs/release/templates/pilot-report-template.md`
- `docs/release/templates/pilot-process-portability-notes-template.md`

Добавить validator `scripts/validate-pilot-report-templates.mjs`, который проверяет наличие обязательных секций и запрещает считать шаблоны реальными external evidence.

## Последствия

Команда получает готовый формат для заполнения после pilot run, а completion audit продолжает честно блокировать завершение до фактических файлов.
