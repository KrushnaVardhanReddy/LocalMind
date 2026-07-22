<script lang="ts">
    import { onMount } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import { deferredPrompt } from '$lib/stores/pwa.store';
    import SettingsModal from '$lib/components/SettingsModal.svelte';
    import ConsentModal from '$lib/components/ConsentModal.svelte';
    import { marked } from 'marked';
    import DOMPurify from 'dompurify';
    import {
        workspaces,
        currentWorkspace,
        savedQueries,
        loadWorkspaces,
        createWorkspace,
        setWorkspace,
        saveQuery
    } from '$lib/stores/workspace.store';

    let result: any = $state(null);
    let newWorkspaceName = $state('');
    let queryName = $state('');
    let querySql = $state('');

    let showSettings = $state(false);
    let showConsent = $state(false);
    let schemaForConsent = $state<Record<string, string>>({});
    let rowsForConsent = $state<any[]>([]);
    let isAnalyzing = $state(false);
    let aiInsight = $state<string | null>(null);

    let isDragOver = $state(false);
    let uploadStatus = $state<{type: 'success' | 'error' | 'loading', message: string} | null>(null);
    let customQuery = $state('');

    onMount(async () => {
        await loadWorkspaces();
    });

    async function runQuery() {
        if (!customQuery.trim()) {
            // Automatically lazy-loads and initializes if it's the first time
            const db = await WorkerManager.getDuckDB();
            result = await db.query("SELECT * FROM table");
            console.log('Query result:', result);
            return;
        }

        try {
            const db = await WorkerManager.getDuckDB();
            result = await db.query(customQuery);
            console.log('Query result:', result);
        } catch (error) {
            console.error('Query failed:', error);
            alert(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async function handleFileSelect() {
        try {
            const [fileHandle] = await (window as any).showOpenFilePicker({
                types: [
                    {
                        description: 'Data Files',
                        accept: {
                            'text/csv': ['.csv'],
                            'application/json': ['.json'],
                            'application/vnd.apache.parquet': ['.parquet']
                        }
                    }
                ]
            });
            const file = await fileHandle.getFile();
            await processFile(file);
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('File selection failed:', error);
                uploadStatus = { type: 'error', message: `File selection failed: ${error.message}` };
            }
        }
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragOver = false;
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (['csv', 'json', 'parquet'].includes(ext || '')) {
                processFile(file);
            } else {
                uploadStatus = { type: 'error', message: 'Unsupported file type. Please upload .csv, .json, or .parquet' };
            }
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        isDragOver = true;
    }

    function handleDragLeave() {
        isDragOver = false;
    }

    async function processFile(file: File) {
        uploadStatus = { type: 'loading', message: `Registering ${file.name}...` };
        try {
            const tableName = file.name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
            const db = await WorkerManager.getDuckDB();
            await db.registerFile(file, tableName);
            uploadStatus = { type: 'success', message: `Successfully registered file as table: ${tableName}` };
            customQuery = `SELECT * FROM ${tableName} LIMIT 10`;
        } catch (error) {
            console.error('Failed to register file:', error);
            uploadStatus = { type: 'error', message: `Failed to register file: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
    }

    async function handleCreateWorkspace() {
        if (!newWorkspaceName.trim()) return;
        await createWorkspace(newWorkspaceName);
        newWorkspaceName = '';
    }

    async function handleSaveQuery() {
        if (!queryName.trim() || !querySql.trim()) return;
        await saveQuery(queryName, querySql);
        queryName = '';
        querySql = '';
    }

    async function installApp() {
        if (!$deferredPrompt) return;
        $deferredPrompt.prompt();
        const { outcome } = await $deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            deferredPrompt.set(null);
        }
    }

    async function handleAskAI() {
        if (!result || !result.rows) return;

        const db = await WorkerManager.getDuckDB();
        schemaForConsent = await db.getSchema("stub_table"); // Using stub_table as we only have stub data
        rowsForConsent = result.rows.slice(0, 5);
        showConsent = true;
    }

    async function onConsentToAI() {
        showConsent = false;
        isAnalyzing = true;
        aiInsight = null;

        try {
            const apiKey = localStorage.getItem('OPENAI_API_KEY');
            const provider = localStorage.getItem('LLM_PROVIDER') as 'openai' | 'anthropic' || 'openai';

            if (!apiKey) {
                alert('Please configure your API key in Settings first.');
                showSettings = true;
                return;
            }

            const llm = await WorkerManager.getLLM();
            await llm.setApiKey(apiKey, provider);

            const prompt = "Please analyze the following data schema and sample rows. Give a brief summary of what this data represents and highlight any interesting patterns.";
            const dataSample = JSON.stringify({
                schema: schemaForConsent,
                rows: rowsForConsent
            });

            const markdown = await llm.analyzeData(prompt, dataSample);
            const parsedHtml = await marked.parse(markdown);
            aiInsight = DOMPurify.sanitize(parsedHtml);
        } catch (error) {
            console.error('AI Analysis failed:', error);
            aiInsight = `<div class="text-red-600">Error: ${error instanceof Error ? error.message : 'Analysis failed'}</div>`;
        } finally {
            isAnalyzing = false;
        }
    }
</script>

{#if showSettings}
    <SettingsModal onclose={() => showSettings = false} />
{/if}

{#if showConsent}
    <ConsentModal
        schema={schemaForConsent}
        sampleRows={rowsForConsent}
        onconsent={onConsentToAI}
        oncancel={() => showConsent = false}
    />
{/if}

<main class="p-8 max-w-4xl mx-auto">
    <div class="flex justify-between items-center mb-8 bg-white p-4 shadow rounded">
        <div class="flex items-center gap-4">
            <h1 class="text-2xl font-bold">LocalMind</h1>
            {#if $deferredPrompt}
                <button
                    onclick={installApp}
                    class="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded hover:bg-purple-200 transition"
                >
                    Install App
                </button>
            {/if}
            <button
                aria-label="Settings"
                onclick={() => showSettings = true}
                class="p-2 hover:bg-gray-100 rounded-full transition"
            >
                ⚙️
            </button>
        </div>

        <div class="flex items-center gap-4">
            <select
                class="border rounded p-2"
                value={$currentWorkspace?.id || ''}
                onchange={(e) => setWorkspace(e.currentTarget.value)}
            >
                <option value="" disabled>Select Workspace...</option>
                {#each $workspaces as ws}
                    <option value={ws.id}>{ws.name}</option>
                {/each}
            </select>

            <div class="flex items-center gap-2">
                <input
                    type="text"
                    placeholder="New Workspace Name"
                    bind:value={newWorkspaceName}
                    class="border rounded p-2 text-sm"
                />
                <button
                    onclick={handleCreateWorkspace}
                    class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition whitespace-nowrap"
                >
                    New Workspace
                </button>
            </div>
        </div>
    </div>

    {#if $currentWorkspace}
        <div class="mb-8 p-4 bg-gray-50 border rounded">
            <h2 class="text-xl font-semibold mb-4">Workspace: {$currentWorkspace.name}</h2>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <h3 class="font-medium mb-2">Save a Query</h3>
                    <input type="text" placeholder="Query Name" bind:value={queryName} class="border p-2 rounded w-full mb-2" />
                    <textarea placeholder="SQL Query" bind:value={querySql} class="border p-2 rounded w-full mb-2" rows="3"></textarea>
                    <button
                        onclick={handleSaveQuery}
                        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        Save Query
                    </button>
                </div>

                <div>
                    <h3 class="font-medium mb-2">Saved Queries ({$savedQueries.length})</h3>
                    <ul class="space-y-2 max-h-48 overflow-y-auto">
                        {#each $savedQueries as q}
                            <li class="p-2 bg-white border rounded text-sm">
                                <strong>{q.name}</strong><br/>
                                <span class="text-gray-500 font-mono">{q.sql}</span>
                            </li>
                        {/each}
                        {#if $savedQueries.length === 0}
                            <li class="text-gray-500 text-sm">No saved queries yet.</li>
                        {/if}
                    </ul>
                </div>
            </div>
        </div>
    {:else}
        <div class="mb-8 p-8 bg-gray-50 border rounded text-center text-gray-500">
            Please create or select a workspace to continue.
        </div>
    {/if}

    <div class="mb-8 p-4 bg-gray-50 border rounded">
        <h2 class="text-xl font-semibold mb-4">Data Ingestion</h2>

        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="border-2 border-dashed rounded-lg p-8 text-center transition-colors {isDragOver ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'}"
            ondrop={handleDrop}
            ondragover={handleDragOver}
            ondragleave={handleDragLeave}
        >
            <div class="mb-4 text-gray-600">
                Drag and drop a .csv, .json, or .parquet file here
            </div>
            <div class="text-gray-400 mb-4">or</div>
            <button
                onclick={handleFileSelect}
                class="px-6 py-2 bg-purple-600 text-white rounded shadow hover:bg-purple-700 transition"
            >
                Select File
            </button>
        </div>

        {#if uploadStatus}
            <div class="mt-4 p-3 rounded text-sm {uploadStatus.type === 'success' ? 'bg-green-100 text-green-800' : uploadStatus.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}">
                {uploadStatus.message}
            </div>
        {/if}
    </div>

    <div class="p-4 border rounded">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Query Data</h2>
            <div class="flex gap-2">
                <button
                    onclick={runQuery}
                    class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                >
                    Run Query
                </button>
                {#if result}
                    <button
                        onclick={handleAskAI}
                        class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition flex items-center gap-2"
                        disabled={isAnalyzing}
                    >
                        {#if isAnalyzing}
                            <span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                            Analyzing...
                        {:else}
                            ✨ Ask AI to Analyze
                        {/if}
                    </button>
                {/if}
            </div>
        </div>

        <textarea
            placeholder="Enter SQL query (e.g. SELECT * FROM table LIMIT 10)"
            bind:value={customQuery}
            class="border p-2 rounded w-full mb-4 font-mono text-sm"
            rows="3"
        ></textarea>

        {#if result}
            <div class="mt-4 p-4 bg-gray-100 rounded">
                <h2 class="font-semibold">Result:</h2>
                <pre class="text-sm mt-2">{JSON.stringify(result, null, 2)}</pre>
            </div>
        {/if}

        {#if isAnalyzing}
            <div class="mt-4 p-6 border border-indigo-100 bg-indigo-50/50 rounded-lg animate-pulse">
                <div class="h-4 bg-indigo-200 rounded w-1/4 mb-4"></div>
                <div class="h-3 bg-indigo-100 rounded w-full mb-2"></div>
                <div class="h-3 bg-indigo-100 rounded w-5/6 mb-2"></div>
                <div class="h-3 bg-indigo-100 rounded w-4/6"></div>
            </div>
        {:else if aiInsight}
            <div class="mt-4 p-6 border border-indigo-200 bg-white rounded-lg shadow-sm">
                <h3 class="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                    ✨ AI Insights
                </h3>
                <div class="prose prose-sm prose-indigo max-w-none">
                    {@html aiInsight}
                </div>
            </div>
        {/if}
    </div>
</main>
