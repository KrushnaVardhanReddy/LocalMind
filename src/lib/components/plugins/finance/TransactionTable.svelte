<script lang="ts">
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import Card from './ui/Card.svelte';
    import Table from './ui/Table.svelte';
    import Button from './ui/Button.svelte';

    let isProcessing = $state(false);
    let statusText = $state('');
    let columns = $state<string[]>([]);
    let data = $state<any[]>([]);
    let error = $state<string | null>(null);
    let isCategorizing = $state(false);
    let isFileLoaded = $state(false);

    async function handleFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        await loadData(file);

        input.value = ''; // Reset
    }

    async function loadData(file: File) {
        isProcessing = true;
        statusText = 'Loading CSV into DuckDB...';
        error = null;

        try {
            const duckdb = await WorkerManager.getDuckDB();
            await duckdb.init();

            // Register the file as 'transactions'
            await duckdb.registerFile(file, 'transactions');

            // Check if there's a Category column, if not, create a view or alter table to add it?
            // Actually, DuckDB's read_csv might not allow direct ALTER TABLE on views.
            // Let's create a real table from the view so we can update it.
            statusText = 'Preparing table...';

            // Re-create the table as a real table so we can update it.
            // registerFile creates a view, let's create a real table from it.
            await duckdb.query(`CREATE OR REPLACE TABLE transactions_table AS SELECT * FROM transactions`);

            // Check schema to see if Category exists
            const schema = await duckdb.getSchema('transactions_table');
            let hasCategory = false;
            for (const col in schema) {
                if (col.toLowerCase() === 'category') {
                    hasCategory = true;
                    break;
                }
            }

            if (!hasCategory) {
                // Add a Category column if it doesn't exist
                await duckdb.query(`ALTER TABLE transactions_table ADD COLUMN Category VARCHAR`);
            }

            await refreshTable();
            isFileLoaded = true;

        } catch (err: any) {
            console.error("Error loading CSV:", err);
            error = err.message || "Failed to load CSV file.";
        } finally {
            isProcessing = false;
        }
    }

    async function refreshTable() {
        const duckdb = await WorkerManager.getDuckDB();
        // Default query: Show all transactions, or maybe an aggregation
        // The requirements say: "Run a default aggregation query... and display the results"
        // Let's display the aggregation AND the raw data below, or just the raw data for categorization.
        // Actually, if we need to categorize, we should show the raw data so they can see uncategorized ones.
        // Let's just fetch all rows (up to 1000) for now.
        const result = await duckdb.query(`SELECT * FROM transactions_table LIMIT 1000`);
        columns = result.columns;
        data = result.rows;
    }

    async function runAggregation() {
        isProcessing = true;
        error = null;
        try {
            const duckdb = await WorkerManager.getDuckDB();

            // Find the amount column (often named Amount, Debit, Credit, etc)
            const schema = await duckdb.getSchema('transactions_table');
            const cols = Object.keys(schema).map(c => c.toLowerCase());

            let amountCol = 'Amount';
            for (const col of Object.keys(schema)) {
                const lower = col.toLowerCase();
                if (lower === 'amount' || lower === 'debit' || lower === 'value' || lower === 'transaction amount') {
                    amountCol = `"${col}"`; // Quote in case of spaces
                    break;
                }
            }

            // If we have a Category column, run aggregation
            const result = await duckdb.query(`SELECT Category, SUM(CAST(${amountCol} AS DOUBLE)) as Total FROM transactions_table GROUP BY Category`);
            columns = result.columns;
            data = result.rows;
        } catch (err: any) {
             console.error("Error running aggregation:", err);
             error = "Failed to run aggregation. Ensure you have an Amount column.";
        } finally {
            isProcessing = false;
        }
    }

    async function categorizeTransactions() {
        isCategorizing = true;
        error = null;

        try {
            const duckdb = await WorkerManager.getDuckDB();
            const llm = await WorkerManager.getWebLLM();

            // 1. Get uncategorized rows
            const uncategorized = await duckdb.query(`SELECT * FROM transactions_table WHERE Category IS NULL OR Category = '' OR Category = 'None' LIMIT 50`);

            if (uncategorized.rows.length === 0) {
                alert("No uncategorized transactions found (or limited to first 50).");
                return;
            }

            // Load LLM if not loaded
            const loadedModel = await llm.getLoadedModel();
            if (!loadedModel) {
                 statusText = 'Loading WebLLM Model (this may take a while)...';
                 await llm.loadModel('Llama-3-8B-Instruct-q4f32_1-MLC');
            }

            // 2. Batch process with LLM
            statusText = 'Categorizing with AI...';

            // Find description column
            const cols = uncategorized.columns.map((c: string) => c.toLowerCase());
            let descCol = uncategorized.columns[0]; // fallback
            for (const col of uncategorized.columns) {
                const lower = col.toLowerCase();
                if (lower.includes('desc') || lower.includes('memo') || lower.includes('payee') || lower.includes('name')) {
                    descCol = col;
                    break;
                }
            }

            // Prepare prompt
            const descriptions = uncategorized.rows.map((r: any, i: number) => `${i}: ${r[descCol]}`);

            const prompt = `Return a JSON array categorizing these transactions: ['Groceries', 'Utilities', 'Entertainment', 'Travel', 'Income', 'Dining', 'Shopping', 'Other']. Return ONLY a raw JSON array of strings matching the exact order of the input, nothing else. Example: ["Groceries", "Utilities"]. \n\nTransactions to categorize:\n${descriptions.join('\n')}`;

            const resultStr = await llm.complete(prompt);

            let categories: string[] = [];
            try {
                let cleaned = resultStr.replace(/```json/g, '').replace(/```/g, '').trim();
                categories = JSON.parse(cleaned);

                if (!Array.isArray(categories) || categories.length !== uncategorized.rows.length) {
                    throw new Error("LLM did not return an array of correct length.");
                }
            } catch (e) {
                console.error("Failed to parse LLM output:", resultStr);
                throw new Error("Failed to parse categories from AI response. Please try again.");
            }

            // 3. Update DuckDB
            statusText = 'Updating database...';
            for (let i = 0; i < uncategorized.rows.length; i++) {
                const row = uncategorized.rows[i];
                const cat = categories[i];

                // Need a unique identifier to update. If no ID, we use all columns (which is risky if duplicates).
                // To be safe, we might just use the exact description and amount.
                // Or better, we can add a temporary row_id when we create the table.
                // Since we didn't add row_id initially, we'll try to update by description.
                const safeDesc = String(row[descCol]).replace(/'/g, "''");
                await duckdb.query(`UPDATE transactions_table SET Category = '${cat.replace(/'/g, "''")}' WHERE "${descCol}" = '${safeDesc}' AND (Category IS NULL OR Category = '' OR Category = 'None')`);
            }

            await refreshTable();

        } catch (err: any) {
             console.error("Error categorizing:", err);
             error = err.message || "An error occurred during categorization.";
        } finally {
            isCategorizing = false;
            statusText = '';
        }
    }
</script>

<Card title="Bank Statement Analysis">
    <div class="flex flex-col gap-4">
        {#if !isFileLoaded}
            <div class="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <p class="mb-4 text-gray-600">Upload a CSV bank statement to get started.</p>
                <input type="file" accept=".csv" onchange={handleFileSelect} class="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                " />
            </div>
        {:else}
            <div class="flex items-center gap-4 flex-wrap">
                <Button onclick={refreshTable} variant="secondary">View All Transactions</Button>
                <Button onclick={runAggregation} variant="secondary">View Summary by Category</Button>
                <Button onclick={categorizeTransactions} disabled={isCategorizing}>
                    {#if isCategorizing}
                        Categorizing...
                    {:else}
                        Auto-Categorize with AI
                    {/if}
                </Button>

                {#if isProcessing || isCategorizing}
                    <span class="text-sm text-gray-600 flex items-center gap-2">
                        <svg class="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {statusText}
                    </span>
                {/if}
            </div>
        {/if}

        {#if error}
            <div class="bg-red-50 text-red-700 p-4 rounded-md text-sm border border-red-200">
                {error}
            </div>
        {/if}

        {#if data.length > 0}
            <div class="mt-4 border border-gray-200 rounded-md overflow-hidden">
                <Table {columns} {data} />
            </div>
        {/if}
    </div>
</Card>