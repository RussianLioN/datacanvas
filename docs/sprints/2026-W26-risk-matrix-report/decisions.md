# Decisions

Версия процесса: 0.1.0

## DEC-S16-001

Решение: `risk-matrix.md` является generated review artifact.

Причина: человекочитаемый отчёт должен быть удобен для review, но не должен становиться отдельным источником правды.

## DEC-S16-002

Решение: `validate:risk-matrix` входит в общий gate.

Причина: report не должен расходиться с registry, risk traceability и requirements traceability.
