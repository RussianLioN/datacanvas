# CO-2026-002: Граница P1 И P2 Для Запуска DataCanvas Другим Агентом

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Продукт](../README.md) / [Product Change Orders](README.md) / CO-2026-002

Статус: accepted
Владелец: Product Owner
Проверка: `npm run validate:product-change-orders`

## Причина

После принятия `CO-2026-001` Product Owner уточнил границу основного маршрута запуска DataCanvas другим агентом и следующий инкремент доставки результата.

`CO-2026-002` не отменяет и не переписывает `CO-2026-001`. Он уточняет состав ближайшего `P1`-маршрута и отделяет следующий `P2`-инкремент от уже принятого первого направления.

## Изменение Приоритета

| Было | Стало |
|---|---|
| В `P1` явно выделены только проверка входа и генерация презентации; остальные связанные истории запуска другим агентом остаются в `P2` | Весь основной маршрут запуска другим агентом становится `P1`; следующий инкремент со ссылкой, хранилищем и уведомлением в Лисе остается отдельным `P2` |

## Статус Решения

Product Owner decision: `accepted`.

Основной маршрут `P1`: другой агент передает DataCanvas запрос и входной пакет; DataCanvas проверяет достаточность и безопасность данных; после успешной проверки сообщает вызывающему агенту, что данные приняты; затем готовит редактируемый файл презентации и нередактируемую копию; результат доставляется пользователю по электронной почте.

Следующий инкремент `P2`: результат сохраняется в специализированном хранилище, вызывающему агенту возвращается ссылка на нередактируемую копию, а показ ссылки и уведомления в Лисе реализуются совместно со смежной командой вызывающего агента и командой Лисы.

## Продуктовые Правила

- `DC-ST-23` - `DC-ST-29` относятся к основному маршруту запуска DataCanvas другим агентом и получают приоритет `P1`.
- Доставка по электронной почте остается обязательным каналом результата для основного маршрута.
- Редактируемый файл презентации и нередактируемая копия считаются продуктовым результатом маршрута; точный технический контракт форматов остается в системном анализе.
- Ссылка на нередактируемую копию, специализированное хранилище и уведомления в Лисе не входят в основной маршрут `P1`; для них нужен отдельный инкремент, оценка и согласование владельцев смежных зон.
- В стейкхолдерских и бизнесовых документах используется формулировка "другой агент"; техническое обозначение `A2A` остается только в технических артефактах.

## Согласованные Артефакты

- `docs/product/requirements/user-stories.md`
- `docs/product/backlog/product-backlog.md`
- `docs/product/backlog/agent-launch-candidate-stories-2026-q3.md`
- `docs/product/backlog/agent-launch-candidate-stories-2026-q3.csv`
- `docs/product/requirements/business-requirements.md`
- `docs/product/requirements/acceptance-criteria.md`
- `docs/product/requirements/non-functional-requirements.md`
- `docs/product/requirements/traceability-matrix.json`
- `docs/product/specs/feature-spec-a2a-launch.json`
- `docs/product/specs/task-spec-a2a-launch.json`
- `docs/product/specs/agent-prompt-spec-a2a-launch.json`
- `docs/product/ux/uat-script.md`
- `docs/product/analysis/documentation-consistency-audit/sprint-candidate-plan.md`
- `docs/product/analysis/documentation-consistency-audit/agent-launch-p1-effort-estimation.md`
- `docs/product/analysis/agent-launch-requirements-analysis/requirements-impact-map.json`
- `docs/product/sources/product-source-registry.json`

## Проверка

```bash
npm run validate:product-change-orders
npm run validate:change-impact
npm run validate:business-docs
npm run validate:traceability-graph
npm run validate:spec-task-prompt-readiness
npm run validate:data-leakage
```
