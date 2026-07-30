export interface PivotTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'sales' | 'hr' | 'logs' | 'finance' | 'general';
  requiredColumns: string[];
  optionalColumns?: string[];
  pivotConfig: {
    rows: string[];
    columns?: string[];
    values: { column: string; agg: string }[];
    filters?: { column: string; operator: string; value: string }[];
    chartType: 'auto' | 'bar' | 'line' | 'pie' | 'scatter' | 'area';
  };
}
