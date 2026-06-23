# Decisions

Версия процесса: 0.1.0

## DEC-021-001

Security foundation управляется через `security-foundation-manifest.json`.

Причина: список security artifacts и gates должен проверяться машинно, иначе Sprint Review может пропустить отсутствие security evidence.

## DEC-021-002

Secret scan реализован локальным скриптом без внешних зависимостей.

Причина: базовый gate должен работать воспроизводимо в bootstrap-репозитории и не требовать сетевого доступа.
