1.  **Define Template Data Structure and Built-in Templates**:
    *   Create `src/lib/templates/template.types.ts` defining `PivotTemplate`.
    *   Create `src/lib/templates/built-in.ts` with the specified built-in templates (Sales Overview, Monthly Trends, etc.).
2.  **Update Database Schema**:
    *   Add `CustomTemplateRecord` interface to `src/lib/contracts/wa_sqlite_contract.ts`.
    *   Add schema creation for `custom_templates` table in `src/lib/workers/sqlite.worker.ts`.
    *   Add methods to `wa_sqlite_contract.ts` and `sqlite.worker.ts` for saving, listing, and deleting custom templates.
3.  **Create Template Gallery Component**:
    *   Create `src/lib/components/TemplateGallery.svelte`.
    *   Fetch standard templates and custom templates from SQLite worker (via `WorkerManager`).
    *   Implement matching logic based on `requiredColumns` and current DuckDB schema.
    *   Display grouped by suggested (matched) vs other templates.
    *   Provide a way to select and emit the template configuration back to the parent.
4.  **Integrate Template Gallery into Analytics Workspace**:
    *   Update `src/routes/analytics/+page.svelte` to include a "Templates" button when a table is selected.
    *   Render the `TemplateGallery` modal.
    *   Pass the applied template configuration down to `PivotBuilder.svelte` via props/methods.
5.  **Implement "Save as Template" in Pivot Builder**:
    *   Update `src/lib/components/PivotBuilder.svelte` to include a "Save as Template" button.
    *   On click, show a simple prompt/modal to get the template name and description.
    *   Save the current shelves (rows, columns, values, filters, chartType) and required columns (derived from the current schema) as a custom template in wa-sqlite.
6.  **Update `PivotBuilder.svelte` to apply templates**:
    *   Expose an `applyTemplate(template: PivotTemplate)` method in `PivotBuilder.svelte` to populate its internal reactive states (`rows`, `columns`, `values`, `filters`, `chartType`) and trigger query generation.
    *   Update `analytics/+page.svelte` to call `applyTemplate` on the `PivotBuilder` reference when a template is selected from the gallery.
7.  **Write Tests**:
    *   Add tests for the template matching logic in a separate file (e.g., `src/lib/templates/__tests__/template-matching.test.ts`).
    *   Update `src/lib/components/__tests__/PivotBuilder.test.ts` if necessary to cover the template application.
8.  **Complete pre-commit steps**.
    *   Run `bun run check` and `bun run build`.
    *   Follow `pre_commit_instructions`.
9.  **Submit the code**.
