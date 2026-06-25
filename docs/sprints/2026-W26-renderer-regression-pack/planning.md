# Planning

## Scope

Инкремент усиливает локальную renderer regression проверку для существующих deterministic fixtures. Он не подключает новый renderer engine и не заменяет real UAT.

## Acceptance Criteria

- Manifest содержит HTML, PDF и PNG cases.
- HTML case проверяет trace markers.
- PDF/PNG cases проверяют signatures и hashes.
- Validator включен в `npm test`.
