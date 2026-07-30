# Architecture Overview

LocalMind is built on a modern, highly concurrent web stack designed to process gigabytes of data without ever freezing the UI or leaking data to the cloud.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | SvelteKit + Svelte 5 (Runes) | Compile-time reactivity, minimal bundle, `$state`/`$props` |
| **Runtime / Build** | Bun | Fast installs, native TypeScript, single binary |
| **Multithreading** | Web Workers + Comlink | RPC-style off-main-thread execution |
| **Storage** | wa-sqlite + OPFS + IndexedDB | High-performance virtual filesystem; persists across sessions |
| **Styling** | Tailwind CSS + custom glassmorphism tokens | Dark mode, responsive, design system |
| **Testing** | Vitest (unit) + Playwright (E2E + a11y) | Full-stack coverage; no mocking in E2E |
| **CI/CD** | GitHub Actions | Build, type-check, unit tests, E2E, bundle size guard on every PR |

---

## The "Main Thread" Rule

In traditional web apps, data processing on the main thread causes frozen UIs and browser crashes. **In LocalMind, zero heavy processing occurs on the main thread.**

1. The Svelte UI only handles rendering and event binding.
2. All business logic, file parsing, WASM execution, and AI inference runs in **dedicated Web Workers**.
3. We use `Comlink` to call Worker functions as if they were local async classes — no raw `postMessage` boilerplate.

---

## The Zero-Copy Pipeline

Moving large files (1GB CSV, 500MB video) from UI to a Worker is done via **Transferable Objects** — never `FileReader.readAsArrayBuffer()` on the main thread (which would OOM the browser).

```
User drops file
      │
      ▼
Svelte UI (main thread)
  ├─ Passes raw File handle via Comlink.transfer()
  └─────────────────────────┐
                            ▼
                    DuckDBWorker (Web Worker)
                      ├─ Streams file chunk-by-chunk into DuckDB WASM
                      ├─ Runs SQL query
                      └─ Returns typed result via Comlink (small payload)
```

---

## The Worker Pool (WorkerManager)

`src/lib/services/WorkerManager.ts` is a singleton that manages all WASM workers with lazy initialization:

```
WorkerManager
  ├── getDuckDB()      → DuckDB WASM (SQL analytics)
  ├── getTesseract()   → Tesseract WASM (OCR)
  ├── getFFmpeg()      → FFmpeg WASM (video/audio)
  ├── getWebLLM()      → WebLLM (local AI via WebGPU)
  ├── getMuPDF()       → MuPDF WASM (PDF tools)
  ├── getTreeSitter()  → tree-sitter WASM (code parsing)
  └── getPyodide()     → Pyodide WASM (Python runtime) [MVP3]
```

Workers are initialized JIT — if a user never opens the Docs workspace, Tesseract is never downloaded.

---

## Worker Error Boundary

All workers emit typed `WorkerCrashEvent` errors to the `workerHealth` Svelte store. A global `WorkerErrorToast` component in `+layout.svelte` catches these and shows a recovery UI — never a silent freeze. `WorkerManager.restart(name)` re-initializes a crashed worker and re-registers any OPFS-backed virtual files.

---

## The Session System

`SessionManager` (`src/lib/services/SessionManager.ts`) captures the full workspace state — pivot config, SQL history, AI summaries, file references — into a `LocalMindSession` object persisted to wa-sqlite and exportable as a `.lm` file.

```
LocalMindSession (.lm)
  ├── version: 1
  ├── workspace: 'analytics'
  ├── analytics.pivotConfig   → full PivotBuilder shelf state
  ├── analytics.sqlHistory    → last 20 queries
  ├── analytics.aiSummary     → last AI insight text
  └── fileRefs[]              → filenames + OPFS paths
```

Sessions are auto-saved every 30s and can be exported/imported as portable `.lm` files.

---

## Security Architecture

### Cross-Origin Isolation
`SharedArrayBuffer` (required by DuckDB for multi-threaded queries) requires:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

These are set in `vite.config.ts` (dev) and `public/_headers` (Cloudflare Pages production).

### Content Security Policy
A strict CSP blocks any unauthorized network requests — even from malicious WASM plugins or XSS:
- `connect-src` whitelist: only known AI provider domains (OpenAI, Anthropic, Google).
- `script-src 'wasm-unsafe-eval'` — required for all WASM modules.
- `frame-src 'none'` — prevents clickjacking.

### API Key Safety
AI API keys are held **in-memory only** during the session — never written to `localStorage` or any persistent store.

---

## WASM Loading & Cache Strategy

### Lazy Loading (JIT)
WASM bundles are downloaded only when first needed. The initial app load is ~200KB. DuckDB (10MB) loads when the user first drops a file.

### Service Worker Caching
Once a WASM bundle is downloaded, the PWA Service Worker caches it with a versioned cache key (`wasm-cache-v1.x.x`). Subsequent loads — even offline — serve from Cache Storage instantly. Cache is purged on `APP_VERSION` bump to ensure WASM updates reach users.

---

## Routing Architecture (Post UX-1)

```
/                   → Workspace Launcher Dashboard (WorkspaceNav)
/analytics          → Analytics Workspace (DuckDB, PivotBuilder, ECharts)
/docs               → Docs Workspace (OCR, PDF Tools, Semantic Search)
/annotate           → Annotate Workspace (Canvas-based image annotation) [MVP3]
/diagrams           → Diagrams Workspace (Mermaid/D3 generation) [MVP3]
/devtools           → DevTools Workspace (tree-sitter, HAR, Log Parser)
```

All routes use `export const ssr = false` — LocalMind is a pure client-side app. The SvelteKit adapter targets static hosting (Cloudflare Pages).
