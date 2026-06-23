# Decisions: Review UI Fixture

## DEC-S30-001: Static Fixture First

Для текущего этапа достаточно статического HTML fixture, потому что цель — сделать human review проверяемым артефактом без преждевременного frontend runtime.

## DEC-S30-002: Real UAT Не Подменяется

Session artifact получает `session_kind=fixture`. Настоящий pilot gate должен требовать `session_kind=real_user`.
