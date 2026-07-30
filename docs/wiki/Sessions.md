# Sessions & Workspace Snapshots

## What is a LocalMind Session?

A **Session** is a portable `.lm` file that captures a complete analytical workspace — queries, pivot configuration, charts, AI summaries, and file references — in a single structured snapshot.

Instead of sharing disconnected files (a CSV here, a SQL script there, a screenshot of a chart somewhere else), users share **one self-contained environment** that anyone with LocalMind can open and pick up exactly where you left off.

---

## The `.lm` Format

A `.lm` file is a JSON document with a defined schema:

```typescript
interface LocalMindSession {
  version: 1;
  createdAt: string;       // ISO timestamp
  updatedAt: string;
  title: string;
  workspace: 'analytics' | 'docs' | 'devtools';

  analytics?: {
    sqlHistory: string[];       // last 20 SQL queries
    pivotConfig?: PivotConfig;  // full shelf state (rows/cols/values/filters)
    chartType?: ChartType;
    aiSummary?: string;         // last consent-gated AI insight
    dashboardLayout?: object;   // pinned charts grid
  };

  fileRefs: {
    name: string;
    sizeBytes: number;
    opfsPath?: string;          // OPFS path on the exporting machine
  }[];
}
```

---

## SessionManager

`src/lib/services/SessionManager.ts` provides:

| Method | Description |
|---|---|
| `capture()` | Reads current Svelte stores → builds `LocalMindSession` |
| `save(session)` | Persists to wa-sqlite under key `current_session` |
| `autoSave()` | Debounced 30s auto-save on any store change |
| `exportToFile(session)` | Serializes to JSON → triggers `.lm` download |
| `import(file)` | Parses `.lm` file → validates schema → returns session |
| `hydrate(session)` | Restores all Svelte stores from session object |

---

## Sharing Model

| Method | How | Privacy |
|---|---|---|
| **Local save** | `wa-sqlite` persistence — survives reload | Never leaves device |
| **Export `.lm`** | JSON download to local filesystem | User-controlled |
| **Static HTML report** | Self-contained HTML with inlined chart images | No external requests |
| **PDF export** | Print-to-PDF via native browser dialog | No external requests |
| *(Future)* **Read-only link** | Optional Cloudflare R2 upload | Opt-in only; user-initiated |

---

## Missing File Re-linking

When importing a session on a different machine, OPFS file paths from the exporting machine won't exist. LocalMind detects this and shows an inline re-link prompt:

> "Original file 'sales_2024.csv' not found — drop it here to re-link."

This preserves session metadata (queries, config) while giving the user a clear path to restore the data.

---

## Extending Sessions

When adding new workspace state that should survive session export, you must:
1. Add the new field to `LocalMindSession` in `session.types.ts`.
2. Serialize it in `SessionManager.capture()`.
3. Restore it in `SessionManager.hydrate()`.
4. Add a unit test covering the new field.
