# Session-4: Session Import (Restore Workspace from .lm File)

## Objective
Allow users to restore a complete workspace from a previously exported `.lm` file, bringing back their pivot configuration, SQL history, AI summaries, and file references.

## Prerequisites
- Session-1 (Core Session Schema & Local Export) completed.

## Implementation

### 1. Import Entry Points
- Add a "Open Session" (📂) button to the workspace launcher dashboard (`/`).
- Add a "Import Session" option in the workspace toolbar for switching sessions mid-work.
- Both trigger the browser's native file picker (`.lm` files only via `accept=".lm"`).

### 2. SessionManager.import()
```typescript
async import(file: File): Promise<LocalMindSession>
```
- Read file as text, JSON.parse.
- Validate `version` field — reject unknown versions with a user-friendly error.
- Validate schema with a lightweight type-guard function.
- Return the parsed session or throw `SessionImportError`.

### 3. Workspace Hydration
- After import, call `SessionManager.hydrate(session)` which:
  - Restores `pivotConfig` to the PivotBuilder Svelte store.
  - Restores `sqlHistory` to the query history store.
  - Restores `aiSummary` to the AI insights panel.
  - Sets the session title in the workspace header.
  - Shows a toast: "Session restored: <title>".
- If the session references a file (via `fileRefs`) that is no longer in OPFS, show an inline warning: "Original file '<name>' not found — drop it here to re-link."

### 4. Session Switcher
- Maintain a list of recently saved sessions in wa-sqlite (up to 10).
- Show a "Recent Sessions" dropdown in the workspace header.
- Clicking a recent session restores it immediately.

## Acceptance Criteria
- [ ] File picker opens and accepts `.lm` files only.
- [ ] Valid `.lm` file restores pivot config, SQL history, and AI summary.
- [ ] Invalid or corrupt file shows a clear error message (not a crash).
- [ ] Missing file reference shows an inline re-link prompt.
- [ ] Recent sessions list persists in wa-sqlite across page reloads.
- [ ] Unit tests cover `import()` validation and `hydrate()` store population.
