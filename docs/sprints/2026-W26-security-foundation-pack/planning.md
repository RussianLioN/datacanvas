# Planning

Версия процесса: 0.1.0

## Контекст

S20 audit определил security foundation как самый высокий следующий gap: нужны data classification, threat model, incident response, export checklist и secret scan gate. Документы уже частично существовали, но не были связаны отдельным manifest и gate.

## Scope

В scope входят:

- security foundation manifest;
- threat-model delta для S21;
- local secret scan;
- validator security foundation;
- подключение к `npm test`, CI, bootstrap, schema validation, artifact registry и process versioning;
- обновление plan coverage audit.

Вне scope:

- backfill threat-model-delta для всех исторических спринтов;
- внешние security scanners;
- подключение внешнего provider/network.
