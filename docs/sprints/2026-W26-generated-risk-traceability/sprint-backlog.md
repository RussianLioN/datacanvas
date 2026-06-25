# Sprint Backlog

Версия процесса: 0.1.0

## Items

- `TECH-017`: добавить схему `RiskEvidenceMap`.
- `TECH-018`: добавить `risk-evidence-map.json` как явный источник evidence paths.
- `TECH-019`: добавить генератор `risk-traceability.json`.
- `QA-017`: добавить проверку, что текущий `risk-traceability.json` совпадает с результатом генерации.
- `ADR-017`: зафиксировать решение о генерируемой трассировке рисков.
- `ART-066..ART-071`: обновить реестр артефактов и evidence.

## Definition of Done

- Генератор включен в `npm run generate:golden`.
- Проверка включена в `npm test`.
- Bootstrap и schema validation знают о новых артефактах.
- Спринтовый evidence-манифест содержит созданные файлы, проверки, ограничения и следующий безопасный шаг.
