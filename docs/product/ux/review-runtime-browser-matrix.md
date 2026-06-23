# Review Runtime Browser Matrix

## Назначение

Этот артефакт задает минимальную browser/viewport matrix для interactive review runtime перед real UAT. Он не является real UAT evidence и не создает exported runtime state.

## Viewports

| ID | Размер | Класс |
| --- | --- | --- |
| mobile-small | 360x740 | mobile |
| tablet | 820x1180 | tablet |
| desktop | 1440x900 | desktop |

## Static Checks

- Есть responsive viewport meta.
- Есть mobile breakpoint `max-width: 820px`.
- Основной layout ограничен `max-width`.
- Grid layout переходит в single-column на mobile.
- Toolbar допускает перенос controls.
- Runtime JSON переносит длинное содержимое.
- Real UAT controls видимы в HTML: `Actor ID`, `Real UAT`, `Сбросить session`.

## Команды

```bash
npm run validate:review-runtime-browser-matrix
npm run validate:review-runtime-interactive
```

## Следующий Шаг

Перед real UAT открыть runtime на указанных viewport targets и затем выполнять operator handoff.
