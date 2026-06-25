# Decisions

- Closure map не является acceptance.
- Validator должен падать, если blocking file появился, но карта все еще считает его pending.
- Commit/PR evidence остается особым external record, а не локальным файлом.
