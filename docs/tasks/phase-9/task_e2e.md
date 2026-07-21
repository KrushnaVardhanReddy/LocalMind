# Task 4: End-to-End Testing — Phase 9 (Tauri Desktop App)

## Objective
Validate all Tauri-specific features (native file picker, OS filesystem storage, directory watcher, native drag-and-drop) using Tauri's WebDriver integration.

## Prerequisites
- All Phase 9 tasks (1–3) must be complete.
- Rust and `tauri-driver` must be installed: `cargo install tauri-driver`.
- **No mocking rule:** All Tauri Rust commands must be real — no mocked filesystem backends.

## Setup

### Tauri WebDriver Config
```bash
bun add -D @tauri-apps/webdriver wdio-service
```
Configure `tests/phase-9/wdio.conf.ts` to start `tauri-driver` before the test session.

### Test Fixtures
- `tests/fixtures/tauri/sample.csv` — a small CSV to test native file registration.

## Test Cases (`tests/phase-9/`)

```typescript
// tauri-file-picker.spec.ts
test('Native file picker registers a CSV into DuckDB', async () => {
    // Click "Select File" in the Analytics workspace
    // Interact with the OS native dialog to select sample.csv
    // Assert: file appears in the registered files list
    // Assert: a DuckDB table is created with the correct row count
});

// tauri-storage.spec.ts
test('Workspace database is stored at OS app data path', async () => {
    // Create a new workspace
    // Save a query
    // Assert: the workspace.db file exists at the expected OS path
    //   macOS: ~/Library/Application Support/LocalMind/workspace.db
    //   Linux: ~/.local/share/LocalMind/workspace.db
    //   Windows: %APPDATA%\LocalMind\workspace.db
});

// tauri-save.spec.ts
test('Save to Folder writes file to selected OS path', async () => {
    // Run a DuckDB query, click "Save to Folder"
    // Select a temp path via the Tauri dialog
    // Assert: file exists at that path with correct content
});

// tauri-native-drop.spec.ts
test('Dragging a file from OS onto the app registers it', async () => {
    // Simulate a native OS drag-and-drop of sample.csv onto the drop zone
    // Assert: file appears in registered files list
});
```

## Definition of Done
- All Tauri WebDriver tests pass on the host CI platform (Linux AppImage or macOS `.app`).
- **Zero mocks** — all Tauri Rust commands invoke real OS APIs.
- The test report confirms the workspace DB file exists at the correct OS path.
- A file dragged from the OS desktop is correctly registered in DuckDB.
