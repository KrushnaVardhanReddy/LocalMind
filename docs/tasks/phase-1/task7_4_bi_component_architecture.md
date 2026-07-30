# Task 7.4: BI Pivot Builder — Component Architecture & Premium UI

## Objective
Decompose the monolithic `PivotBuilder.svelte` (272 lines) into a clean component tree following React/Angular-style architecture, and add premium visual polish that makes the Pivot Builder feel like Tableau — not a debugging tool.

## Prerequisites
- Tasks 7.1, 7.2, 7.3 completed (ECharts, Pivot/Filters, Table polish).

## 1. Component Architecture

Break `PivotBuilder.svelte` into focused, reusable child components:

```
src/lib/components/pivot/
├── PivotBuilder.svelte          ← Orchestrator (state container, passes props down)
├── ColumnPanel.svelte           ← Left sidebar: available columns with type icons & preview tooltips
├── ShelfZone.svelte             ← Reusable drop zone (used for Rows, Columns, Values, Filters)
├── ShelfPill.svelte             ← Individual draggable pill (color-coded, removable)
├── PivotChart.svelte            ← ECharts container + chart type selector toggle
├── PivotTable.svelte            ← Data table with totals row, pagination, sorting
├── SQLPanel.svelte              ← Collapsible generated SQL viewer with copy button
├── FilterEditor.svelte          ← Inline filter operator + value editor for the Filters shelf
└── pivot.types.ts               ← Shared TypeScript types (PivotConfig, ShelfItem, FilterRule, etc.)
```

### Component Responsibilities

#### `PivotBuilder.svelte` (Orchestrator)
- Owns all pivot state (`rows`, `values`, `columns`, `filters`, `result`, `chartType`, `generatedSQL`).
- Passes state down as props to child components.
- Handles DuckDB query execution.
- Coordinates drag-and-drop events between children via callback props.

#### `ColumnPanel.svelte`
- Receives `allColumns` and `columnTypes` as props.
- Renders each column with a **type icon**: 🔢 (numeric), 🔤 (text), 📅 (date/timestamp), 🔘 (boolean).
- Column types fetched from DuckDB `DESCRIBE` query.
- **Hover tooltip**: shows 5 sample values + distinct count (fetched lazily on hover).
- Search/filter input at the top to filter columns by name.
- Columns already placed in a shelf are visually dimmed (not removed, so they can be added to multiple shelves).

#### `ShelfZone.svelte` (Reusable)
- Props: `label`, `color` (theme), `items`, `onDrop`, `onRemove`, `emptyText`.
- Renders a drop zone with active highlighting (glow effect when dragging over).
- Renders `ShelfPill` components for each item.
- Color themes: Rows = blue, Columns = purple, Values = green, Filters = orange.

#### `ShelfPill.svelte`
- Props: `label`, `color`, `removable`, `onRemove`, extras (aggregate selector for Values, operator/value for Filters).
- Renders a styled pill with rounded corners, subtle shadow, and remove (×) button.
- Draggable with a custom drag ghost image (styled floating pill, not browser default).

#### `PivotChart.svelte`
- Props: `result`, `chartType`, `rows`, `values`, `onChartTypeChange`.
- Renders ECharts instance + chart type selector (icon toggle bar: 📊 📈 🥧 ⬡ 📉).
- Handles chart resize on container resize.
- Shows "No data" state when result is empty.

#### `PivotTable.svelte`
- Props: `result`, `values` (for totals computation), `pageSize`.
- Renders sticky-header table with alternating rows, sortable columns, pagination, and grand totals row.

#### `SQLPanel.svelte`
- Props: `sql`.
- Collapsible panel with syntax-highlighted SQL (highlight.js) and copy-to-clipboard button.

#### `FilterEditor.svelte`
- Props: `column`, `operator`, `value`, `onChange`.
- Inline editor: operator dropdown + value input with auto-suggest.

## 2. Premium Visual Polish

