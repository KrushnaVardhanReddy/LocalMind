<script lang="ts">
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import { onMount, onDestroy } from 'svelte';

    let mode = $state<'json' | 'sql'>('json');
    let inputContent = $state('');
    let rowCount = $state(1000);
    let seed = $state<number | undefined>(undefined);
    let isGenerating = $state(false);
    let errorMsg = $state('');
    let generatedData = $state<any[]>([]);
    let columns = $state<string[]>([]);

    let datagenWorker: any;
    let duckdbWorker: any;
    let isRegisteringDuckDB = $state(false);

    onMount(async () => {
        datagenWorker = await WorkerManager.getDataGen();
        duckdbWorker = await WorkerManager.getDuckDB();

        // Initial setup data for testing ease
        inputContent = `{
  "type": "object",
  "properties": {
    "id": { "type": "integer" },
    "first_name": { "type": "string" },
    "last_name": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "integer", "minimum": 18, "maximum": 99 },
    "is_active": { "type": "boolean" },
    "created_at": { "type": "string", "format": "date-time" }
  }
}`;
    });

    const handleModeSwitch = (newMode: 'json' | 'sql') => {
        mode = newMode;
        if (mode === 'sql') {
            inputContent = `CREATE TABLE users (
    id INT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100),
    age INT,
    is_active BOOLEAN,
    created_at TIMESTAMP
);`;
        } else {
            inputContent = `{
  "type": "object",
  "properties": {
    "id": { "type": "integer" },
    "first_name": { "type": "string" },
    "last_name": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "integer", "minimum": 18, "maximum": 99 },
    "is_active": { "type": "boolean" },
    "created_at": { "type": "string", "format": "date-time" }
  }
}`;
        }
    };

    const generateData = async () => {
        isGenerating = true;
        errorMsg = '';
        generatedData = [];
        columns = [];

        try {
            if (!inputContent.trim()) {
                throw new Error("Input cannot be empty");
            }

            let data: any[] = [];
            const startTime = performance.now();

            if (mode === 'json') {
                const schema = JSON.parse(inputContent);
                data = await datagenWorker.generateFromJsonSchema(schema, rowCount, seed);
            } else {
                data = await datagenWorker.generateFromSqlDDL(inputContent, rowCount, seed);
            }

            const endTime = performance.now();
            console.log(`Generated ${rowCount} rows in ${endTime - startTime}ms`);

            if (data && data.length > 0) {
                // data here is just a preview (first 50 rows)
                generatedData = data;
                columns = Object.keys(data[0]);
            }
        } catch (e: any) {
            errorMsg = e.message || 'Error generating data';
            console.error(e);
        } finally {
            isGenerating = false;
        }
    };

    const downloadCsv = async () => {
        if (!generatedData.length) return;

        // The worker maintains the full dataset and returns the CSV string
        const csvContent = await datagenWorker.generateCsv();
        downloadFile(csvContent, 'generated_data.csv', 'text/csv');
    };

    const downloadJson = async () => {
        if (!generatedData.length) return;

        // The worker maintains the full dataset and returns the JSON string
        const jsonContent = await datagenWorker.generateJsonString();
        downloadFile(jsonContent, 'generated_data.json', 'application/json');
    };

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    };

    const loadIntoDuckDB = async () => {
        if (!generatedData.length) return;

        const userTableName = prompt("Enter a table name:", `generated_${Date.now()}`);
        if (!userTableName) return;

        isRegisteringDuckDB = true;
        try {
            // Do stringification in worker to avoid blocking main thread
            const jsonContent = await datagenWorker.generateJsonString();
            const blob = new Blob([jsonContent], { type: 'application/json' });

            const tableName = userTableName.replace(/[^a-zA-Z0-9_]/g, '_');
            const file = new File([blob], `${tableName}.json`, { type: 'application/json' });

            await duckdbWorker.registerFile(file, tableName);
            alert(`Successfully registered ${rowCount} rows as table '${tableName}' in DuckDB! Query it in the Analytics panel.`);
        } catch (e: any) {
            console.error(e);
            alert(`Error loading into DuckDB: ${e.message}`);
        } finally {
            isRegisteringDuckDB = false;
        }
    };

    const handleFileDrop = (e: DragEvent) => {
        e.preventDefault();

        const file = e.dataTransfer?.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            inputContent = content;
            if (file.name.endsWith('.sql')) {
                mode = 'sql';
            } else if (file.name.endsWith('.json')) {
                mode = 'json';
            }
        };
        reader.readAsText(file);
    };

    const allowDrop = (e: DragEvent) => {
        e.preventDefault();
    };

