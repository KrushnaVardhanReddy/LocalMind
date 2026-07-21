# Task 5.6: HAR File Analyzer

## Objective
Implement a local HTTP Archive (HAR) file analyzer that parses and visualizes API request waterfalls, identifies slow requests, large payloads, and potential security issues (exposed tokens, auth headers) — without leaking sensitive data anywhere.

## Prerequisites
- Review `docs/specs/phase-4/01_devtools_engine_spec.md`.
- Phase 1 DuckDB worker must be complete.

## Implementation Steps

### 1. HAR Parsing (No WASM Needed)
- HAR files are standard JSON — parse directly on the main thread using `JSON.parse()`.
- Create `src/lib/utils/har-parser.ts`:
  - Input: `File` object.
  - Extract: `log.entries` → array of `{ url, method, status, startedDateTime, timings, request.headers, response.bodySize }`.
  - Load into DuckDB as an `entries` table via `WorkerManager.getDuckDB()`.

### 2. Security Scan
- After parsing, scan all request headers for:
  - `Authorization: Bearer ...` — flag as "Auth Token Exposed in HAR".
  - `Cookie: ...` — flag as "Session Cookie Exposed in HAR".
  - `X-Api-Key: ...` — flag as "API Key Exposed in HAR".
- Display a collapsible security findings panel with severity (HIGH / MEDIUM / LOW) if any are found.

### 3. Build the HAR UI
- Create `src/routes/devtools/har/+page.svelte`.
- Privacy warning banner: "⚠️ HAR files contain your browser's network traffic, including auth tokens and cookies. This file is processed entirely locally."
- Summary row: total requests, total transfer size, page load time (time from first to last request).
- **Waterfall Chart:**
  - Y-axis: request URL (truncated to 60 chars).
  - X-axis: time (ms) from start of capture.
  - Each row is a horizontal bar split into WASM-colored segments: DNS, Connect, TLS, Wait (TTFB), Download.
  - Color-code bars by status: green = 2xx, yellow = 3xx, red = 4xx/5xx.
- **Filters:** filter by method (GET/POST/etc.), domain, status code range.
- **Request Inspector:** click a request row → right panel shows: URL, headers (with sensitive values masked by default), response size, timing breakdown.
- SQL panel: exposes the DuckDB `entries` table for custom queries.

## Definition of Done
- Loading a HAR file with 300 requests renders the full waterfall within 2 seconds.
- Clicking a request row shows its headers with auth tokens masked by default.
- The security panel detects and flags an `Authorization` header in the HAR.
- **No mocks.** Real DuckDB holds the entry data; all analysis is local.
- Privacy warning is always visible.
