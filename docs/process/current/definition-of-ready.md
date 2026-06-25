# Definition Of Ready

Backlog item можно брать в Sprint Backlog только если выполнены критерии ниже.

## Общие Критерии

- Есть стабильный ID.
- Есть владелец.
- Есть цель и ожидаемый результат.
- Есть источник требования или решения.
- Есть acceptance criteria.
- Понятен способ проверки.
- Оценено влияние на безопасность, качество, трассировку и документацию.
- Для нового или существенно обновленного документа указан docs route: запись в `docs/navigation/navigation-source.json` или explicit ignore с причиной.
- Для нового бизнесового документа указан `navigation_group: business`, product index route и связь с Vision, BMC, stories, требованиями, backlog, roadmap, hypotheses или traceability.
- Для технического, process, ADR, schema, script или evidence документа явно указана небизнесовая группа.
- Задача помещается в недельный спринт или оформлена как spike.

## Для Требований

- Указан пользователь или stakeholder.
- Указана связь с Vision, BMC, гипотезой или риском.
- Указано влияние на БТ или НФТ.
- Требование связано с traceability matrix.

## Для Процессных Изменений

- Создан `PROC-*`.
- Заполнен Process Change Request.
- Указаны метрика успеха, срок проверки и rollback rule.
- Если меняется маршрут документации или evidence, указан navigation impact и validation command.
- Если меняется business-first порядок, указан cross-group source-of-truth impact.

## Для AI/LLM Работ

- Указаны входная и выходная схемы.
- Указаны eval cases.
- Указаны forbidden behavior и fallback expectations.
- Проверено, что tool permissions не расширяются без ADR/PCR.
