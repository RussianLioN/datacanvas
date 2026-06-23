# ADR-041: Data Leakage Gate

Дата: 2026-06-22
Статус: accepted

## Контекст

Security DoD плана требует, чтобы PII/secrets не попадали в prompt, trace, screenshot, export и evidence. Secret scan и export sanitization уже есть, но нет отдельного gate для selected runtime/export/trace/evidence sinks.

## Решение

Добавить `docs/architecture/security/data-leakage-manifest.json` и validator `scripts/validate-data-leakage.mjs`.

Gate проверяет выбранные sinks:

- export HTML;
- render result;
- trace manifest;
- LLM result;
- review runtime state;
- release evidence;
- export/renderer regression evidence.

Проверяются классы: secret, pii, local_path, raw_trace, internal_prompt, tool_output.

## Последствия

Security DoD становится исполняемым не только через общий secret scan, но и через целевую проверку data leakage на runtime/evidence outputs. Policy docs не сканируются этим gate, потому что они легитимно содержат названия запрещенных классов.

## Валидация

- `npm run validate:data-leakage`
- `npm run scan:secrets`
- `npm run validate:export`
- `npm test`
