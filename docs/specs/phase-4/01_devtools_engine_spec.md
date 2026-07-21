# Spec: Phase 4 — LocalMind DevTools (Developer Utilities Engine)

## 1. Overview
LocalMind DevTools is the third core product vertical, providing a suite of offline utilities for engineers, QA testers, and security researchers. All processing (parsing, validation, diffing, log analysis) happens locally in WASM-powered Web Workers.

## 2. WASM Engines

| Engine | Package | Purpose |
|---|---|---|
| DuckDB WASM | `@duckdb/duckdb-wasm` | SQL on JSON/CSV logs |
| tree-sitter WASM | `web-tree-sitter` | Incremental code parsing (40+ languages) |
| pixelmatch | `pixelmatch` | Pixel-level image diffing |
| Mock Service Worker | `msw` | In-browser mock API server |
| ONNX Runtime Web | `onnxruntime-web` | Local embeddings for log anomaly clustering |

## 3. Sub-Tools Architecture

### 3.1 JSON/JWT/Base64 Validator & Formatter
- Pure JavaScript — no WASM needed.
- JSON: parse with `JSON.parse()`, format with `JSON.stringify(null, 2)`, validate against a JSON Schema draft-07.
- JWT: base64url-decode header + payload; display as formatted JSON; validate signature structure.
- Base64: encode/decode strings and binary blobs; detect encoding type automatically.

### 3.2 Data Format Converters
- JSON ↔ YAML ↔ XML: use `js-yaml` and `fast-xml-parser`.
- Streaming: large files must be processed in chunks via a ReadableStream.

### 3.3 Code Analysis (tree-sitter)
- Parse source files for: TypeScript, JavaScript, Python, Go, Rust, C/C++, Java.
- Extract: functions, classes, imports, complexity metrics.
- Render: file structure as a collapsible tree.

### 3.4 Visual Log Parser
- User drops a log file → DuckDB WASM loads it as raw text.
- User highlights a line pattern → auto-generate regex → DuckDB parses the log using the regex.
- Anomaly clustering: embed log lines via ONNX → k-means cluster locally → highlight outliers.

### 3.5 Visual Regression Diffing
- Two images in → pixelmatch computes pixel delta → render overlay with diff heatmap.
- Report: total pixels changed, % of image changed, bounding box of diff region.

### 3.6 Test Data Generator
- User drops a JSON schema or SQL DDL → generate N rows of realistic fake data locally.
- Use `@faker-js/faker` seeded with a deterministic seed for reproducibility.

### 3.7 Local Mock API Server (Service Worker)
- User drops an OpenAPI spec → parse with `@readme/openapi-parser`.
- Register mock handlers via Mock Service Worker that intercept `fetch()` calls from the app.
- Return realistic synthetic responses based on the spec's `example` fields.

### 3.8 HAR File Analyzer
- Drop a `.har` file → parse the JSON structure → render a waterfall chart of requests.
- Highlight: slow requests, large payloads, failed requests, cookie/auth token leakage warnings.

## 4. Worker Contracts
See `docs/contracts/phase-4/`:
- `treesitter_worker_contract.md`
- `log_parser_worker_contract.md`

## 5. Invariants
1. **No tool makes an outbound network request** — all processing is offline by default.
2. **HAR files may contain API keys and auth tokens** — display a privacy warning before rendering.
3. **tree-sitter grammars are lazy-loaded** — only fetch the grammar for the language detected in the dropped file.
4. **Diff images are never stored** — they are rendered in-memory and discarded on tab close.
5. **The mock API server is scoped to the current tab** — MSW intercepts only fetch calls from the LocalMind origin.
