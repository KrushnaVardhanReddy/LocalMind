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

### 3.9 Offline API Client (Postman Alternative)
- Local HTTP client using native browser `fetch` (or Tauri proxy where CORS blocks web fetch).
- Supports REST (GET, POST, PUT, DELETE) and GraphQL queries with variables.
- Stores request history and collections in local `wa-sqlite`.

### 3.10 Offline Regex Tester
- Dual-pane regex building UI with real-time match highlighting.
- Evaluates regex in a Web Worker to prevent infinite backtracking from locking the UI thread.
- Displays match capture groups and indices.

### 3.11 JSONPath & `jq` Query Sandbox
- Drop large JSON files (10MB+) and filter them instantly.
- Toggle between pure JS `JSONPath` parsing and WASM-compiled `jq` execution.
- Evaluates within a Web Worker to keep UI responsive.

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

### 3.12 PII Data Sanitizer (JSON/CSV)
- Offline PII redaction for structured data (CSV/JSON).
- Utilizes the existing Transformers.js NER (Named Entity Recognition) worker.
- Scans large files, masks detected PII (like `[REDACTED_PERSON]`), and exports the clean file.

---

## 4. Acceptance Criteria & E2E Test Scenarios

### AC-4.1 JSON/JWT/Base64 Formatters
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User pastes minified JSON and clicks "Format" | Pretty-printed JSON appears in output |
| AC-2 | User pastes an invalid JSON string | Error message: "Invalid JSON at position X" |
| AC-3 | User pastes a valid JWT | Header and payload sections decode and display as formatted JSON |
| AC-4 | User pastes a Base64 string | Decoded text appears in output panel |

### AC-4.2 Data Format Converters
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User pastes JSON and clicks "Convert to YAML" | Valid YAML appears in output |
| AC-2 | User pastes YAML and converts to JSON | Valid JSON appears |
| AC-3 | User pastes XML and converts to JSON | Correct JSON representation appears |

### AC-4.3 Git History Analyzer
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User uploads a `git log` export file | Commit entries render in a timeline/table |
| AC-2 | User filters by author | Only commits from that author are shown |

### AC-4.4 Visual Log Parser
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User uploads a `.log` file | Entries are parsed and shown with severity color coding |
| AC-2 | Anomaly detection runs | Outlier log entries are highlighted |

### AC-4.5 HAR Analyzer
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User uploads a `.har` file | Request/response entries appear in a table |
| AC-2 | User clicks a request row | Detail panel opens with headers and body |

### AC-4.6 PCAP Analyzer
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User uploads a `.pcap` file | Packet entries appear in table after WASM processing |

### AC-4.7 PII Sanitizer
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User pastes JSON with emails and phone numbers | Output shows `[REDACTED]` in place of PII |

### AC-4.8 Mock API Server
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User defines a `GET /api/users` endpoint and starts server | Server becomes active; indicator shows green |

### AC-4.9 Test Data Generator
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User selects a schema and clicks "Generate 10 rows" | A 10-row table/JSON output appears |

### AC-4.10 Visual Regression Diffing
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User uploads two slightly different images | Diff overlay renders highlighting changed pixels |
| AC-2 | User uploads identical images | "0 pixels changed" or "No differences" message |
