# Decisions: 2026-W27 Backlog Closure

| ID | Решение | Статус | Rationale |
|---|---|---|---|
| DEC-W27-001 | Не добавлять `QA-*`, `SEC-*`, `OPS-*` в central backlog registry | accepted | План предпочитает заменить dangling IDs на существующие `TECH-*`, `EVAL-*`, `PROC-*`, risk/evidence или NFR links. |
| DEC-W27-002 | Не закрывать `TECH-005` | accepted | Смысл ID требует нормализации, поэтому item остается `draft`. |
| DEC-W27-003 | Оставить `PROC-007` в `draft` | accepted | Подключение внешнего LLM/provider вне scope и требует отдельного решения. |
| DEC-W27-004 | Release-cut SHA не перезаписывать | accepted | Current main pointer фиксируется отдельно, чтобы не менять исторический release-cut evidence. |
| DEC-W27-005 | Public reachable leakage scan проверяет secrets, PII и local paths | accepted | Public product docs легитимно называют forbidden-классы как требования, поэтому raw_trace/internal_prompt/tool_output проверяются на sink targets. |
