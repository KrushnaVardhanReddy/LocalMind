TASK: Phase 1 — Task 18: Analytics Table Viewer & Cross-Table Relations

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Add a dedicated Table Viewer tab and a Relations tab to the Analytics workspace.
- Table Viewer: browse any uploaded DuckDB table as a rich, interactive data grid (sort, filter, paginate, CSV export) with zero SQL required.
- Relations: visually build a JOIN between two uploaded tables with auto-detected join keys, a transparent SQL preview panel, and the result rendered in the same grid.

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Strictly use Svelte 5 runes ($state, $derived, $props, $effect). DO NOT use Svelte 4 reactivity (export let, $:) or stores directly in new components.
- DO NOT modify WorkerManager.ts. Use the existing getDuckDB() for all queries.
- DO NOT modify package.json. No new npm dependencies.
- DO NOT touch existing PivotBuilder or Query Data logic — only wrap them in tab panels.
- Read the full spec before writing any code: docs/specs/phase-1/18_table_viewer_relations_spec.md
- Read the contract for all prop types: docs/contracts/phase-1/table_viewer_relations_contract.ts

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- docs/specs/phase-1/18_table_viewer_relations_spec.md  (SOURCE OF TRUTH — READ FIRST)
- docs/contracts/phase-1/table_viewer_relations_contract.ts  (Prop type contracts)
- src/lib/components/workspace/panels/AnalyticsWorkspace.svelte  (Modify: add tab bar)
- src/lib/stores/analytics.store.ts  (uploadedTables store — read only)
- src/lib/workers/WorkerManager.ts  (getDuckDB() — read only)
- src/lib/components/pivot/PivotBuilder.svelte  (Existing — do NOT modify internals)

═══════════════════════════════════════════════════════════════
IMPLEMENTATION STEPS
═══════════════════════════════════════════════════════════════

STEP 1 — Create TableViewer.svelte
File: src/lib/components/analytics/TableViewer.svelte

Props (from contract): result: QueryResult | null, loading: boolean, caption?: string

Features to implement:
- Sticky header row (position: sticky; top: 0) with column name and inferred type badge
  - Infer type by sampling result.rows[0][col]: typeof number → '#', string that matches ISO date → '📅', else 'T'
- Global search <input> that filters result.rows client-side across ALL columns (JSON.stringify the row and search). Debounce 150ms using setTimeout.
- Sort: clicking a column header cycles: null → 'asc' → 'desc' → null. Show ▲/▼/— chevron in the header.
- Pagination: page sizes [25, 50, 100]. Render only the current page slice after filtering + sorting.
  - Footer: "Showing {start}–{end} of {total} rows" + Prev/Next buttons.
- NULL cells: render as <span class="null-pill">—</span> instead of blank.
- Export CSV button: generates CSV from the currently filtered rows (all pages), triggers a download.
  - Filename: localmind_export_{Date.now()}.csv
- Diff colouring: if a row has _diff_status === 'added' → green row; _diff_status === 'removed' → red row with text-decoration: line-through.

STEP 2 — Create RelationBuilder.svelte
File: src/lib/components/analytics/RelationBuilder.svelte

Props (from contract): tables: string[], onResult: (result: QueryResult) => void

Features to implement:
- Two <select> dropdowns: Table A and Table B (populated from tables prop).
- On both tables selected: call getDuckDB().getSchema() for each. Compare column names:
  - Exact name match (case-insensitive) → confidence HIGH
  - Same type + Levenshtein distance ≤ 2 → confidence MEDIUM
  - Pre-fill leftKey/rightKey dropdowns with the highest-confidence suggestion.
  - If no match: show hint "No common columns detected — select join keys manually".
- Join type radio/segmented control: INNER | LEFT | RIGHT | FULL OUTER (default: INNER)
- Left Key <select> (Table A columns) + Right Key <select> (Table B columns)
- Generated SQL preview panel (read-only <pre><code>):
  SELECT a.*, {b_exclusive_cols}
  FROM {tableA} AS a
  {joinType} JOIN {tableB} AS b ON a.{leftKey} = b.{rightKey}
  where b_exclusive_cols = Table B columns not present in Table A.
- "Preview Join" button: disabled if tableA, tableB, leftKey, or rightKey are unset.
  On click: execute the generated SQL via getDuckDB().query(sql, 5000), then call onResult(result).
- Show a spinner while the query is running.

STEP 3 — Update AnalyticsWorkspace.svelte
File: src/lib/components/workspace/panels/AnalyticsWorkspace.svelte

Changes:
1. Add import for TableViewer and RelationBuilder.
2. Add state: let activeAnalyticsTab = $state<'table'|'relations'|'pivot'|'query'>('table');
3. Add state for Table Viewer tab: let tableViewerTable = $state(''); let tableViewerResult = $state<QueryResult|null>(null); let tableViewerLoading = $state(false);
4. Add function handleTableViewerSelect(tableName): run SELECT * FROM {tableName} LIMIT 5000, set tableViewerResult.
5. Insert a tab bar <nav> BELOW the Data Ingestion section and ABOVE the existing Pivot Builder section.
   Tab labels: "📋 Table Viewer" | "🔗 Relations" | "📊 Pivot Builder" | "💻 Query Data"
   Active tab styling should match the existing design system.
6. Wrap existing Pivot Builder section in {#if activeAnalyticsTab === 'pivot'} ... {/if}
7. Wrap existing Query Data section in {#if activeAnalyticsTab === 'query'} ... {/if}
8. Add Table Viewer panel:
   {#if activeAnalyticsTab === 'table'}
     <select> for table (from $uploadedTables), onchange calls handleTableViewerSelect
     <TableViewer result={tableViewerResult} loading={tableViewerLoading} caption={tableViewerTable} />
   {/if}
9. Add Relations panel:
   {#if activeAnalyticsTab === 'relations'}
     <RelationBuilder tables={$uploadedTables} onResult={(r) => relationsResult = r} />
     {#if relationsResult}
       <TableViewer result={relationsResult} loading={false} caption="Join Result" />
     {/if}
   {/if}

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. CREATE: src/lib/components/analytics/TableViewer.svelte
2. CREATE: src/lib/components/analytics/RelationBuilder.svelte
3. MODIFY: src/lib/components/workspace/panels/AnalyticsWorkspace.svelte
4. CREATE: src/lib/components/analytics/TableViewer.test.ts  (Vitest unit tests)
5. CREATE: src/lib/components/analytics/RelationBuilder.test.ts  (Vitest unit tests)

Run bun run check && npx vitest run before committing.

Commit: "jules: feat: analytics table viewer and cross-table relations (task 18)"
Target branch: feature/task18-table-viewer-relations
