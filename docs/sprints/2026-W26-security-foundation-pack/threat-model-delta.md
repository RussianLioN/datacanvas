# Threat Model Delta: Security Foundation Pack

Версия процесса: 0.1.0
Sprint: SPRINT-2026-W26-S21
Статус: active

## Изменения Поверх Baseline Threat Model

- Добавлен обязательный `security-foundation-manifest.json`.
- Добавлен локальный secret scan gate.
- Security foundation artifacts становятся частью bootstrap, CI и `npm test`.
- Следующие security artifacts считаются обязательными для Sprint Review:
  - data classification policy;
  - threat model;
  - threat model delta;
  - incident response;
  - export sanitization checklist;
  - tool allowlist deny-by-default.

## Новые Риски

- Ложноположительные срабатывания secret scan на документацию.
- Security manifest может устареть при добавлении нового security artifact.

## Контроли

- Secret scanner проверяет признаки реальных секретов, а не каждое слово `secret`.
- `validate:security-foundation` проверяет существование обязательных security artifacts и наличие ключевых stop rules.
- Artifact registry и process versioning связывают security foundation со sprint evidence.

## Решение

Security foundation pack принят как базовый gate для дальнейших product increments. Внешний LLM provider и network по-прежнему отключены до отдельного ADR/PCR.
