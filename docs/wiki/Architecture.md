# Architecture Overview

LocalMind is built on a modern, highly concurrent web stack designed to process gigabytes of data without ever freezing the UI.

## Tech Stack
- **Framework:** SvelteKit (Fast, compile-time reactivity, minimal bundle size)
- **Runtime/Bundler:** Bun (Blazing fast builds and native TypeScript support)
- **Multithreading:** Web Workers + Comlink (RPC-style communication)
- **Storage:** wa-sqlite + OPFS (High-performance virtual filesystem)
- **Styling:** Tailwind CSS + custom glassmorphism design system

## The "Main Thread" Rule
In traditional web apps, data processing happens on the main thread, leading to frozen UI and unresponsive pages. 
**In LocalMind, zero heavy processing occurs on the main thread.**

1. The Svelte UI only handles rendering and event binding.
2. All business logic, file parsing, WASM execution, and AI inference happens inside dedicated Web Workers.
3. We use `Comlink` to seamlessly call Worker functions as if they were local asynchronous classes.

## The Zero-Copy Pipeline
To move large files (like a 1GB CSV or a 500MB Video) from the UI to a Worker, we do NOT use `FileReader.readAsArrayBuffer()` on the main thread. Doing so would crash the browser memory limit.

Instead, we use **Transferable Objects**. We pass the raw `File` handle directly to the Worker. The Worker then streams the file chunk-by-chunk into the WASM engine (like DuckDB or FFmpeg).

## The Worker Pool
LocalMind manages a singleton `WorkerManager` that spins up specialized workers only when needed (Lazy Loading).
- `DuckDBWorker` — Data queries.
- `TesseractWorker` — OCR.
- `FFmpegWorker` — Video/Audio.
- `WebLLMWorker` — AI Intelligence.

If a user never visits the Media tab, the 30MB FFmpeg WASM payload is never downloaded.

## Cross-Origin Isolation
To enable `SharedArrayBuffer` (which DuckDB requires for multi-threaded queries), LocalMind enforces strict HTTP headers in production:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