</script>

<div class="container mx-auto p-4 max-w-6xl">
    <h1 class="text-3xl font-bold mb-6">Test Data Generator</h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Input Section -->
        <div class="bg-white p-6 rounded-lg shadow">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold">Schema Input</h2>
                <div class="flex bg-gray-100 rounded-lg p-1">
                    <button
                        class="px-4 py-2 rounded-md text-sm font-medium transition-colors {mode === 'json' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}"
                        onclick={() => handleModeSwitch('json')}
                    >
                        JSON Schema
                    </button>
                    <button
                        class="px-4 py-2 rounded-md text-sm font-medium transition-colors {mode === 'sql' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}"
                        onclick={() => handleModeSwitch('sql')}
                    >
                        SQL DDL
                    </button>
                </div>
            </div>

            <textarea
                class="w-full h-64 p-3 border rounded-md font-mono text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                bind:value={inputContent}
                ondragover={allowDrop}
                ondrop={handleFileDrop}
                placeholder={`Paste your ${mode === 'json' ? 'JSON Schema' : 'SQL DDL'} here, or drag and drop a file...`}
            ></textarea>

            <div class="mt-4 grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1" for="row-count">
                        Rows to Generate: {rowCount.toLocaleString()}
                    </label>
                    <input id="row-count"
                        type="range"
                        min="1"
                        max="100000"
                        bind:value={rowCount}
                        class="w-full"
                    />
                    <input
                        type="number"
                        bind:value={rowCount}
                        min="1"
                        max="100000"
                        class="mt-1 w-full border rounded p-1 text-sm"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1" for="seed">
                        Seed (Optional)
                    </label>
                    <input id="seed"
                        type="number"
                        bind:value={seed}
                        placeholder="Leave blank for random"
                        class="w-full border rounded p-1 text-sm mt-1"
                    />
                </div>
            </div>

            <div class="mt-6">
                <button
                    onclick={generateData}
                    disabled={isGenerating || !inputContent.trim()}
                    class="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isGenerating ? 'Generating...' : 'Generate Data'}
                </button>
            </div>

            {#if errorMsg}
                <div class="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm border border-red-200">
                    {errorMsg}
                </div>
            {/if}
        </div>

        <!-- Preview Section -->
        <div class="bg-white p-6 rounded-lg shadow flex flex-col">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold">Preview (first 50 rows)</h2>

                {#if generatedData.length > 0}
                    <div class="flex space-x-2">
                        <button
                            onclick={loadIntoDuckDB}
                            disabled={isRegisteringDuckDB}
                            class="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 font-medium disabled:opacity-50"
                        >
                            {isRegisteringDuckDB ? 'Loading...' : 'Load into DuckDB'}
                        </button>
                        <button
                            onclick={downloadCsv}
                            class="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 font-medium"
                        >
                            CSV
                        </button>
                        <button
                            onclick={downloadJson}
                            class="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 font-medium"
                        >
                            JSON
                        </button>
                    </div>
                {/if}
            </div>

            <div class="flex-grow overflow-auto border rounded-md bg-gray-50">
                {#if generatedData.length > 0}
                    <table class="min-w-full divide-y divide-gray-200 text-sm">
                        <thead class="bg-gray-100 sticky top-0">
                            <tr>
                                <th class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">#</th>
                                {#each columns as col}
                                    <th class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{col}</th>
                                {/each}
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            {#each generatedData.slice(0, 50) as row, i}
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-2 text-gray-500 whitespace-nowrap">{i + 1}</td>
                                    {#each columns as col}
                                        <td class="px-4 py-2 whitespace-nowrap truncate max-w-xs" title={String(row[col])}>
                                            {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                                        </td>
                                    {/each}
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                {:else if isGenerating}
                    <div class="flex items-center justify-center h-full text-gray-500">
                        Generating data...
                    </div>
                {:else}
                    <div class="flex items-center justify-center h-full text-gray-400">
                        Generate data to see preview
                    </div>
                {/if}
            </div>

            {#if generatedData.length > 50}
                <div class="mt-2 text-xs text-gray-500 text-right">
                    Showing 50 of {generatedData.length.toLocaleString()} rows
                </div>
            {/if}
        </div>
    </div>
</div>
