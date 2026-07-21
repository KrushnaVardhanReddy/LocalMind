# Task 4: Git History Analyzer

## Objective
Implement a local Git history analysis tool that parses a dropped `.git` folder, visualizes commit churn, contributor activity, and hotspot files — all computed in a DuckDB WASM worker without any git hosting API calls.

## Prerequisites
- Review `docs/specs/phase-4/01_devtools_engine_spec.md`.
- Phase 1 DuckDB worker must be complete.

## Implementation Steps

### 1. Install Dependencies
```bash
bun add isomorphic-git @isomorphic-git/lightning-fs
```

### 2. Git Parsing Worker
- Create `src/lib/workers/git.worker.ts`.
- Use `isomorphic-git` with a `LightningFS` in-memory filesystem.
- Implement:

  ```typescript
  interface GitWorkerContract {
      loadRepository(files: File[]): Promise<void>;  // accepts the .git folder files
      getCommitLog(limit?: number): Promise<CommitSummary[]>;
      getFileChurn(): Promise<FileChurnRecord[]>;
      getContributorStats(): Promise<ContributorStats[]>;
  }
  ```

- `loadRepository`: write all received `.git` folder files into LightningFS, then initialize the isomorphic-git context.
- `getCommitLog`: read all commits, return: hash, author, date, message, files changed count.
- `getFileChurn`: for each file, count: total commits touching it, lines added, lines deleted. Identifies hotspots.
- `getContributorStats`: group commits by author email; count commits, lines added/deleted.

### 3. DuckDB Analysis Layer
- After parsing, load `CommitSummary[]` and `FileChurnRecord[]` into in-memory DuckDB tables.
- Use DuckDB queries to compute derived metrics: commit frequency by week, most active contributors by month, file modification heatmap.

### 4. Build the Analysis UI
- Create `src/routes/devtools/git/+page.svelte`.
- Drop zone: accepts the `.git` folder (use `webkitdirectory`).
- Four visualization tabs:
  - **Commit Timeline:** ECharts bar chart of commits per week over the past year.
  - **File Hotspots:** Treemap chart (ECharts) where tile size = commit frequency, color = recency.
  - **Contributor Activity:** Stacked bar chart of lines added/deleted per contributor per month.
  - **Commit Log:** Paginated data grid showing all commits with author, date, message.

### 5. SQL Query Panel
- Below the charts, expose a DuckDB SQL query panel pre-populated with the `commits` and `file_churn` tables.
- Allow the user to write custom analytical queries (e.g., "Which files have the most churn in the last 30 days?").

## Definition of Done
- Dropping the `.git` folder of a medium-sized repository (500 commits) produces charts in under 15 seconds.
- The file hotspot treemap correctly identifies the most frequently changed files.
- The SQL panel executes a custom query against the parsed data.
- **No mocks, no network.** All git parsing is local via isomorphic-git.
- Loading a git repo with no commits shows an empty state, not an error.
