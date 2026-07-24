<script lang="ts">
    import { onMount } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';

    let inputMode = $state<'workspace' | 'text'>('workspace');
    let availableTables = $state<string[]>([]);
    let selectedTable = $state('');
    let rawText = $state('');
    let isLoading = $state(false);
    let errorStr = $state('');
    let previewData = $state<{columns: string[], rows: any[]}>({ columns: [], rows: [] });
    let currentTable = $state('');
    let issues = $state<{type: string, message: string, severity: 'high' | 'medium', col?: string}[]>([]);
    let suggestedSql = $state('');
    let isApplyingFix = $state(false);
    let fixHistory = $state<{sql: string, previousView: string}[]>([]);

    onMount(async () => {
        try {
            const dbWorker = await WorkerManager.getDuckDB();
            const res = await dbWorker.query('SHOW TABLES');
            availableTables = res.rows.map((r: any) => r.name);
            if (availableTables.length > 0) {
                selectedTable = availableTables[0];
            }
        } catch (e) {
            console.error("Failed to list DuckDB tables", e);
        }
    });

    async function loadData() {
        isLoading = true;
        errorStr = '';
        issues = [];
        suggestedSql = '';
        fixHistory = [];

        try {
            const dbWorker = await WorkerManager.getDuckDB();
            let targetTable = '';

            if (inputMode === 'workspace') {
                if (!selectedTable) throw new Error("Please select a table");
                targetTable = selectedTable;
            } else {
                if (!rawText.trim()) throw new Error("Please paste some text");
                targetTable = 'janitor_temp_' + Date.now();

                // Assume CSV for raw text if we paste it, write to a temp file and load it
                const file = new File([rawText], 'temp.csv', { type: 'text/csv' });
                await dbWorker.registerFile(file, targetTable);
            }

            currentTable = targetTable;

            // Backup original table state as a view
            const backupView = currentTable + '_original';
            await dbWorker.query(`CREATE OR REPLACE VIEW ${backupView} AS SELECT * FROM ${currentTable}`);

            await refreshPreview();
            await scanIssues(targetTable);

        } catch (e: any) {
            errorStr = e.message;
        } finally {
            isLoading = false;
        }
    }

    async function refreshPreview() {
        const dbWorker = await WorkerManager.getDuckDB();
        const res = await dbWorker.query(`SELECT * FROM ${currentTable} LIMIT 20`);
        previewData = { columns: res.columns, rows: res.rows };
    }

    async function scanIssues(table: string) {
        const dbWorker = await WorkerManager.getDuckDB();
        const schema = await dbWorker.getSchema(table);
        const newIssues = [];

        // Check Duplicates
        try {
            const res = await dbWorker.query(`SELECT (COUNT(*) - COUNT(DISTINCT *)) as c FROM ${table}`);
            const dupCount = Number(res.rows[0].c);
            if (dupCount > 0) {
                newIssues.push({ type: 'duplicates', message: `Found ${dupCount} duplicate rows`, severity: 'high' as const });
            }
        } catch(e) {}

        for (const [col, type] of Object.entries(schema)) {
            // Check Nulls
            try {
                const res = await dbWorker.query(`SELECT COUNT(*) as c FROM ${table} WHERE "${col}" IS NULL`);
                const nullCount = Number(res.rows[0].c);
                if (nullCount > 0) {
                    newIssues.push({ type: 'nulls', message: `Column '${col}' has ${nullCount} null values`, severity: 'medium' as const, col });
                }
            } catch(e) {}

            // Very basic phone number check (if string)
            if ((type as string).includes('VARCHAR')) {
                try {
                    // Check if column looks like a mix of phone formats
                    const hasPlus = await dbWorker.query(`SELECT COUNT(*) as c FROM ${table} WHERE "${col}" LIKE '+%'`);
                    const hasNoPlus = await dbWorker.query(`SELECT COUNT(*) as c FROM ${table} WHERE "${col}" NOT LIKE '+%' AND "${col}" ~ '^[0-9\\-]+$'`);
                    if (Number(hasPlus.rows[0].c) > 0 && Number(hasNoPlus.rows[0].c) > 0) {
                        newIssues.push({ type: 'phone_format', message: `Column '${col}' has mixed phone number formats`, severity: 'medium' as const, col });
                    }
                } catch(e) {}
            }
        }

        issues = newIssues;
    }

    async function generateFix(issue: typeof issues[0]) {
        isApplyingFix = true;
        errorStr = '';
        try {
            const llm = await WorkerManager.getWebLLM();
            const loaded = await llm.getLoadedModel();
            if (!loaded) {
                throw new Error("Local LLM is not loaded. Please go to Chat and load a model first, or wait if it's loading.");
            }

            let prompt = "";
            if (issue.type === 'phone_format') {
                prompt = `The column '${issue.col}' in this table '${currentTable}' has mixed formats (some are '+1-555-1234', some are '5551234'). Write a DuckDB SQL UPDATE expression to normalize all values to E.164 format (+{country_code}{number}). Return only the SQL. Example output: UPDATE ${currentTable} SET "${issue.col}" = ...;`;
            } else if (issue.type === 'nulls') {
                prompt = `The column '${issue.col}' in table '${currentTable}' has null values. Write a DuckDB SQL UPDATE to set nulls to a default value like 'Unknown' or 0 depending on context. Return only the SQL.`;
            } else if (issue.type === 'duplicates') {
                prompt = `The table '${currentTable}' has duplicate rows. Write a DuckDB SQL statement to remove exact duplicates, keeping only one of each. Return only the SQL.`;
            } else {
                prompt = `Write a DuckDB SQL statement to fix this issue in table '${currentTable}': ${issue.message}. Return only the SQL.`;
            }

            let sql = await llm.complete(prompt);
            // Clean markdown
            sql = sql.replace(/```sql\n/g, '').replace(/```/g, '').trim();
            suggestedSql = sql;
        } catch (e: any) {
            errorStr = e.message;
        } finally {
            isApplyingFix = false;
        }
    }

    async function applyFix() {
        if (!suggestedSql) return;
        isApplyingFix = true;
        errorStr = '';
        try {
            const dbWorker = await WorkerManager.getDuckDB();

            // Create a backup view before applying
            const viewName = `${currentTable}_backup_${Date.now()}`;
            await dbWorker.query(`CREATE OR REPLACE VIEW ${viewName} AS SELECT * FROM ${currentTable}`);

            await dbWorker.query(suggestedSql);

            fixHistory = [...fixHistory, { sql: suggestedSql, previousView: viewName }];
            suggestedSql = '';

            await refreshPreview();
            await scanIssues(currentTable);
        } catch (e: any) {
            errorStr = e.message;
        } finally {
            isApplyingFix = false;
        }
    }

    async function undoFix() {
        if (fixHistory.length === 0) return;
        isApplyingFix = true;
        errorStr = '';
        try {
            const dbWorker = await WorkerManager.getDuckDB();
            const lastFix = fixHistory[fixHistory.length - 1];

            // Restore from the view
            // To overwrite the table, we can recreate it or just delete and insert
            await dbWorker.query(`DROP TABLE IF EXISTS ${currentTable}`);
            await dbWorker.query(`CREATE TABLE ${currentTable} AS SELECT * FROM ${lastFix.previousView}`);

            fixHistory = fixHistory.slice(0, -1);

            await refreshPreview();
            await scanIssues(currentTable);
        } catch (e: any) {
            errorStr = e.message;
        } finally {
            isApplyingFix = false;
        }
    }

    async function downloadData() {
        try {
            const dbWorker = await WorkerManager.getDuckDB();
            const res = await dbWorker.query(`SELECT * FROM ${currentTable}`);

            // Simple CSV serialize
            const cols = res.columns.join(',');
            const rows = res.rows.map((r: any) => res.columns.map((c: string) => `"${(r[c] || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
            const csv = cols + '\n' + rows;

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cleaned_data.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e: any) {
            errorStr = "Download failed: " + e.message;
        }
    }
</script>

<div class="p-6 max-w-7xl mx-auto flex flex-col gap-6">
    <div class="flex justify-between items-center border-b pb-4">
        <div>
            <h1 class="text-2xl font-bold text-slate-800">Local AI Data Janitor</h1>
            <p class="text-sm text-slate-600">Clean your data locally using WebLLM and DuckDB.</p>
        </div>
        <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border border-green-300 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            No data leaves your device
        </div>
    </div>

    {#if errorStr}
        <div class="p-4 bg-red-100 text-red-800 rounded border border-red-200">
            {errorStr}
        </div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Panel: Input -->
        <div class="lg:col-span-1 flex flex-col gap-4">
            <div class="bg-white p-4 border rounded shadow-sm">
                <h2 class="font-semibold text-slate-800 mb-4">Input Data</h2>

                <div class="flex gap-4 mb-4">
                    <label class="flex items-center gap-2 text-sm">
                        <input type="radio" name="inputMode" value="workspace" bind:group={inputMode}>
                        From Workspace
                    </label>
                    <label class="flex items-center gap-2 text-sm">
                        <input type="radio" name="inputMode" value="text" bind:group={inputMode}>
                        Paste Raw Text
                    </label>
                </div>

                {#if inputMode === 'workspace'}
                    <select bind:value={selectedTable} class="w-full border rounded p-2 text-sm mb-4">
                        <option value="">Select a table...</option>
                        {#each availableTables as table}
                            <option value={table}>{table}</option>
                        {/each}
                    </select>
                {:else}
                    <textarea bind:value={rawText} placeholder="Paste CSV or JSON here..." class="w-full h-32 border rounded p-2 text-sm font-mono mb-4"></textarea>
                {/if}

                <button onclick={loadData} disabled={isLoading} class="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50">
                    {isLoading ? 'Loading...' : 'Load Data'}
                </button>
            </div>

            {#if issues.length > 0}
                <div class="bg-white p-4 border rounded shadow-sm border-orange-200">
                    <h2 class="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <span class="text-orange-500">⚠️</span> Issues Found
                    </h2>
                    <div class="space-y-3">
                        {#each issues as issue}
                            <div class="bg-orange-50 p-3 rounded border border-orange-100 text-sm">
                                <div class="font-medium text-orange-900 mb-1">{issue.message}</div>
                                <button onclick={() => generateFix(issue)} disabled={isApplyingFix} class="text-xs bg-white text-blue-600 px-2 py-1 border rounded hover:bg-slate-50 disabled:opacity-50 mt-2">
                                    Ask AI for Fix
                                </button>
                            </div>
                        {/each}
                    </div>
                </div>
            {:else if currentTable && !isLoading}
                <div class="bg-white p-4 border rounded shadow-sm border-green-200">
                    <h2 class="font-semibold text-green-800 flex items-center gap-2">
                        <span>✅</span> Data looks clean!
                    </h2>
                </div>
            {/if}

            {#if fixHistory.length > 0}
                 <div class="bg-white p-4 border rounded shadow-sm">
                    <div class="flex justify-between items-center mb-3">
                        <h2 class="font-semibold text-slate-800">Fix History</h2>
                        <button onclick={undoFix} disabled={isApplyingFix} class="text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300">
                            Undo Last Fix
                        </button>
                    </div>
                    <ul class="text-sm space-y-2">
                        {#each fixHistory as fix, i}
                            <li class="p-2 bg-slate-50 border rounded font-mono text-xs truncate" title={fix.sql}>
                                {fix.sql}
                            </li>
                        {/each}
                    </ul>
                 </div>
            {/if}
        </div>

        <!-- Right Panel: Preview & Fix -->
        <div class="lg:col-span-2 flex flex-col gap-4">
            {#if suggestedSql}
                <div class="bg-white border rounded shadow-sm overflow-hidden border-blue-200">
                    <div class="p-3 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                        <h2 class="font-semibold text-blue-900">AI Suggested Fix</h2>
                        <button onclick={() => suggestedSql = ''} class="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                    <div class="p-4">
                        <pre class="bg-slate-900 text-green-400 p-3 rounded text-sm font-mono whitespace-pre-wrap">{suggestedSql}</pre>
                        <div class="mt-4 flex justify-end gap-2">
                            <button onclick={() => suggestedSql = ''} class="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 text-sm font-medium">Cancel</button>
                            <button onclick={applyFix} disabled={isApplyingFix} class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium">Apply Fix</button>
                        </div>
                    </div>
                </div>
            {/if}

            <div class="bg-white border rounded shadow-sm flex flex-col h-[600px]">
                <div class="p-4 border-b flex justify-between items-center">
                    <h2 class="font-semibold text-slate-800">Data Preview (First 20 Rows)</h2>
                    {#if currentTable}
                        <button onclick={downloadData} class="px-3 py-1.5 bg-slate-100 text-slate-700 border rounded text-sm hover:bg-slate-200">
                            Download Cleaned Data
                        </button>
                    {/if}
                </div>
                <div class="flex-grow overflow-auto p-0">
                    {#if previewData.rows.length > 0}
                        <table class="min-w-full text-left text-sm whitespace-nowrap">
                            <thead class="bg-slate-50 border-b sticky top-0">
                                <tr>
                                    {#each previewData.columns as col}
                                        <th class="px-4 py-2 font-medium text-slate-600">{col}</th>
                                    {/each}
                                </tr>
                            </thead>
                            <tbody class="divide-y text-slate-700 font-mono">
                                {#each previewData.rows as row}
                                    <tr class="hover:bg-slate-50">
                                        {#each previewData.columns as col}
                                            <td class="px-4 py-2 truncate max-w-[200px]" title={row[col]?.toString()}>
                                                {row[col] === null ? 'NULL' : row[col]}
                                            </td>
                                        {/each}
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {:else}
                        <div class="h-full flex items-center justify-center text-slate-400">
                            No data loaded.
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
