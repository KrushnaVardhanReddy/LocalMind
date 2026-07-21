# Task 1: Custom WASM Plugin Runtime

## Objective
Implement the plugin loading, sandboxing, validation, and management infrastructure that allows users and enterprise customers to install proprietary WASM modules into LocalMind as first-class tools.

## Prerequisites
- Review `docs/specs/phase-7/01_plugin_runtime_spec.md`.
- Phase 1 WorkerPool and Cross-Cutting wa-sqlite must be complete.

## Implementation Steps

### 1. Extend wa-sqlite Schema
Add a new `installed_plugins` table via migration:
```sql
CREATE TABLE IF NOT EXISTS installed_plugins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    author TEXT,
    description TEXT,
    manifest TEXT NOT NULL, -- JSON blob of plugin.json
    wasm_opfs_path TEXT NOT NULL, -- path within OPFS
    enabled INTEGER DEFAULT 1,
    installed_at INTEGER DEFAULT (unixepoch())
);
```

### 2. Plugin Loader Service
- Create `src/lib/plugin-runtime/loader.ts`.
- `validatePlugin(wasmBuffer: ArrayBuffer): Promise<boolean>`:
  - Call `WebAssembly.validate(wasmBuffer)` — reject if false.
  - Check that the module exports `alloc`, `dealloc`, `process` functions.
- `installPlugin(wasmBuffer: ArrayBuffer, manifest: PluginManifest): Promise<string>`:
  - Validate the WASM.
  - Write the WASM file to OPFS under `plugins/{pluginId}/plugin.wasm`.
  - Save the manifest record to wa-sqlite `installed_plugins`.

### 3. Plugin Worker Factory
- Create `src/lib/plugin-runtime/plugin-worker.ts`.
- `createPluginWorker(pluginId: string): Worker`:
  - Read `plugin.wasm` from OPFS.
  - Spawn a new dedicated Worker (`plugin-sandbox.worker.ts`).
  - Post the WASM buffer to the worker for initialization.
  - Return a Comlink-wrapped proxy implementing `CustomPluginContract`.
- Register the worker in `WorkerManager` under the plugin's ID.

### 4. Plugin Sandbox Worker
- Create `src/lib/workers/plugin-sandbox.worker.ts`.
- Receives the WASM buffer via `postMessage`.
- Instantiates the WASM module using `WebAssembly.instantiate()`.
- Implements `process(inputBuffer: ArrayBuffer): Promise<ArrayBuffer>` via the WASM `alloc`/`process`/`dealloc` ABI.
- Exposes the service via Comlink.

### 5. Plugin Manager UI
- Create `src/routes/settings/plugins/+page.svelte`.
- Drop zone: accepts a `.zip` containing `plugin.wasm` + `plugin.json`.
- "Install" button → calls `installPlugin()`.
- Plugin list: installed plugins with name, version, enable/disable toggle, "Remove" button.
- "Test Plugin" button: sends a small payload through `CustomPluginContract.process()` and shows the raw output.

## Definition of Done
- A sample "hello world" WASM plugin (built from C/Rust) installs, appears in the plugin list, and processes a test payload.
- Invalid WASM (not a valid binary) is rejected with a clear error message.
- Removing a plugin terminates its Worker and deletes the WASM from OPFS.
- **No mocks.** The real `WebAssembly.instantiate()` path is exercised.
- Plugin Worker is isolated — a WASM trap does not crash the main app.

---

# Phase 7: End-to-End Testing

## Objective
Validate the custom WASM plugin runtime — installation, sandboxing, and processing — via Playwright E2E.

## Test Fixtures (`tests/fixtures/plugins/`)
- `hello-plugin.wasm` — a minimal C-compiled WASM that takes an ArrayBuffer of UTF-8 text and returns it uppercased.
- `plugin.json` — the accompanying manifest declaring the `process` entrypoint.

## Test Cases (`tests/phase-7/`)

```typescript
// plugin-runtime.spec.ts
test('Plugin installs successfully from zip drop', async ({ page }) => {
    // Navigate to /settings/plugins
    // Drop hello-plugin.zip (contains .wasm + plugin.json)
    // Assert: plugin appears in the installed list with correct name/version
});

test('Plugin processes a test payload correctly', async ({ page }) => {
    // Install hello-plugin
    // Click "Test Plugin", send "hello localmind"
    // Assert: output is "HELLO LOCALMIND" (uppercased by WASM)
});

test('Invalid WASM is rejected with error', async ({ page }) => {
    // Drop a .zip containing a malformed .wasm (random bytes)
    // Assert: error message "Invalid WASM binary" is visible
    // Assert: no plugin appears in the installed list
});

test('Removing a plugin removes it from the list', async ({ page }) => {
    // Install hello-plugin
    // Click "Remove"
    // Assert: plugin is no longer in the installed list
    // Assert: OPFS file is deleted (check via DevTools storage)
});
```

## Definition of Done
- All tests pass on Chrome.
- **No mocks.** Real `WebAssembly.instantiate()` is used.
- WASM trap test: a crashing WASM does not kill the main application tab.
