# CO-2026-002: Граница P1 И P2 Для Запуска DataCanvas Другим Агентом

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Продукт](../README.md) / [Product Change Orders](README.md) / CO-2026-002

Статус: accepted
Владелец: Product Owner
Проверка: `npm run validate:product-change-orders`

## Причина

После принятия `CO-2026-001` Product Owner уточнил границу основного маршрута запуска DataCanvas другим агентом и доставки результата по ссылке.

`CO-2026-002` не отменяет и не переписывает `CO-2026-001`. Он уточняет состав ближайшего `P1`-маршрута и отделяет группу возможностей с приоритетом `P2` от уже принятого первого направления.

## Изменение Приоритета

| Было | Стало |
|---|---|
| В `P1` явно выделены только проверка входа и генерация презентации; остальные связанные истории запуска другим агентом остаются в `P2` | Весь основной маршрут запуска другим агентом становится `P1`; доставка по ссылке, хранилище и уведомление в Лисе остаются группой возможностей с приоритетом `P2` |

## Статус Решения

Product Owner decision: `accepted`.

Основной маршрут `P1`: другой агент передает DataCanvas запрос и входной пакет с данными для определения получателя результата; DataCanvas проверяет достаточность и безопасность данных; после успешной проверки сообщает вызывающему агенту, что данные приняты; затем готовит редактируемый `PPTX`-файл презентации и нередактируемую `PDF`-копию; результат доставляется пользователю по электронной почте.

Группа возможностей с приоритетом `P2`: электронная доставка расширяется на разрешенные рабочие контуры, `PDF`-копия сохраняется в защищенном хранилище, вызывающему агенту возвращается ссылка на эту копию, а показ ссылки и уведомления в Лисе реализуется совместно командой вызывающего агента и командой Лисы.

## Продуктовые Правила

- `DC-ST-23` - `DC-ST-29` относятся к основному маршруту запуска DataCanvas другим агентом и получают приоритет `P1`.
- `DC-ST-30` - `DC-ST-33` относятся к доставке результата по ссылке и получают приоритет `P2`.
- Доставка по электронной почте остается обязательным каналом результата для основного маршрута.
- Редактируемый `PPTX`-файл презентации и нередактируемая `PDF`-копия считаются продуктовым результатом основного маршрута.
- Входной пакет должен содержать данные, достаточные для определения получателя результата; точный состав этих данных остается задачей системного анализа.
- Ссылка на `PDF`-копию, защищенное хранилище, расширенная электронная доставка и уведомления в Лисе не входят в основной маршрут `P1`; для них используется группа возможностей с приоритетом `P2`, отдельной оценкой и согласованием владельцев смежных зон.
- В стейкхолдерских и бизнесовых документах используется формулировка "другой агент"; техническое обозначение `A2A` остается только в технических артефактах.

## Согласованные Артефакты

- `docs/product-vision.md`
- `docs/product/bmc/bmc-v0.2.md`
- `docs/product/requirements/user-stories.md`
- `docs/product/backlog/product-backlog.md`
- `docs/product/backlog/agent-launch-candidate-stories-2026-q3.md`
- `docs/product/backlog/agent-launch-candidate-stories-2026-q3.csv`
- `docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.xlsx`
- `docs/product/sources/working/datacanvas-backlog-draft-pshe-2026-07-08.provenance.json`
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
- `docs/product/analysis/documentation-consistency-audit/confluence-import-map.md`
- `docs/product/analysis/agent-launch-requirements-analysis/requirements-impact-map.json`
- `docs/product/sources/product-source-registry.json`

## Проверка

```bash
npm run validate:product-change-orders
npm run validate:change-impact
npm run validate:business-docs
npm run validate:traceability-graph
npm run validate:spec-task-prompt-readiness
npm run validate:xlsx-backlog
npm run validate:xlsx-cascade
npm run validate:product-source-consistency
npm run validate:data-leakage
```
