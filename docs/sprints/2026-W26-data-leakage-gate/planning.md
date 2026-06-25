# Planning

## Scope

Инкремент проверяет выбранные runtime/export/trace/evidence sinks. Он не сканирует policy docs, потому что они описывают запрещенные классы данных и неизбежно содержат такие слова.

## Acceptance Criteria

- Manifest перечисляет проверяемые sinks.
- Validator ловит synthetic probes для secret, pii, local_path, raw_trace, internal_prompt и tool_output.
- Validator падает при находке запрещенного класса в target file.
- Gate входит в `npm test`.
