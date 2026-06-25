# Artifact Updates

Версия процесса: 0.1.0

## Добавлено

- Mock adapter для локальной генерации `LLMResult`.
- Валидатор LLM guardrails.
- Отрицательный fixture для неподтвержденного claim.
- ADR-010.
- No-network-by-default security note.

## Изменено

- `package.json`: `validate:llm` включен в `npm test`.
- `.github/workflows/docs-check.yml`: добавлен CI шаг для LLM guardrails.
- `scripts/validate-json-schema.mjs`: добавлена проверка вложенного `PresentationSpec`.
- `scripts/validate-bootstrap-artifacts.sh`: новые guardrail artifacts включены в обязательный bootstrap.
- `docs/architecture/security/tool-allowlist.yaml`: добавлены локальные LLM tools без сети.
- `docs/architecture/schemas/artifact-registry.json`: зарегистрированы новые артефакты.
