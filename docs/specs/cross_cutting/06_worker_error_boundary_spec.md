# Spec: Worker Error Boundary & Crash Recovery

## Objective
Implement a global error boundary that catches WASM worker crashes, OOM errors,
and malformed-input failures — showing a user-friendly recovery UI instead of a
silently frozen page. This is critical UX: if DuckDB crashes mid-query on a 500M
B CSV, the user should be able to restart the worker and continue rather than lo
sing their session.

## Implementation

### 1. WorkerManager Error Events
Extend `src/lib/services/WorkerManager.ts`:
- Catch unhandled `error` and `messageerror` events on every worker.
- Emit a typed `WorkerCrashEvent` to a global Svelte store:
```typescript
// src/lib/stores/workerHealth.store.ts
export interface WorkerCrashEvent {
  worker: 'duckdb' | 'tesseract' | 'ffmpeg' | 'webllm' | 'mupdf';
  error: string;
  timestamp: number;
  recoverable: boolean; // false for OOM
}
export const workerCrashes = writable<WorkerCrashEvent[]>([]);
```

### 2. Error Toast Component (`src/lib/components/WorkerErrorToast.svelte`)
- Subscribe to `workerCrashes` store.
- When a crash event arrives, show a bottom-right toast:
  > ⚠️ **DuckDB worker crashed** — your query could not complete.
  > [Restart Worker] [Dismiss]
- "Restart Worker" calls `WorkerManager.restart('duckdb')` which terminates and
re-initializes the worker.
- Toast auto-dismisses after 10s if ignored.
- Show at most 1 toast at a time (queue additional crashes).

### 3. WorkerManager.restart(name)
```typescript
async restart(name: WorkerName): Promise<void> {
  await this.terminate(name);
  await this.init(name);
  // Restore virtual files in DuckDB if relevant
}
```
For DuckDB specifically, after restart, re-register any OPFS-backed virtual file
s so the user can re-run their last query.

### 4. OOM Detection
Browsers don't expose OOM errors directly. Detect heuristically:
- If a worker post-message times out after 30s, treat as a crash.
- Show a specific OOM message: "The file may be too large for available memory.
Try a smaller file or use the Desktop version for unlimited memory."

### 5. Global Svelte Error Boundary
Wrap the root `+layout.svelte` in a try/catch with `onError` lifecycle:
- If the main thread throws, show a full-page recovery UI with "Reload app" butt
on.
- Log the error (no PII) to `console.error` and optionally to the consent-gated
telemetry service.

## Acceptance Criteria
- [ ] Simulating a DuckDB worker crash shows the error toast.
- [ ] "Restart Worker" restores DuckDB and re-registers virtual files.
- [ ] OOM timeout (30s) shows the large-file warning message.
- [ ] Main thread uncaught errors show the full-page recovery UI.
- [ ] Unit tests cover `WorkerManager.restart()` state transitions.
- [ ] No PII is captured in error messages.
