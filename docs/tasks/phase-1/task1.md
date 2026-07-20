# Task 1: v2 Scaffolding and WorkerPool Integration

## Objective
Initialize the v2 SvelteKit + Bun architecture and implement the `WorkerManager` singleton using Comlink, strictly adhering to the `01_worker_pool_spec.md` and `ui_worker_contract.md`.

## Prerequisites
- Review `docs/specs/cross_cutting/01_worker_pool_spec.md`.
- Review `docs/contracts/phase-1/ui_worker_contract.md`.

## Implementation Steps

### 1. Initialize SvelteKit with Bun
- Delete `package.json` dependencies relating to npm (if lingering).
- Run `bun create svelte@latest .` (force apply over current directory, select Skeleton project, TypeScript, Tailwind).
- Ensure `vite.config.ts` includes the required headers for SharedArrayBuffer:
  ```typescript
  server: {
      headers: {
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp'
      }
  }
  ```

### 2. Install Worker Dependencies
- Run `bun add comlink @duckdb/duckdb-wasm`
- Run `bun add -D vite-plugin-wasm vite-plugin-top-level-await`

### 3. Implement the Worker Manager
- Create `src/lib/workers/WorkerManager.ts`.
- Implement the Singleton pattern defined in `01_worker_pool_spec.md` that lazily spawns the DuckDB worker.

### 4. Implement the DuckDB Worker Stub
- Create `src/lib/workers/duckdb.worker.ts`.
- Import `expose` from `comlink`.
- Implement a class that satisfies the `DuckDBWorkerContract` (you don't need to implement the actual WASM initialization yet, just stub the methods returning promises).
- Call `expose(new DuckDBService())`.

### 5. Validate on Main Page
- In `src/routes/+page.svelte`, import the `WorkerManager`.
- Add a button that calls `WorkerManager.getDuckDB()` and invokes a stubbed query.
- Verify in the browser DevTools that the worker is successfully spawned upon button click, and that Comlink successfully returns the promise result to the UI.

## Definition of Done
- No npm files exist (`package-lock.json`).
- Clicking the UI button successfully proxies a function call to the Web Worker via Comlink.
- The UI thread remains completely unblocked during the worker call.
