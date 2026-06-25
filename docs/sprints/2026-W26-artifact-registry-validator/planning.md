# Planning

Версия процесса: 0.1.0

## Контекст

S17 оставил следующий безопасный шаг: добавить валидатор полноты artifact registry. Без этого `artifact-registry.json` мог содержать несуществующие пути, пропущенные ID или артефакты без доказуемой связи со спринтом.

## Scope

В scope входят:

- `scripts/validate-artifact-registry.mjs`;
- `ADR-018`;
- подключение к `package.json`, CI, README и bootstrap;
- обновление `artifact-registry.json`;
- спринтовый evidence-пакет.

Вне scope:

- миграция artifact registry в базу данных;
- изменение схемы artifact registry;
- автоматическая генерация registry.
