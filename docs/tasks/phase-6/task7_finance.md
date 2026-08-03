TASK: Phase 6 — Task 7: Personal Finance & Tax Workspace (Plugin)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Build an offline financial analysis tool. Users can upload CSV bank statements (analyzed via DuckDB) and PDF/Image tax documents or receipts (analyzed via OCR). The WebLLM worker will be used to categorize transactions and extract specific fields from the text.

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES (CONFLICT-FREE CONTRACT)
═══════════════════════════════════════════════════════════════
- NO WorkerManager Modifications: Under no circumstances should `src/lib/workers/WorkerManager.ts` be modified.
- Reuse Existing Workers: Delegate tasks strictly to the existing DuckDB, OCR, and WebLLM singletons via `WorkerManager`.
- UI Component Isolation: You MUST NOT create any generic components in `src/lib/components/ui/`. If you need generic components (Buttons, Tables, Cards), create them locally in `src/lib/components/plugins/finance/ui/`.
- Purely Offline: All processing must happen in the browser to guarantee absolute financial data privacy.

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
1. **DuckDB Integration for CSVs:**
   - Allow uploading a CSV file. Use DuckDB to ingest the CSV.
   - Run a default aggregation query (e.g., `SELECT Category, SUM(Amount) FROM statements GROUP BY Category`) and display the results in an HTML Table.
2. **LLM Categorization:**
   - For un-categorized rows in the DuckDB table, pass batches of transaction descriptions to WebLLM with a strict prompt: "Return a JSON array categorizing these transactions: ['Groceries', 'Utilities', 'Entertainment', 'Travel', 'Other']."
   - Write back the LLM's categories to the DuckDB table using an UPDATE query.
3. **OCR for Receipts/W-2s:**
   - Provide a dropzone for PDF/Images. Send them to the OCR worker.
   - Pass the raw OCR output to WebLLM to extract key values (e.g., "Total Amount", "Tax Deductible items").
4. **State Management:** Svelte 5 `$state()` runes must be used.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `src/routes/plugins/finance/+page.svelte`
2. NEW: `src/lib/components/plugins/finance/TransactionTable.svelte`
3. NEW: `src/lib/components/plugins/finance/ReceiptScanner.svelte`

Commit: "feat: Phase 6 Task 7 Personal Finance and Tax Workspace"
Target branch: feature/task7-finance