### Drag-and-Drop Feedback
- **Active drop zone glow**: When dragging over a shelf, apply a pulsing border glow (`ring-2 ring-blue-400 ring-opacity-50 animate-pulse`) and slightly scale the zone.
- **Drag ghost image**: Use `e.dataTransfer.setDragImage()` with a custom rendered pill element.
- **Drop animation**: When a pill lands in a zone, apply a brief scale-in animation (`animate-[scaleIn_150ms_ease-out]`).

### Column Panel Enhancements
- **Column type icons**: Fetch column types via `DESCRIBE "tableName"` and render type-appropriate icons.
- **Preview tooltip**: On hover, lazy-fetch `SELECT DISTINCT "col" FROM "table" LIMIT 5` and show in a floating tooltip with distinct count.
- **Search bar**: Text input at top of column panel to filter columns by name.
- **Dimmed used columns**: Columns already in a shelf get reduced opacity (0.5) but remain draggable.

### Layout
- **Split-pane layout**: Chart on top (or left), Table on bottom (or right). Toggle between stacked and side-by-side with a layout button.
- **Responsive breakpoints**: On mobile, shelves stack vertically; column panel becomes a collapsible drawer.

### Dark Mode
- All hardcoded `bg-white`, `bg-gray-50`, `text-gray-700` etc. must use CSS custom properties or Tailwind's `dark:` variant to respect the app's theme.

### Micro-Animations
- Shelf pills enter with a subtle fade+slide animation.
- Removing a pill has a brief fade-out.
- Chart type selector icons have a scale-up on hover.
- The SQL panel slides open/closed smoothly.

## 3. Shared Types (`pivot.types.ts`)

```typescript
export type ColumnType = 'numeric' | 'text' | 'date' | 'boolean' | 'unknown';

export interface ColumnInfo {
  name: string;
  type: ColumnType;
}

export interface ShelfItem {
  column: string;
  type?: ColumnType;
}

export interface ValueShelfItem extends ShelfItem {
  agg: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
}

export interface FilterRule {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN';
  value: string;
}

export type ChartType = 'auto' | 'bar' | 'line' | 'pie' | 'scatter' | 'area';

export interface PivotConfig {
  rows: ShelfItem[];
  columns: ShelfItem[];
  values: ValueShelfItem[];
  filters: FilterRule[];
  chartType: ChartType;
}
```

## Acceptance Criteria
- [ ] PivotBuilder decomposed into 8+ child components in `src/lib/components/pivot/`.
- [ ] Each component is independently testable with its own props interface.
- [ ] Column panel shows type icons (🔢🔤📅🔘) and hover preview tooltips.
- [ ] Column search/filter works.
- [ ] Drop zones glow/pulse when a draggable item hovers over them.
- [ ] Shelf pills are color-coded by zone type (blue/purple/green/orange).
- [ ] Custom drag ghost image (not browser default).
- [ ] Split-pane layout for chart + table.
- [ ] Dark mode compatible.
- [ ] All existing PivotBuilder functionality preserved (no regressions).
- [ ] Unit tests for each new component.
- [ ] Existing PivotBuilder tests still pass.

## Important Note regarding Testing
**Do not attempt to configure `vitest.config.ts`—it already exists in the repository root and is correctly configured for Svelte 5.** 

If you are facing the `lifecycle_function_unavailable` error, it is likely because you are running `bun test` directly. `bun test` has its own test runner and does **not** automatically read `vitest.config.ts`, meaning it runs without the necessary `jsdom` environment and Svelte testing plugins that are already set up.

**To fix the test environment:**
Instead of running `bun test`, run **`npx vitest run`** (or add `"test": "vitest run"` to the `scripts` in `package.json` and run `bun run test`). This will utilize the existing `vitest.config.ts` which includes `environment: 'jsdom'` and the `@testing-library/svelte/vite` plugin required for Svelte 5 component testing.
