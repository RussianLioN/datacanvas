# ADR-062: External Evidence Readiness Gate

## Статус

Принято.

## Контекст

Completion audit корректно заблокирован внешними evidence: real UAT export, real human review session, pilot report, portability notes и commit/PR evidence.

Эти артефакты нельзя создавать синтетически, но их отсутствие должно быть управляемым и проверяемым, иначе команда может случайно подменить completion fixture или template.

## Решение

Добавить `docs/process/audits/external-evidence-readiness.json`, dashboard `docs/process/audits/external-evidence-readiness.md` и валидатор `scripts/validate-external-evidence-readiness.mjs`.

Валидатор проверяет:
- список blockers совпадает с `plan-completion-audit.json`;
- список blockers совпадает с `external-blocker-closure-map.json`;
- path-like blockers отсутствуют, пока status `missing_pending_external`;
- supporting artifacts существуют;
- real session artifact имеет dry-run и write command через importer;
- validation commands включают completion и closure gates.

## Последствия

Положительные:
- внешний blocker становится управляемым process artifact;
- уменьшается риск фиктивного закрытия плана;
- команда получает explicit stop rules.

Ограничения:
- gate не создает external evidence;
- real UAT, pilot и commit/PR остаются обязательными перед completion.
