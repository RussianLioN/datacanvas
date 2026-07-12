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

### UAT-005: A2A-first Launch Readiness

1. Проверить `docs/product/change-orders/co-2026-001-a2a-first-priority.json`.
2. Проверить, что A2A-first остается `draft` до Product Owner decision.
3. Проверить, что `FeatureSpec` использует только confirmed claim IDs.

Ожидаемый результат: A2A-first readiness проверяется без включения live network, MCP, provider или tool allowlist.

### UAT-006: Insufficient Or Untrusted Input

1. Проверить fixture `tests/fixtures/ba-sa-insufficient-input.json`.
2. Проверить связь с `ERR-001` и `AC-BASA-002`.
3. Проверить, что export не создается до clarification.

Ожидаемый результат: недостаточный или недоверенный input блокирует generation/export.

### UAT-007: Safe Agent Prompt

1. Проверить `docs/product/specs/agent-prompt-spec-a2a-launch.json`.
2. Проверить `raw_transcript_included=false`.
3. Проверить, что prompt использует safe context и не содержит сырые ответы интервью.

Ожидаемый результат: agent prompt можно передать агенту без доступа к raw interview answers.

### `UAT-008` — UAT-сценарий по подтвержденному решению о доставке

1. Проверить `BASA-CLM-009` — BA/SA-утверждение о канале доставки.
2. Проверить, что утверждение имеет статус `confirmed`.
3. Проверить, что `BT-012` — бизнес-требование о доставке результата — связано с отправкой готовых файлов пользователю по электронной почте.
4. Проверить, что `BT-018` — бизнес-требование о статусах — связано с сообщением вызывающему агенту о приеме данных после успешной проверки и сведениями о результате.
5. Проверить, что уведомление в Лисе, ссылка на результат и специализированное хранилище имеют приоритет `P2` и не заявлены частью основного маршрута с приоритетом `P1`.
6. Проверить, что пакет спецификаций не включает реальные сетевые, почтовые или интеграции обратного вызова.

Ожидаемый результат: принятое решение о доставке отражено в проектной документации и не расширяет технические границы исполнения.

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
- BA/SA interview-derived coverage
- Product Change Order
