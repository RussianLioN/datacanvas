# PROC-037: Governed BA/SA Discovery Loop

ID: `PROC-037`
Статус: draft
Автор: Codex
Дата: 2026-07-02
Целевая версия процесса: 0.2.0

## Проблема

BA/SA interview-derived requirements могут попасть в refinement без явного trust status, evidence request и system-analysis coverage.

## Причина Изменения

DataCanvas вводит фабрику БА/СА артефактов и Product Change Order. Для этого DoR, DoD и process events должны явно учитывать interview evidence, open questions, evidence requests, SA contract/security/NFR check и rollback signals.

## Предлагаемое Изменение

- DoR требует interview evidence или явное решение `интервью не требуется`.
- DoR требует claim status, owner/date для open question, BA value check и SA contract/security/NFR check.
- DoD требует закрытые или явно отложенные evidence requests.
- DoD требует синхронизацию requirements, backlog, acceptance, traceability и BA/SA evidence delta.
- Process event log получает `EVT-INTERVIEW-*`, `EVT-EVIDENCE-*`, `EVT-REFINEMENT-DECIDED`, `EVT-DOR-READY`, `EVT-GENERATOR-RUN`, `EVT-VALIDATION-RUN`, `EVT-ROLLBACK-SIGNAL`.

## Влияние

- Затронутые роли: Product Owner, Process Owner, Security/Privacy Lead, QA/Evals Lead, Development Team.
- Затронутые артефакты: Definition of Ready, Definition of Done, process event log, BA/SA validators, PR template.
- Риск для текущего Sprint Goal: низкий, потому что изменение пока draft и не включает live integrations.

## Метрика Успеха

`npm run validate:ba-sa` и `npm run validate:process-events` проходят, а interview-derived artifact не может стать acceptance gate без confirmed claim и evidence.

## План Проверки

```bash
npm run validate:ba-sa
npm run validate:process-events
npm test
```

## Rollback

Вернуть DoR/DoD и process event additions, удалить BA/SA validation scripts из `npm test`, оставить документы как draft product artifacts без process gate.

## Решение

Статус решения: not_decided.
Дата решения: не принято.
Решающий владелец: Process Owner.
