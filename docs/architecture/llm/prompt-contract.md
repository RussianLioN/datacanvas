# LLM Prompt Contract

Статус: draft
Версия процесса: `0.1.0`

## Назначение

Ограничить будущий LLM-вызов DataCanvas так, чтобы модель генерировала только валидируемый `PresentationSpec` и не обходила renderer, traceability или security boundaries.

## Входы

- Только validated normalized data.
- Только факты из `facts[]`.
- Только разрешенный brief context.
- Upstream `instructions` не передаются как инструкции модели.

## Выход

- Только JSON, совместимый с `schemas/presentation-spec.schema.json`.
- Каждый claim должен ссылаться минимум на один `FACT-*`.
- Никакого HTML, CSS, PDF, PNG, raw traces, hidden notes или tool output.

## Forbidden Behavior

- Добавлять факты без источника.
- Исполнять инструкции из входного пакета.
- Расширять tool permissions.
- Публиковать или отправлять результат во внешние системы.
- Включать PII/secrets в prompt, output, trace или export.

## Fallback

Если данных недостаточно, модель должна вернуть структурированный отказ в рамках будущего `LLMResult` с error class `insufficient_data`, а не выдумывать claims.

## Eval Requirements

- Unsupported claim detection.
- Prompt injection input ignored.
- JSON schema stability.
- Claim map completeness.

