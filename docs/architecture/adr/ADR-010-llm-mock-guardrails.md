# ADR-010: LLM Mock Adapter И Guardrails Без Сети

Дата: 2026-06-22
Статус: Accepted
Версия процесса: 0.1.0

## Контекст

DataCanvas должен готовить презентацию через AI boundary, но ранняя разработка не должна зависеть от внешней модели, сетевого доступа или нестабильного поведения LLM. При этом результат AI boundary обязан оставаться проверяемым: вложенный `PresentationSpec` должен соответствовать схеме, а каждый claim должен ссылаться на существующий `FACT-*`.

## Решение

Ввести локальный `scripts/llm-mock-adapter.mjs`, который детерминированно создает `LLMResult` из `NormalizedData` и `LLMRequest`.

Ввести `scripts/validate-llm-guardrails.mjs`, который проверяет:

- блокировку запрещенных входов в `LLMRequest`;
- соответствие `LLMResult` схеме;
- соответствие вложенного `PresentationSpec` схеме;
- трассировку всех claims к существующим фактам;
- отрицательный пример с неподтвержденным `FACT-*`;
- no-network-by-default инварианты в allowlist и npm scripts.

## Последствия

Плюсы:

- контур AI boundary становится воспроизводимым в CI;
- неподтвержденные утверждения ловятся до renderer/export;
- внешний LLM можно подключать позже за тем же контрактом.

Ограничения:

- mock adapter не оценивает качество реальной модели;
- prompt quality, latency, cost и model failure modes остаются отдельными будущими eval-инкрементами.

## Проверка

```bash
npm run validate:llm
npm test
```
