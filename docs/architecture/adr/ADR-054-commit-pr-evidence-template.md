# ADR-054: Commit And PR Evidence Template

Дата: 2026-06-22

## Статус

Accepted

## Контекст

Completion audit и pilot gate readiness требуют `commit-sha-and-pr-evidence`, но этот evidence нельзя создать до фактического commit, PR или согласованной release record.

## Решение

Добавить `docs/release/templates/commit-pr-evidence-template.md` и validator `scripts/validate-commit-pr-evidence-template.mjs`.

Validator проверяет, что:

- template содержит обязательные поля commit, PR, CI и verification;
- release evidence pack оставляет `commit_sha.status=pending_until_commit`;
- completion audit продолжает блокироваться на `commit-sha-and-pr-evidence`;
- template не объявляет себя accepted/captured evidence.

## Последствия

Команда получает формат для последнего release train blocker, не подменяя реальный commit/PR evidence.
