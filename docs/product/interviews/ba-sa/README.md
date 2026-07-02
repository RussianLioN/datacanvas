# БА/СА Интервью DataCanvas

Навигация: [DataCanvas](../../../../README.md) / [Документация](../../../README.md) / [Продукт](../../README.md) / БА/СА интервью

Статус: draft
Владелец: Product Owner
Проверка: `npm run validate:ba-sa-interview`

## Назначение

Раздел хранит управляемый контур `интервью -> safe_summary -> claim -> БА артефакты -> СА артефакты -> спецификации -> проверки -> Change Order`.

## Правило Данных

- Сырые ответы не используются как источник требований.
- Downstream артефакты получают только `safe_summary` или claim object с `trust_status`, `data_class` и `allowed_downstream_use`.
- `confirmed + evidence` может стать требованием или acceptance gate.
- `unconfirmed` становится evidence request.
- `assumption` уходит в backlog исследования.
- `contradicted` создает stop condition или negative eval.

## Артефакты

- [Протокол интервью](interview-protocol.md)
- `question-bank.json`
- `active-interview-runtime-state.json`
- `interview-answer-set.json`
- `interview-results.json`
- [Запросы evidence](evidence-requests.md)
- [Журнал решений](decision-log.md)
- [Открытые вопросы](open-questions.md)

## Ограничение Baseline

Текущие файлы являются подготовленным baseline на основе существующих проектных источников. Они не утверждают, что проведено новое пользовательское интервью.
