# Sprint Planning: Visual Baseline And LLM Boundary

Дата: 2026-06-22
Версия процесса: `0.1.0`

## Входы

- Sprint 4 evidence: `docs/sprints/2026-W26-renderer-baseline/sprint-evidence-manifest.json`
- HTML export: `artifacts/examples/presentation-minimal.html`
- Render result: `artifacts/examples/render-result-minimal.json`
- PresentationSpec: `tests/golden/presentation-spec-minimal.json`

## Ограничения

- Реальный LLM не подключается.
- PDF/PNG export не реализуется; фиксируется стратегия и gates.
- Visual baseline является структурной проверкой HTML, не screenshot regression.

