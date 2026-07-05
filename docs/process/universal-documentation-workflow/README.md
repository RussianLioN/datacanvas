# Универсальный Рабочий Процесс Проектной Документации

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Процесс](../README.md) / Универсальный рабочий процесс документации

Статус: active
Владелец: Process Owner
Проверка: `npm run validate:universal-documentation-workflow`

## Назначение

Пакет задает переносимую методику в домене `documentation_operations` — операциях ведения проектной документации. Методика описывает, как принимать запрос, находить источники истины, анализировать влияние изменений, применять согласованные правки, запускать генераторы и доказывать готовность проверками.

DataCanvas используется только как пилотный профиль ИТ-продукта. Универсальное ядро не содержит продуктовый смысл DataCanvas и не принимает продуктовые, процессные или архитектурные решения вместо владельцев.

## Состав

- [Runbook](universal-workflow-runbook.md) — порядок запуска, продолжения и завершения рабочего процесса.
- [Universal workflow core](universal-workflow-core.json) — переносимые правила, состояния, уровни, проверки и критерии завершения.
- [DataCanvas profile](datacanvas-profile.json) — пилотный профиль проекта документации и ИТ-продукта DataCanvas.
- [Validation command catalog](validation-command-catalog.json) — каталог команд проверки по уровням gate — проверочных барьеров.
- [Artifact inventory](artifact-inventory.json) — инвентарь источников, generated artifacts — автоматически создаваемых артефактов — и evidence — проверочных свидетельств.
- [Generator contracts](generator-contracts.json) — контракты генераторов, разрешенные записи и проверки воспроизводимости.
- [Workflow state](workflow-state.json) — состояние текущего запуска и указатели на журнал, очередь решений и ledger — журнал запуска.
- [Decision queue](decision-queue.json), [decision ledger](decision-ledger.json), [acceptance records](acceptance-records.json), [run ledger](run-ledger.json) и [event log](event-log.json) — контур решений, принятия и событий.
- [Schema coverage registry](schema-coverage-registry.json) — покрытие схемами, положительными примерами и отрицательными сценариями.
- [Mutation guard policy](mutation-guard-policy.json) — защита от лишних изменений и ручной правки generated artifacts.
- [Portability pack](portability-pack.json) — шаблоны переноса методики на другой ИТ-продукт.
- [Product bootstrap pack](product-bootstrap-pack.json) — минимальный стартовый пакет нового ИТ-продукта.

## Границы

- Универсальное ядро описывает правила workflow, но не содержит частные продуктовые утверждения DataCanvas.
- Профиль продукта описывает источники истины, роли, команды и ограничения конкретного ИТ-продукта.
- Экземпляр изменения хранит конкретный `run_id`, область работ, решения владельцев, правки, генерацию, проверки и остаточные риски.
- Product behavior acceptance — принятие изменения поведения продукта, documentation change acceptance — принятие изменения документации, owner decision acceptance — принятие решения владельцем — фиксируются отдельно и не подменяют друг друга.
- Generated artifacts редактируются только через исходный источник и генератор.

## Запуск

Минимальный текстовый запрос:

```text
Запусти универсальный рабочий процесс проектной документации по docs/process/universal-documentation-workflow/README.md.
```

Агент читает runbook, состояние запуска, профиль, инвентарь, очередь решений и журналы. Если правка меняет смысл продукта, процесса или архитектуры, агент формулирует ее как предлагаемое изменение и останавливается до явного принятия владельцем.
