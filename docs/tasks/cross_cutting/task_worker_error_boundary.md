TASK: Robustness Wave — CI-4: Worker Error Boundary & Crash Recovery

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Implement a global error boundary that catches WASM worker crashes, OOM errors, and malformed-input failures — showing a user-friendly recovery UI instead of a silently frozen page.

Spec (READ ONLY — implement from it, never edit):
  docs/specs/cross_cutting/06_worker_error_boundary_spec.md

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Catch unhandled `error` and `messageerror` events on every worker.
- Emit a typed `WorkerCrashEvent` to a global Svelte store (`workerCrashes`).
- Show a bottom-right toast on crash. Auto-dismiss after 10s.
- "Restart Worker" terminates and re-initializes the worker (and re-registers OPFS virtual files for DuckDB).
- Detect OOM via 30s timeout and show specific warning.
- Wrap root `+layout.svelte` in Svelte error boundary.

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `src/lib/services/WorkerManager.ts`
- `src/routes/+layout.svelte`
- `src/lib/stores/workerHealth.store.ts` (to be created)
- `src/lib/components/WorkerErrorToast.svelte` (to be created)

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
- Dependencies: Svelte 5 and Tailwind are already installed. No external toast library.
- Store: Export `export const workerCrashes = writable<WorkerCrashEvent[]>([])`.
- Svelte Error Boundary: Wrap the main layout logic to capture uncaught synchronous UI errors.
- OOM Timeout: Use `Promise.race` inside the `WorkerManager` query dispatcher to detect a 30s timeout on heavy queries.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. CREATE: `src/lib/stores/workerHealth.store.ts`
2. CREATE: `src/lib/components/WorkerErrorToast.svelte`
3. MODIFY: `src/lib/services/WorkerManager.ts`
4. MODIFY: `src/routes/+layout.svelte`

Commit: "feat: CI-4 worker error boundary and crash recovery"
Target branch: feature/dev
