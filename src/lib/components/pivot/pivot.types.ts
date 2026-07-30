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
