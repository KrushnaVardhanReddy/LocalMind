<script lang="ts">
    import { WorkerManager } from '$lib/workers/WorkerManager';

    let htmlInput = $state('');
    let isProcessing = $state(false);
    let errorMsg = $state<string | null>(null);
    let successMsg = $state<string | null>(null);

    let extractedTables = $state<{ name: string; rows: any[]; columns: string[] }[]>([]);

    async function handleExtract() {
        errorMsg = null;
        successMsg = null;
        extractedTables = [];

        if (!htmlInput.trim()) {
            errorMsg = "Please paste some HTML.";
            return;
        }

        isProcessing = true;
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlInput, 'text/html');

            const tables = Array.from(doc.querySelectorAll('table'));
            const jsonLds = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));

            let tableIdx = 1;

            for (const table of tables) {
                const headers = Array.from(table.querySelectorAll('th')).map(th => (th.textContent || '').trim());
                let rows = Array.from(table.querySelectorAll('tbody tr'));

                if (rows.length === 0) {
                    rows = Array.from(table.querySelectorAll('tr')).filter(tr => !tr.querySelector('th'));
                }

                const tableData: any[] = [];
                let actualHeaders = headers;
                let dataRows = rows;

                if (actualHeaders.length === 0) {
                    const firstRow = table.querySelector('tr');
                    if (firstRow) {
                        actualHeaders = Array.from(firstRow.querySelectorAll('td, th')).map(td => (td.textContent || '').trim());
                        dataRows = Array.from(table.querySelectorAll('tr')).slice(1);
                    }
                }

                if (actualHeaders.length === 0) {
                     actualHeaders = ['Column1'];
                }

                // Ensure actualHeaders are unique
                actualHeaders = actualHeaders.map((h, i) => h || `Column${i + 1}`);
                const uniqueHeaders = new Set<string>();
                actualHeaders = actualHeaders.map(h => {
                    let uniqueH = h;
                    let c = 1;
                    while (uniqueHeaders.has(uniqueH)) {
                        uniqueH = `${h}_${c}`;
                        c++;
                    }
                    uniqueHeaders.add(uniqueH);
                    return uniqueH;
                });

                for (const row of dataRows) {
                    const cells = Array.from(row.querySelectorAll('td, th'));
                    const rowData: Record<string, any> = {};
                    let hasData = false;
                    for (let i = 0; i < Math.max(actualHeaders.length, cells.length); i++) {
                        const header = actualHeaders[i] || `Column${i + 1}`;
                        if (i >= actualHeaders.length) {
                             actualHeaders.push(header);
                             uniqueHeaders.add(header);
                        }
                        const cellText = cells[i] ? (cells[i].textContent || '').trim() : null;
                        rowData[header] = cellText;
                        if (cellText) hasData = true;
                    }
                    if (hasData) {
                        tableData.push(rowData);
                    }
                }

                if (tableData.length > 0) {
                    extractedTables.push({
                        name: `html_table_${tableIdx++}`,
                        columns: actualHeaders,
                        rows: tableData
                    });
                }
            }

            let jsonIdx = 1;
            for (const script of jsonLds) {
                try {
                    const textContent = script.textContent || '';
                    const parsed = JSON.parse(textContent);
                    const arr = Array.isArray(parsed) ? parsed : [parsed];

                    if (arr.length > 0) {
                        const columns = Array.from(new Set(arr.flatMap(obj => Object.keys(obj))));
                        extractedTables.push({
                            name: `json_ld_${jsonIdx++}`,
                            columns,
                            rows: arr
                        });
                    }
                } catch (e) {
                    console.error("Failed to parse JSON-LD", e);
                }
            }

            if (extractedTables.length === 0) {
                errorMsg = "No tables or JSON-LD found in the provided HTML.";
                return;
            }

            // Register with DuckDB
            const db = await WorkerManager.getDuckDB();

            for (const t of extractedTables) {
                const blob = new Blob([JSON.stringify(t.rows)], { type: 'application/json' });
                const file = new File([blob], `${t.name}.json`, { type: 'application/json' });
                await db.registerFile(file, t.name);
            }

            successMsg = `Successfully extracted and registered ${extractedTables.length} datasets to DuckDB.`;

        } catch (e) {
            console.error(e);
            errorMsg = e instanceof Error ? e.message : 'Unknown error';
        } finally {
            isProcessing = false;
        }
    }
</script>

<div class="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">HTML Data Extractor</h2>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Paste raw HTML below to extract structured data (&lt;table&gt; and JSON-LD) directly into queryable DuckDB tables.</p>

    <textarea
        bind:value={htmlInput}
        class="flex-1 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[200px]"
        placeholder="&lt;html&gt;...&lt;table&gt;...&lt;/table&gt;...&lt;/html&gt;"
    ></textarea>

    <div class="mt-4 flex gap-4 items-center">
        <button
            onclick={handleExtract}
            disabled={isProcessing}
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition disabled:opacity-50"
        >
            {isProcessing ? 'Processing...' : 'Extract Data'}
        </button>

        {#if errorMsg}
            <span class="text-red-500 text-sm font-medium">{errorMsg}</span>
        {/if}
        {#if successMsg}
            <span class="text-green-500 text-sm font-medium">{successMsg}</span>
        {/if}
    </div>

    {#if extractedTables.length > 0}
        <div class="mt-6 flex-1 overflow-auto">
            <h3 class="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Extracted Datasets Preview</h3>

            <div class="flex flex-col gap-6">
                {#each extractedTables as table}
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div class="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100">
                            {table.name} ({table.rows.length} rows)
                        </div>
                        <div class="overflow-x-auto max-h-[300px] overflow-y-auto">
                            <table class="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                                <thead class="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 sticky top-0 shadow-sm">
                                    <tr>
                                        {#each table.columns as col}
                                            <th class="px-4 py-2 font-semibold border-b dark:border-gray-700">{col}</th>
                                        {/each}
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each table.rows as row, idx}
                                        <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            {#each table.columns as col}
                                                <td class="px-4 py-2 truncate max-w-xs" title={String(row[col])}>
                                                    {row[col] !== undefined && row[col] !== null ? (typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])) : ''}
                                                </td>
                                            {/each}
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>
