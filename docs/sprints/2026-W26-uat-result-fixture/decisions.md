# Decisions

## DEC-S28-001: Fixture До Реальной Сессии

До появления interactive review UI фиксируется deterministic UAT result fixture. Реальная пользовательская сессия будет отдельным artifact.

## DEC-S28-002: Thresholds Берутся Из UAT Manifest

Validator сравнивает result metrics с `uat-manifest.json`, чтобы thresholds не дублировались вручную.

## DEC-S28-003: Accepted Только При Approved

UAT result считается принятым только при `review_state=approved`, `decision=accepted` и всех passed scenarios.
