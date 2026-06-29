# Retro: 2026-W27 Backlog Closure

## Что Сработало

- Baseline до правок отделил отсутствие локальных зависимостей от реального project drift.
- Small-block validation быстро нашла несовпадение eval semantics и слишком строгий sprint backlog parser.
- Generated artifacts обновлялись через штатные генераторы.

## Что Улучшить

- Для будущих sprint-local IDs нужен явный convention, чтобы `TECH-W27-*` не смешивался с central `TECH-*`.
- Release evidence должна иметь шаблон для `pending_pr` состояния, отдельный от merged release-cut evidence.

## Следующее Улучшение

Создать отдельный PCR для backlog/eval closure governance после PR review, если команда принимает этот gate как постоянное правило.
