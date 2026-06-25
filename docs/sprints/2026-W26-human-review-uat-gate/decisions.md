# Decisions

## DEC-S26-001: Skeleton До UI

Сначала фиксируются роли, состояния, действия и UAT сценарии. Интерактивный UI будет отдельным increment, чтобы не смешивать процесс приемки и реализацию интерфейса.

## DEC-S26-002: Export Только После Approval

Validator запрещает export до состояния `approved`. Это минимальный guardrail для MVP Gate.

## DEC-S26-003: G9 Как Целевой Gate

UAT manifest привязан к `G9 MVP Accepted`, потому что этот gate отвечает за human review и MVP flow.
