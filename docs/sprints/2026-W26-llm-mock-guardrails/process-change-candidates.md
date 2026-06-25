# Process Change Candidates

Версия процесса: 0.1.0

## PROC-CANDIDATE-S6-001

Предложение: для каждого LLM-инкремента требовать минимум один отрицательный eval case.

Причина: schema-positive проверки недостаточны для AI-agent продукта; нужны проверяемые failure modes.

Статус: candidate for retrospective.

## PROC-CANDIDATE-S6-002

Предложение: подключение любого внешнего LLM provider проводить только через Process Change Request.

Причина: внешний provider меняет trust boundaries, стоимость, latency, observability и failure modes.

Статус: candidate for retrospective.
