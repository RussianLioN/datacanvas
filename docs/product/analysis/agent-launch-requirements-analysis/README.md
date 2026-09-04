# Анализ Требований Запуска DataCanvas Другим Агентом

Навигация: [DataCanvas](../../../../README.md) / [Документация](../../../README.md) / [Продукт](../../README.md) / [Анализ](../README.md) / Запуск другим агентом

Статус: historical
Владелец: Product Owner / Process Owner
Проверка: `npm run validate:agent-launch-requirements-analysis`

## Назначение

Пакет хранит историческое состояние, журнал и проверяемые решения прежней
границы `CO-2026-002` — заявки на изменение маршрута запуска другим агентом —
по влиянию `DC-ST-23` — пользовательской истории о передаче запроса от другого
агента — через `DC-ST-33` — пользовательскую историю об уведомлении в Лисе — на
`BT-*` — бизнес-требования. Он не является источником действующей границы 2026
года: её определяют [граница реализации 2026 года](../../sources/co-2026-003-current-2026-scope.md)
и каталог девяти действующих пользовательских историй.

Это контур проектной документации DataCanvas. Он не является `PBI-*` — элементом продуктового бэклога — и не описывает реализацию продукта, сетевых интеграций, MCP-интеграций, почтовых интеграций или callback-интеграций.

## Источники

- [Vision — видение продукта](../../../product-vision.md).
- [Stories — каталог пользовательских историй](../../requirements/user-stories.md).
- [Кандидатные истории запуска другим агентом](../../backlog/agent-launch-candidate-stories-2026-q3.md).
- [Business requirements — бизнес-требования](../../requirements/business-requirements.md).
- [Acceptance criteria — критерии приемки](../../requirements/acceptance-criteria.md).
- [Traceability — матрица связей и проверяемости](../../requirements/traceability-matrix.json).
- [BA artifacts — артефакты бизнес-анализа](../ba/ba-spec.json).
- [SA artifacts — артефакты системного анализа](../../../architecture/system-analysis/sa-spec.json).
- [Specs — спецификации](../../specs/README.md).

## Состав

- `analysis-state.json` — сохраняемое состояние анализа.
- `analysis-log.md` — журнал согласований и контрольных точек.
- `artifact-review-ledger.md` — аудит цепочки артефактов от Vision до Traceability.
- `story-requirement-decision-ledger.md` — решения по `DC-ST-23..DC-ST-33` — пользовательским историям-кандидатам.
- `requirements-impact-map.json` — карта влияния на `BT-*` — бизнес-требования.
- `question-bank.json` — банк вопросов для продолжения согласования, если появятся новые разногласия.
- `open-decisions.md` — открытые решения.
- `evidence-requests.md` — запросы доказательств.

## Правило Продолжения

После обрыва работы агент сначала читает `analysis-state.json`, затем `analysis-log.md`, затем продолжает с `last_open_checkpoint`. Если `last_open_checkpoint` равно `null`, новых вопросов Product Owner нет; изменения исторического снимка допускаются только через новый журналируемый шаг и повторную проверку `npm run validate:agent-launch-requirements-analysis`.
