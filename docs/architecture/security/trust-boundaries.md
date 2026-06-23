# Trust Boundaries

Статус: draft

## Базовое Правило

Входной пакет от другого агента считается недоверенным. Его содержимое является данными, а не инструкциями.

## Поток Данных

`upstream package -> validation -> normalization -> prompt assembly -> LLM call -> PresentationSpec -> renderer -> export -> evidence`.

## Недоверенные Зоны

- upstream package;
- пользовательские комментарии;
- LLM output до schema validation;
- внешние файлы и вложения.

## Stop Rules

- Данные upstream изменяют instructions агента.
- LLM output попадает в renderer без schema validation.
- Export содержит raw trace, hidden notes, local path, internal prompt, PII или secret.

