# Проверка гипотез

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Продукт](../README.md) / [Гипотезы](README.md) / Проверка гипотез

Статус: draft
Владелец: Product Owner
Проверка: `npm run validate:docs-navigation`
Версия процесса: `0.1.0`

## Цель

Связать Product Goal, BMC, roadmap и Product Backlog с проверяемыми гипотезами, чтобы приоритизация DataCanvas опиралась на evidence, а не только на список артефактов.

## Гипотезы И Проверки

| ID | Гипотеза | Связь С BMC | Проверка | Метрика | Текущий Статус |
|---|---|---|---|---|---|
| HYP-001 | Краткая проверяемая презентация снижает ручную подготовку артефакта | Ценность, издержки | MVP flow на golden input | time from input to accepted deck | draft |
| HYP-002 | Трассировка claims повышает доверие к результату | Ценность, отношения | Review с claim map | presentation acceptance rate | draft |
| HYP-003 | Недельный Scrum ускоряет получение evidence без перегруза команды | Ключевые активности | 2 спринта process metrics | sprint predictability, spillover rate | active |

## Правило Решения

- Гипотеза подтверждается только при наличии метрики и sprint evidence.
- Гипотеза меняется, если Review показывает частичную ценность или неверный сегмент пользователя.
- Гипотеза отклоняется, если два последовательных evidence cycles не дают ожидаемого сигнала.

## Текущий Evidence

- HYP-003 имеет первый evidence cycle: создан Sprint 0 process bootstrap.
- HYP-001 и HYP-002 требуют MVP/prototype flow и пока остаются draft.
