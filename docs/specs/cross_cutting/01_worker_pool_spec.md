# Cross-Cutting: WorkerPool Specification

## 1. Overview
The `WorkerPool` is a singleton service (`src/lib/services/WorkerPool.ts`) that acts as the **single point of contact** between the SvelteKit UI and all WASM Web Workers. No Svelte component may instantiate a `Worker` directly — all worker communication flows through this service.

This abstraction is necessary because LocalMind will eventually manage 10+ concurrent WASM workers across phases. Without a centralized manager, each phase would reinvent lifecycle management, error handling, and message routing independently.

## 2. Worker Lifecycle States

```
UNINITIALIZED → INITIALIZING → READY → BUSY → ERROR
                                   ↑___________|   (auto-restart attempt)
```

| State | Description |
|---|---|
| `UNINITIALIZED` | Worker has not been spawned yet |
| `INITIALIZING` | Worker script is loading, WASM module compiling |
| `READY` | Worker is idle and ready to accept messages |
| `BUSY` | Worker is processing a request |
| `ERROR` | Worker has crashed or timed out |

## 3. API Contract

```typescript
// src/lib/services/WorkerPool.ts

type WorkerKey =
  | 'duckdb'
  | 'tesseract'
  | 'ffmpeg'
  | 'whisper'
  | 'onnx'
  | 'mupdf'
  | 'treesitter'
  | 'webllm'
  | 'pyodide';

interface WorkerHandle {
  key: WorkerKey;
  state: 'UNINITIALIZED' | 'INITIALIZING' | 'READY' | 'BUSY' | 'ERROR';
  send<TReq, TRes>(action: string, payload: TReq): Promise<TRes>;
  terminate(): void;
}

class WorkerPool {
  get(key: WorkerKey): WorkerHandle;
  init(key: WorkerKey): Promise<void>;
  terminate(key: WorkerKey): void;
  terminateAll(): void;
}

export const workerPool: WorkerPool;
```

## 4. Message Routing

All messages follow the envelope format defined in `docs/contracts/phase-1/ui_worker_contract.md`:
- Requests carry a UUID `id` and an `action` string.
- Responses carry the matching `id`, a `status` of `SUCCESS` or `ERROR`, and a `data` or `error` field.
- The WorkerPool maintains a `Map<id, Promise>` to correlate responses back to their originating requests.

## 5. Error & Crash Recovery

- The WorkerPool listens for `messageerror` and `unhandledrejection` on every Worker it manages.
- On crash: set state to `ERROR`, reject all pending promises for that worker with a descriptive error, emit a Svelte store event so the UI can show a recovery toast.
- **Auto-restart**: After 2 seconds, attempt to re-initialize the worker. If re-initialization fails 3 times consecutively, set state to `FATAL` and do not retry.
- **Timeout**: If a `send()` call does not receive a response within **30 seconds**, it is treated as a timeout crash and triggers the same crash recovery flow.

## 6. Usage Example

```typescript
// In a Svelte component or store — NOT constructing Worker directly
import { workerPool } from '$lib/services/WorkerPool';

const result = await workerPool.get('duckdb').send('EXECUTE_QUERY', {
  query: 'SELECT COUNT(*) FROM products',
});
```

## 7. Phase Rollout

| Phase | Workers Added |
|---|---|
| Phase 1 (done) | `duckdb` |
| Phase 2 | `tesseract`, `mupdf` |
| Phase 3 | `ffmpeg`, `whisper`, `magick` |
| Phase 4 | `treesitter` |
| Phase 5 | `webllm`, `onnx` |
