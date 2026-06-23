# Decisions

## DEC-S40-001

Regression pack строится из существующих deterministic artifacts: `presentation-spec-minimal`, `render-result-minimal`, `export-smoke-manifest`.

## DEC-S40-002

Для PDF/PNG пока проверяются signature, hash и non-empty binary, потому что полноценный renderer engine еще не подключен.
