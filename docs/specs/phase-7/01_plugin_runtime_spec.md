# Phase 7: Custom WASM Plugin Runtime — Specification

## 1. Overview
Phase 7 transforms LocalMind from a fixed-feature tool into an **extensible platform**. Users can bring their own compiled WASM modules to process proprietary data formats that LocalMind does not natively support. This is the "BYOW" (Bring Your Own WASM) capability.

## 2. Core Capabilities

### 2.1 WASM Module Loading
- Users can upload a `.wasm` binary compiled from their own C, C++, or Rust code.
- The runtime validates the module before execution:
  - Check that it exports a known entry-point function (`localmind_process`).
  - Enforce a sandboxed WASM environment — no filesystem, no network, no shared memory outside of the explicitly provided input buffer.
- The module runs in a dedicated Web Worker (managed via `WorkerPool`) — isolated from all other workers and the UI.

### 2.2 Plugin I/O Contract
All LocalMind-compatible WASM plugins must implement the following ABI:

```c
// Plugin must export this function.
// - input_ptr: pointer to the input file bytes in WASM linear memory
// - input_len: length of input bytes
// - output_ptr: pointer to an output buffer allocated by the plugin
// - output_len: pointer to the output buffer length
// Returns 0 on success, non-zero error code on failure.
int32_t localmind_process(
  uint8_t* input_ptr,
  uint32_t input_len,
  uint8_t** output_ptr,
  uint32_t* output_len
);

// Plugin must export its human-readable name and version.
const char* localmind_plugin_name();
const char* localmind_plugin_version();
```

### 2.3 Data Pipelines
- Drop a proprietary file → select a loaded WASM module → run it → see the output (text, structured data, or a downloadable binary).
- If the plugin output is valid JSON or CSV, LocalMind automatically offers to load it into the Data Workspace for SQL querying.

### 2.4 Plugin Marketplace *(Future)*
- A community-driven registry of open-source, audited WASM modules for niche data formats (e.g., proprietary sensor formats, custom binary logs, legacy file types).
- Plugins are distributed as `.wasm` + a `manifest.json` describing the plugin name, version, author, input formats, and output type.
- All marketplace plugins are open-source and their source is linked in the manifest. Users can audit the source before running.

## 3. Security Model
- **Sandboxed execution**: WASM modules have no access to WASM imports beyond a minimal set (memory allocation helpers). No filesystem, no network, no DOM, no other workers.
- **Memory limits**: Plugin WASM instances are limited to **256MB of linear memory**. Exceeding this causes the worker to terminate gracefully.
- **Timeout**: Plugin execution is limited to **60 seconds**. If the plugin does not complete, the WorkerPool terminates the worker.
- **No persistence**: Plugin code is not saved between sessions unless the user explicitly re-uploads it. Plugins cannot write to IndexedDB or OPFS.
- **Audit trail**: Before a plugin runs, a consent dialog shows the plugin's name, version, author, and source link (if available from the manifest). The user must explicitly approve each first-time plugin execution.

## 4. Architecture
- Plugin workers are managed via the existing `WorkerPool` under a dynamic key (e.g., `plugin:my-sensor-parser`).
- The runtime uses the `WebAssembly.instantiate` API to load and compile the user-provided module in the worker thread.

## 5. Task Reference
See `docs/tasks/phase-7/`.
