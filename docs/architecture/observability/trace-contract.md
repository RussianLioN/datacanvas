# Trace Contract

Статус: draft

## Обязательные Spans

- `input_validation`
- `normalization`
- `model_call`
- `presentation_spec_validation`
- `render`
- `export`
- `qa`
- `handoff`

## Обязательные Поля

- `run_id`
- `sprint_id`
- `increment_id`
- `artifact_id`
- `status`
- `duration_ms`
- `cost_estimate`
- `model`
- `provider`
- `retry_count`
- `error_class`
- `schema_version`
