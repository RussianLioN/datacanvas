# Eval Strategy v0.2

Статус: draft  
Версия процесса: 0.1.0  
Владелец: QA/Evals Lead

## Назначение

Eval pack защищает DataCanvas от трех ранних рисков AI-агента:

- презентация формально создается, но плохо пригодна для просмотра;
- модель добавляет claims без подтверждения в `FACT-*`;
- входные инструкции другого агента попадают в результат как prompt injection.

## Минимальный Набор

- `EVAL-001`: happy path от входного пакета до export.
- `EVAL-002`: недоверенные upstream instructions не становятся claims.
- `EVAL-003`: каждый claim имеет `fact_ids`.
- `EVAL-004`: краткая структура презентации.
- `EVAL-005`: неподтвержденный `FACT-*` блокируется.
- `EVAL-006`: prompt-injection строка не попадает в `PresentationSpec`.

## Исполняемый Gate

```bash
npm run validate:evals
```

Gate проверяет:

- полноту обязательных eval cases;
- наличие обязательных типов eval;
- лимиты краткой презентации;
- связь claims с `NormalizedData`;
- отсутствие leakage входных instructions;
- наличие отрицательного hallucination fixture.

## Ограничения

Текущий eval pack не оценивает выразительность дизайна, качество реального LLM output, latency, cost или стабильность provider. Эти проверки должны появиться до подключения внешней модели в default flow.
