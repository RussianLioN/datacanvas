# Planning

Версия процесса: 0.1.0

## Контекст

Предыдущий спринт зафиксировал LLM schema boundary, но оставил слабое место: `LLMResult` мог быть валиден как оболочка, а вложенный `PresentationSpec` и claims требовали отдельной проверки.

## План

1. Добавить детерминированный mock adapter.
2. Добавить отрицательный пример с отсутствующим `FACT-*`.
3. Проверять вложенный `PresentationSpec`.
4. Проверять, что все claims трассируются к `NormalizedData`.
5. Проверять no-network-by-default инварианты в allowlist и npm scripts.
6. Подключить проверки к `npm test` и CI.

## Acceptance Criteria

- `npm run validate:llm` проходит на положительном примере.
- Отрицательный пример реально содержит неподдержанный `FACT-*` и обнаруживается валидатором.
- `npm test` запускает LLM guardrails.
- Сетевой доступ не требуется для golden path.
