# UAT Script: MVP Human Review

## Цель

Проверить, что MVP flow DataCanvas можно принять человеком по evidence: входные данные трассируются, утверждения проверяются, ошибки блокируют export, а решение фиксируется.

## Участники

- Автор
- Ревьюер
- Утверждающий

## Предусловия

- `npm test` проходит.
- Есть сгенерированный `artifacts/examples/presentation-minimal.html`.
- Есть `tests/golden/claim-map-minimal.json` и `tests/golden/trace-manifest-minimal.json`.

## Сценарии

### UAT-001: Review Утверждений

1. Открыть презентацию.
2. Сверить ключевые claims с claim map.
3. Зафиксировать замечания или отсутствие замечаний.

Ожидаемый результат: unsupported claims равны 0.

### UAT-002: Запрос Правок

1. Найти claim, который требует уточнения.
2. Перевести review state в `changes_requested`.
3. Зафиксировать причину и affected artifact.

Ожидаемый результат: export заблокирован до возврата в `approved`.

### UAT-003: Approval

1. Проверить визуальную читаемость и отсутствие security/export blockers.
2. Перевести state в `approved`.
3. Зафиксировать approver decision.

Ожидаемый результат: artifact получает review decision evidence.

### UAT-004: Export Readiness

1. Проверить sanitization gate.
2. Проверить, что approved state не содержит blocking comments.
3. Разрешить export только после approval.

Ожидаемый результат: export разрешен только для approved artifact.

## Acceptance Thresholds

- Critical failures: 0
- Unsupported claims: 0
- Export blockers: 0
- Review completion: required

## Evidence

- Review state
- Decision log
- Claim map
- Trace manifest
- Export sanitization result
