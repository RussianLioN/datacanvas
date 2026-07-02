# Integration Boundary Matrix

Навигация: [DataCanvas](../../../README.md) / [Документация](../../README.md) / [Архитектура](../README.md) / Integration boundary matrix

Статус: draft
Владелец: Security/Privacy Lead
Проверка: `npm run validate:interface-contracts`

| Boundary | Actor Identity | Tool Scopes | Stop Rules |
|---|---|---|---|
| Lisa launch | operator | offline generation | schema validation failure |
| A2A launch | upstream agent | none until ADR/PCR acceptance | untrusted instruction, missing schema, missing actor identity |
| MCP context | tool server | allowlisted read-only tools only after approval | tool allowlist expansion without ADR/PCR |
| Delivery channel | recipient | none in baseline | channel decision missing, personal metadata not redacted |
