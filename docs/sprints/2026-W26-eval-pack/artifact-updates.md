# Artifact Updates

Версия процесса: 0.1.0

## Добавлено

- `scripts/validate-eval-pack.mjs`
- `docs/architecture/evals/eval-strategy.md`
- `docs/architecture/adr/ADR-011-eval-pack-before-provider.md`
- Sprint 7 evidence pack.

## Изменено

- `tests/evals/eval-cases.json`: расширен до six-case MVP eval pack.
- `schemas/eval-case.schema.json`: добавлены типы `presentation_quality` и `hallucination_resistance`.
- `package.json`: добавлена команда `validate:evals`, включена в `npm test`.
- `.github/workflows/docs-check.yml`: добавлен eval gate.
- `docs/architecture/security/tool-allowlist.yaml`: добавлен локальный eval validation tool.
- `docs/architecture/schemas/artifact-registry.json`: зарегистрированы eval artifacts.
