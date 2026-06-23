# ADR-008: Structural Visual Baseline

Статус: accepted
Дата: 2026-06-22

## Контекст

После появления HTML export нужен быстрый visual gate до подключения browser screenshot regression.

## Решение

Использовать `scripts/validate-visual-baseline.mjs` как structural visual baseline. Проверка контролирует базовую HTML-структуру, viewport, количество слайдов, trace markers, ограничения длины claim и отсутствие скрытых/script/comment patterns.

## Последствия

- Грубые ошибки renderer блокируются без browser dependency.
- Screenshot regression остается следующим слоем.
- Visual baseline включен в `npm test`.

