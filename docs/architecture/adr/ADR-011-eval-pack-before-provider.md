# ADR-011: Eval Pack До Подключения Внешнего LLM Provider

Дата: 2026-06-22  
Статус: Accepted  
Версия процесса: 0.1.0

## Контекст

DataCanvas генерирует презентации через AI boundary. Если подключить внешний LLM provider до появления eval pack, команда получит нестабильный контур без воспроизводимого критерия качества, factuality и prompt-injection защиты.

## Решение

До подключения внешнего provider в default flow обязателен локальный eval pack:

- happy path;
- security;
- traceability;
- presentation quality;
- hallucination resistance;
- prompt-injection guard.

Проверка выполняется через `scripts/validate-eval-pack.mjs` и команду `npm run validate:evals`.

## Последствия

Плюсы:

- подключение реального LLM будет иметь baseline качества;
- ошибки claims и prompt-injection ловятся локально;
- eval cases становятся частью sprint evidence и CI.

Ограничения:

- eval pack пока structural, а не model-quality benchmark;
- real-provider metrics должны быть добавлены отдельным спринтом.
