# Task 1: Scaffolding and Web Worker Integration

## Objective
Establish the foundational SvelteKit architecture and implement the basic UI-to-Worker communication layer for DuckDB WASM, strictly adhering to the `ui_worker_contract.md`.

## Prerequisites
- Review `docs/specs/phase-1/01_data_ingestion_spec.md`.
- Review `docs/specs/phase-1/02_query_engine_spec.md`.
- Review `docs/contracts/phase-1/ui_worker_contract.md`.

## Implementation Steps

### 1. Initialize SvelteKit Project (If not already done)
- Ensure the project is set up with SvelteKit, TypeScript, and Tailwind CSS.
- Configure Vite (`vite.config.ts`) with COOP/COEP headers required for SharedArrayBuffer and WASM isolation:
  ```javascript
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp'
  }
  ```

### 2. DuckDB Worker Setup
- Install `@duckdb/duckdb-wasm`.
- Create a dedicated Web Worker file (e.g., `src/lib/workers/duckdb.worker.ts`).
- Implement the initialization logic to load the DuckDB WASM bundles (async instantiation).

### 3. Implement Message Router
- In `duckdb.worker.ts`, implement an event listener for `message` events.
- Route incoming messages based on the `action` field (`INIT`, `LOAD_FILE`, `EXECUTE_QUERY`) as defined in the UI-Worker Contract.
- Ensure responses wrap the data or errors in the `WorkerResponse` format and return the matching `id`.

### 4. Create UI Worker Client (Svelte Store/Service)
- Create a TypeScript class or Svelte Store in `src/lib/services/QueryEngine.ts`.
- This service should manage the lifecycle of the Web Worker (`new Worker(...)`).
- Implement a Promise-based wrapper around `postMessage`:
  - Generate a UUID for each request.
  - Store the `resolve`/`reject` callbacks in a Map keyed by the UUID.
  - Send the message to the worker.
  - When the worker responds, look up the UUID, resolve/reject the Promise, and delete the entry from the Map.

### 5. Basic UI Verification
- Create a simple Svelte component (`src/routes/+page.svelte`).
- Add a button to initialize the engine.
- Execute a simple hardcoded test query (e.g., `SELECT 42 as answer`) via the Worker Client to verify the end-to-end pipeline.

## Acceptance Criteria
- [ ] Worker spawns successfully without blocking the main UI thread.
- [ ] Message passing adheres perfectly to the `WorkerMessage` and `WorkerResponse` contracts.
- [ ] The test query successfully returns data from DuckDB WASM back to the Svelte UI.
