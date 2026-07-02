# Interface Control DataCanvas

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Архитектура](../README.md) / [Системный анализ](README.md) / Interface control

Статус: draft
Владелец: AI Agent Architect
Проверка: `npm run validate:interface-contracts`

| ID | Interface | Trust Boundary | Schema | Проверка |
|---|---|---|---|---|
| `IF-001` | Lisa launch adapter | trusted_operator_channel | `schemas/input-package.schema.json` | `npm run validate:schemas` |
| `IF-002` | A2A launch envelope | untrusted_upstream_agent | `schemas/input-package.schema.json` | `npm run validate:interface-contracts` |
| `IF-003` | MCP tool context | untrusted_tool_metadata | `schemas/tool-allowlist.schema.json` | `npm run validate:interface-contracts` |
| `IF-004` | Renderer | validated_presentation_spec | `schemas/presentation-spec.schema.json` | `npm run validate:visual` |
| `IF-005` | Evidence storage | internal_evidence | `schemas/artifact-registry.schema.json` | `npm run validate:artifact-registry` |
