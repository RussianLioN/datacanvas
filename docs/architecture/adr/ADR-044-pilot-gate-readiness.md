# ADR-044: Pilot Gate Readiness

Дата: 2026-06-22
Статус: accepted

## Контекст

План требует Sprint 9: Pilot And Process Portability с Gate G10 Pilot Accepted и G11 Process Version Accepted. Репозиторий уже содержит G9 release candidate readiness, interactive review runtime и real UAT import gate, но реальная UAT и pilot run еще не проведены.

## Решение

Добавить `docs/release/pilot-gate-readiness.json` и validator `scripts/validate-pilot-gate-readiness.mjs`.

Gate должен оставаться `blocked_pending_external`, пока отсутствуют:

- `human-review-session-real.json`;
- exported runtime state реальной UAT;
- commit SHA и PR evidence;
- pilot report;
- process portability notes;
- data leakage coverage для real UAT artifacts.

## Последствия

Команда получает проверяемый pre-pilot gate и не сможет случайно объявить G10 готовым на основании fixture evidence. Это не заменяет pilot acceptance и не закрывает цель полностью.

## Валидация

- `npm run validate:pilot-gate`
- `npm test`
