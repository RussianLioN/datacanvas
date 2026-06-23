# Threat Model

Статус: draft

## Основные Риски

- Prompt injection во входном пакете.
- Sensitive information disclosure в prompt, trace, evidence или export.
- Excessive agency через расширение tool permissions.
- Insecure output handling при рендере.
- Supply chain risk через зависимости и внешние инструменты.
- Unbounded consumption по стоимости и задержке LLM.

## Базовые Контроли

- Вход другого агента недоверенный.
- Data classification обязательна.
- Tool allowlist deny-by-default.
- `PresentationSpec` валидируется до renderer.
- Export sanitization обязателен.

