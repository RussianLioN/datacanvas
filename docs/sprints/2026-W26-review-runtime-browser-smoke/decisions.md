# Decisions

## DEC-S60-001: Не добавлять browser dependency

Решение: не добавлять Playwright/Puppeteer в этот инкремент.

Причина: текущий репозиторий использует lightweight Node validators без browser dependency. Static smoke повышает проверяемость без сетевой установки и без расширения runtime footprint.

Ограничение: pixel screenshot assertions остаются будущим отдельным инкрементом.
