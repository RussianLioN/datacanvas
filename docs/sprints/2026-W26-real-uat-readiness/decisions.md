# Decisions: Real UAT Readiness

## DEC-S31-001: Template Не Evidence

`human-review-session-real.template.json` имеет `status=template`. Он не может считаться приемочным evidence.

## DEC-S31-002: Optional Real File Check

Validator проходит readiness без `human-review-session-real.json`, но если файл появился, проверяет его как real evidence и запрещает placeholders.
