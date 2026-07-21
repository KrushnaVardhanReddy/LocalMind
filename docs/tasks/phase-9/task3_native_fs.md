# Task 3: Native File System Integration

## Objective
Implement deep native filesystem integration in the Tauri desktop app — directory watching, drag-from-Finder/Explorer support, and direct save-to-disk without "Save As" dialogs — giving power users a seamless desktop data experience.

## Prerequisites
- Review `docs/specs/phase-9/01_tauri_desktop_spec.md`.
- Tasks 1 and 2 (Tauri Scaffold + Storage) must be complete.

## Implementation Steps

### 1. Directory Watcher
- Install `tauri-plugin-fs-watch`.
- In a Tauri background command, start watching the user's configured "Data Directory" for new or changed files.
- Emit a Tauri event `file-changed` to the frontend when a new CSV/JSON/Parquet file is added.
- In `+layout.svelte`, listen for this event and prompt: "New file detected: `sales_q4.csv`. Add to workspace?"

### 2. Native Drag-and-Drop
- In the Tauri configuration, enable `tauri.conf.json` `"fileDropEnabled": true`.
- In the Svelte drop zone components, listen for the Tauri `onFileDropHover` and `onFileDrop` events (not the browser `drop` event).
- Pass the OS file path directly to the DuckDB worker via `tauri-bridge.ts` (no need to open a picker dialog).

### 3. Direct Save to Disk
- For all "Download" buttons that currently trigger a browser download, add a "Save to Folder" alternative in the Tauri desktop app.
- `saveFileToDisk(buffer: ArrayBuffer, suggestedName: string)`: call Tauri's `dialog.save()` to get a path, then `fs.writeBinaryFile(path, buffer)`.

### 4. Recent Files (OS Integration)
- Use `tauri-plugin-window-state` to track recently opened files.
- On app launch, display a "Recent Files" quick-access panel.
- On macOS, register files in the OS "Recent Documents" menu via Tauri's `AppHandle`.

## Definition of Done
- Dragging a CSV from macOS Finder onto the LocalMind window registers it in DuckDB.
- Adding a file to the watched directory shows the "Add to workspace?" prompt.
- "Save to Folder" saves a DuckDB query CSV export directly to the user's chosen path.
- **No mocks.** Real Tauri plugin events and filesystem APIs are used.
- The directory watcher correctly detects file additions within 2 seconds.

---

# Phase 9: End-to-End Testing

## Objective
Validate Tauri-specific features — native file picker, storage path, directory watcher — via Tauri's WebDriver testing integration.

## Notes
Tauri E2E uses `tauri-driver` (based on WebDriver) instead of Playwright. Tests are in `tests/phase-9/`.

## Test Cases

```typescript
// tauri-fs.spec.ts
test('Native file picker opens and registers a CSV', async () => {
    // Trigger openFilePicker() via the bridge
    // Assert: native OS dialog appears
    // Select a fixture CSV
    // Assert: file appears in the registered files list
});

test('Exported file saves to OS filesystem', async () => {
    // Run a DuckDB query
    // Click "Save to Folder"
    // Assert: file exists at the path returned by Tauri dialog
});
```

## Definition of Done
- Tauri-driver tests pass on the host platform (macOS or Linux CI).
- **No mocks.** Real Tauri backend handles all filesystem operations.
