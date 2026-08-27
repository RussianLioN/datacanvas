# Отчёт о закрытии обхода выпускного запрета кандидата CO-2026-003

## Исходный brief

Источник требований: `.superpowers/sdd/prototype-revision-foundation-release-lock-brief.md`.

## RED

Команда:

```bash
npm run validate:co-2026-003-prototype-revision
```

Результат красной фазы: команда упала на новом отрицательном сценарии
`ready-for-render-with-pending-sources`.

Точная ошибка:

```text
ready-for-render-with-pending-sources: валидатор должен был отклонить нарушение
```

Это подтвердило обход: текущий кандидат мог быть формально переведён в
`ready_for_visual_render`, хотя четыре внешних источника оставались в статусе
`pending_owner_attachment`.

## GREEN

Выполненные проверки:

```bash
npm run validate:co-2026-003-prototype-revision
npm run validate:schemas
npm run validate:data-leakage
npm run scan:secrets
git diff --check
```

Все перечисленные проверки завершились с кодом `0`.

## Изменения

- Схема кандидата разрешает только
  `blocked_until_owner_selection_and_editable_sources`.
- Схема требует `render_allowed: false`, `owner_selection_complete: false`,
  `all_external_editable_sources_received: false`.
- Валидатор независимо повторяет эти требования и проверяет, что все четыре
  внешних источника остаются `pending_owner_attachment`.
- Добавлен отрицательный сценарий обхода через верхние признаки готовности.

## Что не менялось

- Активный выпуск, действующие договоры, SVG, PNG, HTML, генераторы, архив,
  `demo/**` и `derived/**`.

## Остаточные блокеры

- Выбор финальных текстов по пяти темам.
- Получение четырёх внешних источников.
- Отдельный будущий договор транзакционного переключения в активный визуальный
  выпуск.
