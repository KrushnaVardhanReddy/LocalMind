import type { PivotTemplate } from './template.types';

export const builtInTemplates: PivotTemplate[] = [
  {
    id: 'sales-overview',
    name: 'Sales Overview',
    description: 'A bar chart showing total revenue by region.',
    icon: '📈',
    category: 'sales',
    requiredColumns: ['region', 'product', 'revenue', 'date'],
    pivotConfig: {
      rows: ['region'],
      values: [{ column: 'revenue', agg: 'SUM' }],
      chartType: 'bar'
    }
  },
  {
    id: 'monthly-trends',
    name: 'Monthly Trends',
    description: 'A line chart showing amount trends over time.',
    icon: '📅',
    category: 'finance',
    requiredColumns: ['date', 'amount'],
    pivotConfig: {
      rows: ['month(date)'],
      values: [{ column: 'amount', agg: 'SUM' }],
      chartType: 'line'
    }
  },
  {
    id: 'category-breakdown',
    name: 'Category Breakdown',
    description: 'A pie chart breaking down values by category.',
    icon: '🥧',
    category: 'general',
    requiredColumns: ['category', 'value'],
    pivotConfig: {
      rows: ['category'],
      values: [{ column: 'value', agg: 'SUM' }],
      chartType: 'pie'
    }
  },
  {
    id: 'server-log-summary',
    name: 'Server Log Summary',
    description: 'A bar chart summarizing response times and status codes.',
    icon: '💻',
    category: 'logs',
    requiredColumns: ['status_code', 'method', 'path', 'response_time'],
    pivotConfig: {
      rows: ['status_code'],
      values: [
        { column: '*', agg: 'COUNT' },
        { column: 'response_time', agg: 'AVG' }
      ],
      chartType: 'bar'
    }
  },
  {
    id: 'employee-directory',
    name: 'Employee Directory',
    description: 'A bar chart showing average salary and headcount by department.',
    icon: '👥',
    category: 'hr',
    requiredColumns: ['department', 'role', 'salary'],
    pivotConfig: {
      rows: ['department'],
      values: [
        { column: '*', agg: 'COUNT' },
        { column: 'salary', agg: 'AVG' }
      ],
      chartType: 'bar'
    }
  },
  {
    id: 'expense-report',
    name: 'Expense Report',
    description: 'A pie chart grouping expenses by category.',
    icon: '🧾',
    category: 'finance',
    requiredColumns: ['category', 'amount', 'date'],
    pivotConfig: {
      rows: ['category'],
      values: [{ column: 'amount', agg: 'SUM' }],
      chartType: 'pie'
    }
  }
];
