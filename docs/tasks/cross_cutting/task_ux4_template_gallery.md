# Task UX-4: Template Gallery

## Objective
Provide pre-built templates for common analytics workflows so new users can see immediate value without configuring anything from scratch. Templates are the fastest path to "aha moment" — the user drops a file, picks a template, and gets a fully configured dashboard in seconds.

## Implementation Details

### 1. Template Data Structure
Create `src/lib/templates/`:

```typescript
// src/lib/templates/template.types.ts
interface PivotTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'sales' | 'hr' | 'logs' | 'finance' | 'general';
  requiredColumns: string[];          // columns the template expects
  optionalColumns?: string[];
  pivotConfig: {
    rows: string[];
    columns?: string[];
    values: { column: string; agg: string }[];
    filters?: { column: string; operator: string; value: string }[];
    chartType: 'auto' | 'bar' | 'line' | 'pie' | 'scatter' | 'area';
  };
}
```

### 2. Built-in Templates

| Template | Expected Columns | Pivot Config |
|---|---|---|
| **Sales Overview** | `region`, `product`, `revenue`, `date` | Rows=region, Values=SUM(revenue), Chart=Bar |
| **Monthly Trends** | `date`, `amount` | Rows=month(date), Values=SUM(amount), Chart=Line |
| **Category Breakdown** | `category`, `value` | Rows=category, Values=SUM(value), Chart=Pie |
| **Server Log Summary** | `status_code`, `method`, `path`, `response_time` | Rows=status_code, Values=COUNT(*), AVG(response_time), Chart=Bar |
| **Employee Directory** | `department`, `role`, `salary` | Rows=department, Values=COUNT(*), AVG(salary), Chart=Bar |
| **Expense Report** | `category`, `amount`, `date` | Rows=category, Values=SUM(amount), Chart=Pie |

### 3. Template Matching
When a user uploads a CSV:
1. Fetch the column names from DuckDB schema.
2. Run each template's `requiredColumns` against the actual columns.
3. Rank templates by match percentage (exact match, case-insensitive, fuzzy).
4. Show a "Suggested Templates" section: "Your data looks like a Sales dataset. Try the Sales Overview template?"

### 4. Template Gallery UI
- Add a "Templates" button in the Analytics workspace that opens a modal/sidebar.
- Show templates as cards grouped by category.
- Each card shows: name, description, icon, and a "Use Template" button.
- "Use Template" auto-configures the pivot builder with the template's shelf configuration.

### 5. Custom Templates (Save Your Own)
- "Save as Template" button in the Pivot Builder toolbar.
- Saves the current shelf configuration as a custom template in wa-sqlite.
- Custom templates appear in the gallery alongside built-in ones.

## Acceptance Criteria
- [ ] 6+ built-in templates available in the gallery.
- [ ] Template gallery accessible from Analytics workspace.
- [ ] Clicking "Use Template" auto-populates the Pivot Builder shelves.
- [ ] Template matching suggests relevant templates when data is uploaded.
- [ ] "Save as Template" saves current pivot config as a reusable custom template.
- [ ] Custom templates persist across sessions via wa-sqlite.
- [ ] Templates work even if column names don't match exactly (case-insensitive matching).
