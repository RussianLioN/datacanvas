# Sprint Goal: Artifact Registry Hash Linkage

Цель инкремента: связать artifact registry с generated hash manifest так, чтобы требование owner/status/sprint/hash было проверяемым через единый governance gate.

Done when:

- registry содержит hash manifest path, algorithm и snapshot policy;
- registry validator проверяет hash coverage для всех registered artifacts;
- bootstrap и schema validation учитывают новые поля;
- limitation по самореферентному hash явно описан.
