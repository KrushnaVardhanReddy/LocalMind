# Task 1: Tauri Desktop App Scaffolding

## Objective
Scaffold the Tauri desktop shell around the existing SvelteKit web app, establishing the build pipeline, native filesystem bridge, and platform-specific packaging for macOS, Windows, and Linux.

## Prerequisites
- Review `docs/specs/phase-9/01_tauri_desktop_spec.md`.
- The SvelteKit web app must be stable and all Phase 1–4 features must be passing E2E tests.

## Implementation Steps

### 1. Install Tauri CLI
```bash
bun add -D @tauri-apps/cli @tauri-apps/api
cargo install tauri-cli  # requires Rust installed
```

### 2. Initialize Tauri
```bash
bunx tauri init
```
- Set `distDir`: `../build` (SvelteKit's output).
- Set `devPath`: `http://localhost:5173` (Vite dev server).
- Set app name: `LocalMind`, identifier: `dev.localmind.app`.

### 3. Configure `tauri.conf.json`
Apply the allowlist constraints from `docs/specs/phase-9/01_tauri_desktop_spec.md`:
```json
{
  "allowlist": {
    "all": false,
    "fs": { "readFile": true, "writeFile": true, "readDir": true },
    "dialog": { "open": true, "save": true },
    "notification": { "all": true },
    "shell": { "all": false }
  }
}
```

### 4. Native Filesystem Bridge
- Create `src/lib/tauri-bridge.ts`:
  ```typescript
  import { isTauri } from '@tauri-apps/api/core';

  export async function openFilePicker(accept: string[]): Promise<File | null> {
      if (isTauri()) {
          // Use Tauri dialog.open()
          const path = await open({ filters: [{ name: 'Files', extensions: accept }] });
          // Read via Tauri fs.readFile and construct a File object
      } else {
          // Fall back to window.showOpenFilePicker()
      }
  }
  ```
- Update all file picker calls in the SvelteKit components to use `tauri-bridge.ts` instead of `window.showOpenFilePicker()` directly.

### 5. Build & Package
- Add to `package.json`:
  ```json
  "scripts": {
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
  ```
- Run `bun run tauri:build` to produce:
  - `src-tauri/target/release/bundle/macos/LocalMind.app`
  - `src-tauri/target/release/bundle/windows/LocalMind_x.y.z_x64-setup.exe`
  - `src-tauri/target/release/bundle/linux/localmind_x.y.z_amd64.AppImage`

## Definition of Done
- `bun run tauri:dev` opens the full LocalMind web app in a native Tauri window.
- Opening a file via the native file picker (macOS/Windows dialog) works through the bridge.
- `bun run tauri:build` produces a signed, runnable binary for the host platform.
- **No mocks.** The Tauri shell uses the real Rust backend.
- All existing Playwright E2E tests continue to pass on the web build (Tauri does not break the web).
