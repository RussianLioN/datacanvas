# PROC-046: Product Change Questionnaire State

ID: `PROC-046`
Статус: accepted
Автор: Codex
Дата: 2026-07-03
Целевая версия процесса: `0.1.0`

## Проблема

PO-опросник по Product Change Order может прерваться в середине согласования. Если состояние хранится только в чате, следующая сессия рискует начать опрос заново, потерять последний вопрос или смешать уже согласованные решения с новыми.

## Причина Изменения

Для `CO-2026-001` Product Owner потребовал обязательное сохранение статуса опросника в виде артефакта, возврат к последнему вопросу при продолжении, периодические остановки и обработку накопленных документов без полной методологической валидации до окончания всего опроса.

## Предлагаемое Изменение

- Ввести JSON-состояние PO-опросника по схеме `schemas/product-change-questionnaire-state.schema.json`.
- Вести Markdown-журнал опросника с согласованными решениями, checklist продолжения и TODO.
- Обновлять state/log после каждого ответа Product Owner.
- Запускать лёгкую проверку `npm run validate:co-questionnaire` после каждого сохранения.
- Делать контрольную остановку каждые 5 ответов.
- При вопросе по существующему разделу сначала выводить текущий текст раздела, затем комментарий и только потом вопрос.
- Полную методологическую валидацию выполнять после завершения всего опросника.

## Влияние

- Затронутые роли: Product Owner, Process Owner, Documentation Owner.
- Затронутые артефакты: `AGENTS.md`, методика документации, Product Change Orders, состояние и журнал `CO-2026-001`.
- Затронутые контракты: `schemas/product-change-questionnaire-state.schema.json`, `scripts/validate-product-change-questionnaire-state.mjs`, `package.json`.
- Риск для текущего scope: низкий; изменение не расширяет network, tools, provider или фактическую реализацию продукта.

## Метрика Успеха

Опросник можно возобновить по JSON-состоянию и журналу, а команда видит последний согласованный вопрос, следующий вопрос, накопленные решения и оставшиеся пункты.

## План Проверки

```bash
npm run validate:co-questionnaire
npm run validate:product-change-orders
npm run validate:change-impact
npm run validate:documentation-methodology
```

## Rollback

Вернуть правила опросника к предыдущему режиму без state/log, удалить `validate:co-questionnaire` из validation plan и пометить `CO-2026-001` questionnaire artifacts как superseded. Не удалять уже принятые продуктовые решения без отдельного решения Product Owner.

## Решение

Статус решения: accepted.
Дата решения: 2026-07-03.
Решающий владелец: Process Owner.
