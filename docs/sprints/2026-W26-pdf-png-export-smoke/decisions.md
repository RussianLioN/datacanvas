# Decisions

## DEC-S27-001: Smoke Fixture До Toolchain

PDF/PNG smoke добавляется как deterministic fixture, а не как полноценный renderer. Это снижает риск premature dependency choice.

## DEC-S27-002: Manifest С SHA-256

Каждый smoke output фиксируется в `export-smoke-manifest.json` с SHA-256 и файловой сигнатурой.

## DEC-S27-003: HTML Остается Canonical Source

Smoke artifacts генерируются после HTML baseline и ссылаются на `artifacts/examples/presentation-minimal.html`.
