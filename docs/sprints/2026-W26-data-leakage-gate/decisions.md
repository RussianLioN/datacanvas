# Decisions

## DEC-S41-001

Gate сканирует selected sinks, а не весь репозиторий, чтобы не получать ложные срабатывания на security policy docs.

## DEC-S41-002

Regex detection conservative: он достаточен для bootstrap gate, но не заменяет ручную privacy review реальных пользовательских данных.
