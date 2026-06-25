# Export Sanitization Checklist

Перед приемкой export проверить:

- Нет secrets.
- Нет PII без явного разрешения.
- Нет raw traces.
- Нет hidden notes.
- Нет local paths.
- Нет internal prompts.
- Нет tool outputs.
- Нет неподтвержденных claims.
- Все видимые claims связаны с claim map.
