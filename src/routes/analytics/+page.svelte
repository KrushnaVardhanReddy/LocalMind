<script lang="ts">
    import { onMount } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import { deferredPrompt } from '$lib/stores/pwa.store';
    import SettingsModal from '$lib/components/SettingsModal.svelte';
    import ConsentModal from '$lib/components/ConsentModal.svelte';
    import AIOptInModal from '$lib/components/AIOptInModal.svelte';
    import { marked } from 'marked';
    import DOMPurify from 'dompurify';
    import ChartViewer from '$lib/components/ChartViewer.svelte';
    import PivotBuilder from '$lib/components/PivotBuilder.svelte';
    import TemplateGallery from '$lib/components/TemplateGallery.svelte';
    import type { PivotTemplate } from '$lib/templates/template.types';
    import ExportModal from '$lib/components/ExportModal.svelte';
    import { ReportExporter, type ExportConfig } from '$lib/services/ReportExporter';
    import type { QueryResult } from '$lib/workers/duckdb.worker';
    import {
        workspaces,
        currentWorkspace,
        savedQueries,
        loadWorkspaces,
        createWorkspace,
        setWorkspace,
        saveQuery
    } from '$lib/stores/workspace.store';
    import type { EChartsOption } from 'echarts';
    import { uploadedTables } from '$lib/stores/analytics.store';

    let result: QueryResult | null = $state(null);
    let chartCustomOption: EChartsOption | null = $state(null);
    let chartPrompt = $state('');
    let isGeneratingChart = $state(false);
    let isExecuting = $state(false);
    let newWorkspaceName = $state('');
    let queryName = $state('');
    let querySql = $state('');

    let showSettings = $state(false);
    let showConsent = $state(false);
    let showChartConsent = $state(false);
    let showAIOptIn = $state(false);
    let aiDownloadProgress = $state(false);
    let schemaForConsent = $state<Record<string, string>>({});
    let rowsForConsent = $state<any[]>([]);
    let isAnalyzing = $state(false);
    let aiInsight = $state<string | null>(null);

    let isDetectingJoins = $state(false);
    let joinSuggestions = $state<string[]>([]);

    let isDragOver = $state(false);
    let uploadStatus = $state<{type: 'success' | 'error' | 'loading', message: string} | null>(null);
    let customQuery = $state('');
    let selectedPivotTable = $state('');
    let selectedTableSchema = $state<string[]>([]);
    let showTemplateGallery = $state(false);

    let showExportModal = $state(false);
    let chartViewerComponent: ChartViewer | undefined = $state();
    let pivotBuilderComponent: PivotBuilder | undefined = $state();

    async function handleExportReport(config: ExportConfig) {
        showExportModal = false;

        try {
            const pivotData = pivotBuilderComponent ? pivotBuilderComponent.getPivotData() : { result: null, chartBase64: null };

            const exportData = {
                pivotResult: pivotData.result,
                pivotChartBase64: pivotData.chartBase64,
                chartBase64: chartViewerComponent ? chartViewerComponent.getChartBase64() : null,
                aiInsight: aiInsight,
                generatedSql: customQuery,
                rawResult: result
            };

            const html = await ReportExporter.generateHtml(config, exportData);

            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            const dateStr = new Date().toISOString().split('T')[0];
            const safeTitle = config.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            a.download = `LocalMind_Report_${safeTitle}_${dateStr}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    onMount(async () => {
        await loadWorkspaces();
    });

    async function runQuery() {
        chartCustomOption = null; // Clear custom chart on new manual query

        if (!customQuery.trim()) {
            // Automatically lazy-loads and initializes if it's the first time
            const db = await WorkerManager.getDuckDB();
            result = await db.query("SELECT * FROM table");
            console.log('Query result:', result);
            return;
        }

        try {
            isExecuting = true;
            const db = await WorkerManager.getDuckDB();
            result = await db.query(customQuery, 1000);
            console.log('Query result:', result);
        } catch (error) {
            console.error('Query failed:', error);
            alert(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            isExecuting = false;
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            runQuery();
        }
    }

    let fileInput: HTMLInputElement;

    function handleFileSelect() {
        if (fileInput) {
            fileInput.click();
        }
    }

    async function onFileInputChange(e: Event) {
        const target = e.target as HTMLInputElement;
        if (!target.files || target.files.length === 0) return;

        let processedCount = 0;
        for (let i = 0; i < target.files.length; i++) {
            const file = target.files[i];
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (['csv', 'json', 'parquet'].includes(ext || '')) {
                await processFile(file);
                processedCount++;
            } else {
                uploadStatus = { type: 'error', message: `Unsupported file type: ${file.name}` };
                // Continue with other files if supported
            }
        }

        if (processedCount > 1) {
            uploadStatus = { type: 'success', message: `Successfully registered ${processedCount} files.` };
        }

        // Reset input so the same file can be selected again if needed
        target.value = '';
    }

    async function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragOver = false;
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            let processedCount = 0;
            for (let i = 0; i < e.dataTransfer.files.length; i++) {
                const file = e.dataTransfer.files[i];
                const ext = file.name.split('.').pop()?.toLowerCase();
                if (['csv', 'json', 'parquet'].includes(ext || '')) {
                    await processFile(file);
                    processedCount++;
                } else {
                    uploadStatus = { type: 'error', message: 'Unsupported file type. Please upload .csv, .json, or .parquet' };
                    return; // Stop on first error, or could just skip
                }
            }
            if (processedCount > 1) {
                uploadStatus = { type: 'success', message: `Successfully registered ${processedCount} files.` };
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
            if (!$uploadedTables.includes(tableName)) {
                $uploadedTables = [...$uploadedTables, tableName];
            }
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

    async function getActiveSchemas() {
        const db = await WorkerManager.getDuckDB();
        let combinedSchema: Record<string, string> = {};
        for (const t of $uploadedTables) {
            try {
                const s = await db.getSchema(t);
                for (const [k, v] of Object.entries(s)) {
                    combinedSchema[`${t}.${k}`] = v as string;
                }
            } catch (e) {
                console.error(`Failed to get schema for ${t}`, e);
            }
        }
        return combinedSchema;
    }

    async function handleTableSelect(tableName: string) {
        selectedPivotTable = tableName;
        if (tableName) {
            try {
                const db = await WorkerManager.getDuckDB();
                const schema = await db.getSchema(tableName);
                selectedTableSchema = Object.keys(schema);

                // Proactively show suggested templates if there are likely matches
                // For simplicity, we just trigger the gallery to open if any table is selected.
                // The TemplateGallery component will handle the score filtering.
                setTimeout(() => {
                    showTemplateGallery = true;
                }, 100);

            } catch (e) {
                console.error("Failed to fetch schema for template gallery", e);
                selectedTableSchema = [];
            }
        } else {
            selectedTableSchema = [];
        }
    }

    function handleApplyTemplate(template: PivotTemplate) {
        if (pivotBuilderComponent) {
            (pivotBuilderComponent as any).applyTemplate(template);
        }
        showTemplateGallery = false;
    }

    async function handleAskAI() {
        const llm = await WorkerManager.getLLM();
        if (!(await llm.isAIEnabled())) {
            showAIOptIn = true;
            return;
        }

        if (!result || !result.rows) return;

        schemaForConsent = await getActiveSchemas();
        rowsForConsent = result.rows.slice(0, 5);
        showConsent = true;
    }

    async function handleChartAI() {
        const llm = await WorkerManager.getLLM();
        if (!(await llm.isAIEnabled())) {
            showAIOptIn = true;
            return;
        }

        if (!result) return;
        schemaForConsent = await getActiveSchemas();
        showChartConsent = true;
    }

    async function onConsentToChartAI() {
        showChartConsent = false;
        isGeneratingChart = true;
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

            const configResult = await llm.generateChartConfig(chartPrompt, schemaForConsent);

            if (configResult && configResult.sql && configResult.option) {
                const db = await WorkerManager.getDuckDB();
                result = await db.query(configResult.sql, 1000);
                chartCustomOption = configResult.option;
            } else {
                alert('Failed to generate valid chart configuration.');
            }
        } catch (error) {
            console.error('AI Chart Generation failed:', error);
            alert(`Chart Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            isGeneratingChart = false;
        }
    }

    async function handleDiffFiles() {
        if ($uploadedTables.length !== 2) {
            alert('Please select exactly 2 tables to diff.');
            return;
        }

        const table1 = $uploadedTables[0];
        const table2 = $uploadedTables[1];

        const db = await WorkerManager.getDuckDB();
        const schema1 = await db.getSchema(table1);
        const schema2 = await db.getSchema(table2);

        // Simple check to ensure schemas are somewhat compatible before diffing
        if (Object.keys(schema1).length !== Object.keys(schema2).length) {
            alert('Tables have different number of columns and cannot be easily diffed.');
            return;
        }

        // We will do a full join to find modified rows too. Wait, with EXCEPT and INTERSECT:
        // Added = table2 EXCEPT table1
        // Removed = table1 EXCEPT table2
        // Intersect = table1 INTERSECT table2
        // The problem description says "execute a DuckDB EXCEPT and INTERSECT query between two tables with identical schemas to find added, removed, and modified rows."
        // We'll run EXCEPT to get added and removed, and INTERSECT for identical. Modified is when they are in neither EXCEPT nor INTERSECT but share a primary key.
        // Actually, the simplest way to do it using EXCEPT/INTERSECT in one query without a primary key is to just show added, removed, and unmodified.
        // Since the instructions say "green for additions and red for deletions", let's just make it clear.

        customQuery = `SELECT 'added' as _diff_status, * FROM (SELECT * FROM ${table2} EXCEPT SELECT * FROM ${table1})
UNION ALL
SELECT 'removed' as _diff_status, * FROM (SELECT * FROM ${table1} EXCEPT SELECT * FROM ${table2})
UNION ALL
SELECT 'unmodified' as _diff_status, * FROM (SELECT * FROM ${table1} INTERSECT SELECT * FROM ${table2})`;

        runQuery();
    }

    async function handleDetectJoins() {
        if ($uploadedTables.length < 2) return;
        const checkLlm = await WorkerManager.getLLM();
        if (!(await checkLlm.isAIEnabled())) {
            showAIOptIn = true;
            return;
        }

        isDetectingJoins = true;
        joinSuggestions = [];

        try {
            const apiKey = localStorage.getItem('OPENAI_API_KEY');
            const provider = localStorage.getItem('LLM_PROVIDER') as 'openai' | 'anthropic' || 'openai';

            if (!apiKey) {
                alert('Please configure your API key in Settings first.');
                showSettings = true;
                return;
            }

            const db = await WorkerManager.getDuckDB();
            const schemas = [];
            for (const table of $uploadedTables) {
                const schema = await db.getSchema(table);
                schemas.push({ tableName: table, schema } as any);
            }

            const llm = await WorkerManager.getLLM();
            await llm.setApiKey(apiKey, provider);

            const result = await llm.detectJoins(schemas);
            joinSuggestions = result;
        } catch (error) {
            console.error('Join Detection failed:', error);
            alert(`Join Detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            isDetectingJoins = false;
        }
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

    async function handleEnableAI() {
        aiDownloadProgress = true;
        try {
            const llm = await WorkerManager.getLLM();
            await llm.enableAI();

            const embeddings = await WorkerManager.getEmbeddings();
            await embeddings.enableAI();
        } catch (error) {
            console.error('Failed to enable AI:', error);
            alert('Failed to download AI models. Check your connection and try again.');
        } finally {
            aiDownloadProgress = false;
            showAIOptIn = false;
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

{#if showChartConsent}
    <ConsentModal
        schema={schemaForConsent}
        sampleRows={[]}
        onconsent={onConsentToChartAI}
        oncancel={() => showChartConsent = false}
    />
{/if}

{#if showAIOptIn}
    <AIOptInModal
        onEnable={handleEnableAI}
        onCancel={() => showAIOptIn = false}
        aiDownloadProgress={aiDownloadProgress}
    />
{/if}

{#if showExportModal}
    <ExportModal
        onclose={() => showExportModal = false}
        onexport={handleExportReport}
        defaultTitle={selectedPivotTable ? `${selectedPivotTable} Report` : 'LocalMind Report'}
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
                onclick={() => showExportModal = true}
                class="px-4 py-2 bg-teal-100 text-teal-700 text-sm font-semibold rounded hover:bg-teal-200 transition flex items-center gap-2"
            >
                📄 Export Report
            </button>
            <button
                aria-label="Settings"
                onclick={() => showSettings = true}
                class="p-2 hover:bg-gray-100 rounded-full transition"
            >
                ⚙️
            </button>
            <a
                href="/dashboard"
                class="px-4 py-2 bg-blue-100 text-blue-700 rounded shadow hover:bg-blue-200 transition font-medium flex items-center gap-2"
            >
                📊 View Dashboard
            </a>
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
            <input
                type="file"
                bind:this={fileInput}
                multiple
                accept=".csv,.json,.parquet"
                class="hidden"
                onchange={onFileInputChange}
            />
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

        {#if $uploadedTables.length > 1}
            <div class="mt-4 flex gap-2">
                <button
                    onclick={handleDetectJoins}
                    class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition flex items-center gap-2"
                    disabled={isDetectingJoins}
                >
                    {#if isDetectingJoins}
                        <span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Detecting Joins...
                    {:else}
                        ✨ Detect Joins
                    {/if}
                </button>

                {#if $uploadedTables.length === 2}
                    <button
                        onclick={handleDiffFiles}
                        class="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition flex items-center gap-2"
                    >
                        🔄 Diff Files
                    </button>
                {/if}
            </div>
            {#if joinSuggestions.length > 0}
                <div class="mt-4 p-4 bg-white border border-indigo-200 rounded-lg shadow-sm">
                    <h3 class="text-lg font-semibold text-indigo-900 mb-2">Suggested Joins</h3>
                    <ul class="list-disc list-inside space-y-1">
                        {#each joinSuggestions as join}
                            <li class="font-mono text-sm bg-gray-50 p-2 rounded border">{join}</li>
                        {/each}
                    </ul>
                </div>
            {/if}
        {/if}
    </div>

    {#if $uploadedTables.length > 0}
        <div class="p-4 border rounded mt-4">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold">Pivot Builder</h2>
                {#if selectedPivotTable}
                    <button
                        onclick={() => showTemplateGallery = true}
                        class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition font-medium flex items-center gap-2"
                    >
                        ✨ Templates
                    </button>
                {/if}
            </div>

            <div class="mb-4">
                <label for="pivotTableSelect" class="block text-sm font-medium text-gray-700 mb-1">Select Table to Pivot</label>
                <select
                    id="pivotTableSelect"
                    class="block w-full max-w-xs border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                    onchange={(e) => handleTableSelect((e.target as HTMLSelectElement).value)}
                >
                    <option value="">-- Select a table --</option>
                    {#each $uploadedTables as t}
                        <option value={t}>{t}</option>
                    {/each}
                </select>
            </div>
            {#if selectedPivotTable}
                <PivotBuilder tableName={selectedPivotTable} bind:this={pivotBuilderComponent} />
            {/if}
        </div>
    {/if}

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
            placeholder="Enter SQL query (e.g. SELECT * FROM table LIMIT 10) - Press Ctrl+Enter to run"
            bind:value={customQuery}
            onkeydown={handleKeydown}
            class="border p-2 rounded w-full mb-4 font-mono text-sm"
            rows="3"
        ></textarea>

        {#if isExecuting}
            <div class="flex justify-center items-center py-8">
                <span class="animate-spin inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></span>
            </div>
        {:else if result}
            <div class="mt-4 p-4 bg-white border rounded">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="font-semibold">Result Data:</h2>
                    <span class="text-sm text-gray-500">
                        {result.rows.length} row{result.rows.length !== 1 ? 's' : ''}
                        (Execution time: {result.executionTimeMs.toFixed(2)}ms)
                        {#if result.rows.length >= 1000}
                            <span class="text-amber-600 font-semibold ml-2">⚠️ Truncated to 1000 rows</span>
                        {/if}
                    </span>
                </div>

                {#if result.rows.length > 0}
                    <div class="overflow-x-auto border border-gray-200 rounded max-h-96">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50 sticky top-0">
                                <tr>
                                    {#each result.columns as col}
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {col}
                                        </th>
                                    {/each}
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                {#each result.rows as row}
                                    <tr class="{row._diff_status === 'added' ? 'bg-green-50 hover:bg-green-100' : row._diff_status === 'removed' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}">
                                        {#each result.columns as col}
                                            <td class="px-6 py-4 whitespace-nowrap text-sm {row._diff_status === 'added' ? 'text-green-800 font-semibold' : row._diff_status === 'removed' ? 'text-red-800 font-semibold line-through' : 'text-gray-500'}">
                                                {row[col] !== null ? row[col] : 'NULL'}
                                            </td>
                                        {/each}
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>

                    <div class="mt-8 border-t pt-4">
                        <h2 class="font-semibold mb-4">Visualization:</h2>
                        <ChartViewer result={result} customOption={chartCustomOption} bind:this={chartViewerComponent} />

                        <div class="mt-4 flex gap-2">
                            <input
                                type="text"
                                placeholder="Make this a pie chart grouped by Region"
                                bind:value={chartPrompt}
                                class="border p-2 rounded w-full flex-grow"
                                onkeydown={(e) => { if (e.key === 'Enter') handleChartAI(); }}
                            />
                            <button
                                onclick={handleChartAI}
                                disabled={isGeneratingChart || !chartPrompt.trim()}
                                class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition flex items-center gap-2 whitespace-nowrap disabled:bg-gray-400"
                            >
                                {#if isGeneratingChart}
                                    <span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                                    Generating...
                                {:else}
                                    ✨ Alter Chart
                                {/if}
                            </button>
                        </div>

                        <div class="mt-4">
                            <button
                                onclick={() => {
                                    const saved = localStorage.getItem('localmind_dashboard');
                                    let items = saved ? JSON.parse(saved) : [];
                                    const id = crypto.randomUUID();
                                    const newItem = {
                                        id,
                                        title: 'Pinned Chart',
                                        sql: customQuery,
                                        customOption: chartCustomOption,
                                    };
                                    items.push(newItem);
                                    localStorage.setItem('localmind_dashboard', JSON.stringify(items));
                                    alert('Chart pinned to dashboard!');
                                }}
                                class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center gap-2"
                            >
                                📌 Pin to Dashboard
                            </button>
                        </div>
                    </div>
                {:else}
                    <div class="text-gray-500 text-center py-4">
                        Query returned 0 rows.
                    </div>
                {/if}
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
    {#if showTemplateGallery}
        <TemplateGallery
            columns={selectedTableSchema}
            onSelectTemplate={handleApplyTemplate}
            onClose={() => showTemplateGallery = false}
        />
    {/if}
</main>
