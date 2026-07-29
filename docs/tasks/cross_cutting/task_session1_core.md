# Session-1: Core Session Schema & Local Export

## Objective
Implement the `SessionManager` service that captures the current workspace state — loaded files, SQL query history, pivot configuration, chart state, and AI summaries — into a single portable `.lm` file that can be saved locally and restored on any LocalMind installation.

This is LocalMind's core differentiator: instead of disconnected files scattered across the filesystem, users keep everything in one structured workspace snapshot.

## Prerequisites
- UX-1 (Dashboard routing) completed — the `/analytics` route exists.
- wa-sqlite workspace persistence is live.
- Task 7.1–7.3 (PivotBuilder) completed or in-flight.

## Implementation

### 1. Session Schema (`src/lib/services/session.types.ts`)
```typescript
export interface LocalMindSession {
  version: 1;
  createdAt: string;          // ISO timestamp
  updatedAt: string;
  title: string;
  workspace: 'analytics' | 'docs' | 'devtools';

  // Analytics state
  analytics?: {
    activeFile?: string;      // filename (not content — use fileRefs)
    sqlHistory: string[];     // last 20 SQL queries
    pivotConfig?: PivotConfig; // from pivot.types.ts
    chartType?: ChartType;
    aiSummary?: string;       // last AI insight text
    dashboardLayout?: object; // pinned charts config
  };

  // File references (OPFS paths or filenames)
  fileRefs: { name: string; sizeBytes: number; opfsPath?: string }[];
}
```

### 2. SessionManager Service (`src/lib/services/SessionManager.ts`)
- `capture(): LocalMindSession` — reads current Svelte store state and builds session object.
- `exportToFile(session)` — serializes to JSON, wraps in a `.lm` file (which is just JSON with a custom extension), triggers browser download via `Blob`.
- `save(session)` — persists to wa-sqlite under key `current_session`.
- `autoSave()` — debounced 30s auto-save triggered on any store change.

### 3. Export Button
- Add "Save Session" (💾) and "Export .lm" (📤) buttons to the Analytics workspace toolbar.
- "Save Session" triggers `manager.save()` — no download, just persists locally.
- "Export .lm" triggers `manager.exportToFile()` — downloads `workspace_<title>_<date>.lm`.

### 4. Session Indicator
- Show current session title in the workspace header (editable inline).
- Show "Unsaved changes" indicator (dot) when state has changed since last save.

## Acceptance Criteria
- [ ] `LocalMindSession` type defined in `session.types.ts`.
- [ ] `SessionManager.capture()` correctly serializes pivot config, SQL history, and AI summary.
- [ ] "Export .lm" triggers a valid JSON download with `.lm` extension.
- [ ] "Save Session" persists to wa-sqlite and survives page reload.
- [ ] Auto-save fires within 30s of any pivot configuration change.
- [ ] Unit tests cover `capture()` serialization and `exportToFile()` output structure.
