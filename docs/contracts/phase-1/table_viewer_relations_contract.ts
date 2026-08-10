import type { QueryResult } from '$lib/workers/duckdb.worker';

// ─────────────────────────────────────────────────────────────────────────────
// TableViewer.svelte — Props Contract
// ─────────────────────────────────────────────────────────────────────────────

export interface TableViewerProps {
  /** QueryResult from DuckDB worker. Null while loading or before a table is selected. */
  result: QueryResult | null;
  /** Show skeleton/spinner overlay when true */
  loading: boolean;
  /** Optional label rendered above the grid (e.g. table name) */
  caption?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// RelationBuilder.svelte — Props Contract
// ─────────────────────────────────────────────────────────────────────────────

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL OUTER';

export type JoinKeyConfidence = 'HIGH' | 'MEDIUM';

export interface JoinKeySuggestion {
  leftKey: string;
  rightKey: string;
  confidence: JoinKeyConfidence;
}

export interface RelationBuilderProps {
  /** All currently registered DuckDB table names (from uploadedTables store) */
  tables: string[];
  /** Emitted when the user clicks "Preview Join" and results arrive */
  onResult: (result: QueryResult) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal state shape (not a public prop — documents internal component state)
// ─────────────────────────────────────────────────────────────────────────────

export interface RelationBuilderState {
  tableA: string;
  tableB: string;
  joinType: JoinType;
  leftKey: string;
  rightKey: string;
  suggestions: JoinKeySuggestion[];
  generatedSql: string;
  isLoading: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// TableViewer internal sort/filter state
// ─────────────────────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc' | null;

export interface TableViewerSortState {
  column: string | null;
  direction: SortDirection;
}

export type PageSize = 25 | 50 | 100;
