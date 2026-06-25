# ADR-029: Release Evidence Pack

## Статус

Accepted

## Контекст

План DataCanvas требует release evidence packet: release goal, accepted PRs, commit SHA, CI evidence, artifact registry snapshot, known risks, rollback/forward-fix plan и acceptance decision. После UAT result fixture G9 имел проверяемую приемку, но release candidate не имел отдельного пакета evidence.

## Решение

Добавить `docs/release/mvp-release-evidence-pack.json` и схему `schemas/release-evidence-pack.schema.json`. Проверка выполняется командой `npm run validate:release-pack`, которая запускает `scripts/validate-release-evidence-pack.mjs`.

## Последствия

- G9 MVP fixture получает проверяемый release-candidate packet.
- PR и commit SHA честно помечены как pending до фактического commit/release tag.
- Pilot gate все еще требует real UAT session artifact и interactive review UI.
