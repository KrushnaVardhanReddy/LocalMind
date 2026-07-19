# Task: Phase 7 — WASM Plugin Runtime

## Objective
Implement the BYOW (Bring Your Own WASM) plugin runtime that allows users to load and run custom `.wasm` modules against local files.

## Spec Reference
`docs/specs/phase-7/01_plugin_runtime_spec.md`

## Prerequisites
- WorkerPool abstraction complete (`docs/tasks/cross_cutting/task_worker_pool.md`).

## Implementation Steps

### 1. Plugin Loader Service
- Create `src/lib/services/PluginLoader.ts`.
- Accepts a `.wasm` ArrayBuffer and an optional `manifest.json`.
- Validates exports: checks that `localmind_process`, `localmind_plugin_name`, `localmind_plugin_version` are exported.
- Registers the plugin under a dynamic WorkerPool key: `plugin:<name>`.

### 2. Plugin Worker Template
- Create `src/lib/workers/plugin.worker.ts`.
- Uses `WebAssembly.instantiate` with a minimal import object (memory helpers only — no FS, no network imports allowed).
- Runs with a 256MB memory limit and enforces a 60-second timeout.
- Calls `localmind_process` with the input buffer, reads output from the WASM linear memory.

### 3. Consent Dialog
- Before running a plugin for the first time (keyed by plugin name + version), show a consent dialog:
  - Plugin name, version, author (from manifest if available).
  - Source link (if provided in manifest).
  - "This plugin runs locally. It has no network or filesystem access." confirmation.
  - "Run Plugin" / "Cancel" buttons.

### 4. Plugin Workspace UI
- Create `src/routes/plugins/+page.svelte`.
- Upload zone for `.wasm` + optional `manifest.json`.
- List of loaded plugins with name, version, status.
- For each loaded plugin: file picker for input data + "Run" button.
- Output viewer: if JSON/CSV → offer to open in Data Workspace. Otherwise → download button.

### 5. Result Passthrough to Data Workspace
- If plugin output is valid JSON or CSV, emit a Svelte store event that the Data Workspace listens to.
- Data Workspace opens automatically with the plugin output pre-loaded.

## Acceptance Criteria
- [ ] A valid WASM plugin (with correct exports) loads and runs against a local file.
- [ ] An invalid WASM module (missing exports) is rejected with a clear error message.
- [ ] Plugin execution is terminated after 60 seconds with a user-visible timeout message.
- [ ] Consent dialog appears on first run of each unique plugin name+version.
- [ ] No network access is possible from within the plugin (verify by attempting to call a WASM import that makes a fetch — should be blocked by the minimal import object).
