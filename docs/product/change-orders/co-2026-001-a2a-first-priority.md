# CO-2026-001: A2A-first Priority

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Продукт](../README.md) / [Product Change Orders](README.md) / CO-2026-001

Статус: draft
Владелец: Product Owner
Проверка: `npm run validate:product-change-orders`

## Причина

A2A-first запуск не является простой перестановкой backlog. Он меняет канал запуска, trust boundary, input envelope, status/callback, error taxonomy, trace и evals.

## Изменение Приоритета

| Было | Стало |
|---|---|
| Lisa launch, A2A launch | A2A launch, Lisa launch |

## Статус Решения

Product Owner decision: `deferred`.

Канонический приоритет не меняется до явного acceptance.

## Проверка

```bash
npm run validate:product-change-orders
npm run validate:change-impact
```
