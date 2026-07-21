<script lang="ts">
    import { onMount } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';
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

    onMount(async () => {
        await loadWorkspaces();
    });

    async function runQuery() {
        // Automatically lazy-loads and initializes if it's the first time
        const db = await WorkerManager.getDuckDB();
        result = await db.query("SELECT * FROM table");
        console.log('Query result:', result);
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

    <div class="p-4 border rounded">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">DuckDB Test</h2>
            <div class="flex gap-2">
                <button
                    onclick={runQuery}
                    class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                >
                    Run Stub Query
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
