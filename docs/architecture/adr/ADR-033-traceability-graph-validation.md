# ADR-033: Traceability Graph Validation

## Статус

Accepted

## Контекст

План DataCanvas требует управляемую цепочку `source -> fact -> requirement -> backlog -> artifact -> eval -> sprint decision -> process change`. До этого часть трассировки была разнесена по Markdown, JSON fixtures и sprint evidence, но не было единого структурного графа и validation gate.

## Решение

Добавить `docs/architecture/schemas/traceability-graph.json`, схему `schemas/traceability-graph.schema.json` и валидатор `scripts/validate-traceability-graph.mjs`.

## Последствия

- Решения спринта и изменения процесса становятся частью проверяемой трассировки.
- Каждая обязательная цепочка должна иметь существующие узлы, ребра и evidence paths.
- Граф пока покрывает bootstrap/MVP fixture path; real UAT будет добавлена после появления реального session artifact.
