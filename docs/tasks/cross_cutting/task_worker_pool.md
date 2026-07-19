# Task: WorkerPool Abstraction Layer

## Objective
Implement the `WorkerPool` singleton service that manages all WASM Web Worker lifecycles, replacing all direct `new Worker()` calls in the codebase.

## Spec Reference
`docs/specs/cross_cutting/01_worker_pool_spec.md`

## Prerequisites
- Phase 1 complete.

## Implementation Steps

### 1. Create `WorkerPool.ts`
- Create `src/lib/services/WorkerPool.ts`.
- Implement the `WorkerPool` class with `get()`, `init()`, `terminate()`, and `terminateAll()` methods.
- Implement the worker state machine: `UNINITIALIZED → INITIALIZING → READY → BUSY → ERROR`.
- Implement message routing: maintain a `Map<requestId, { resolve, reject }>` per worker.
- Implement the 30-second timeout watchdog per `send()` call.

### 2. Implement Crash Recovery
- Attach `messageerror` and `unhandledrejection` listeners to every managed worker.
- On crash: reject all pending promises, set state to `ERROR`, emit to a Svelte writable store (`workerErrors`).
- Auto-restart after 2 seconds (max 3 retries before setting `FATAL` state).

### 3. Migrate DuckDB Worker
- Refactor `QueryEngine.ts` to use `workerPool.get('duckdb').send(...)` instead of calling the worker directly.
- Remove any direct `new Worker()` instantiation from `QueryEngine.ts` and Svelte components.

### 4. Add Svelte Store for Worker States
- Export a `workerStates` Svelte readable store that surfaces the current state of each active worker.
- Use this store in the UI to show a status indicator (e.g., green dot = READY, spinner = BUSY, red = ERROR).

### 5. Add Error Toast
- When `workerErrors` store emits, display a dismissible toast with "Engine error. Restarting…" and a manual "Restart Now" button.

## Acceptance Criteria
- [ ] No `new Worker()` call exists outside of `WorkerPool.ts`.
- [ ] DuckDB worker crash is surfaced to the user within 1 second as a visible toast.
- [ ] Auto-restart works: after a forced crash, the engine recovers and accepts queries again.
- [ ] All existing Phase 1 E2E tests continue to pass.
