<script lang="ts">
    import { onMount } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import type { LogParserWorkerContract, LogPattern, LogParseResult, AnomalyCluster } from '$lib/workers/log-parser.worker';
    // @ts-expect-error No type declarations available for this package
    import VirtualList from 'svelte-virtual-list-ce';

    let logParser: LogParserWorkerContract = $state() as unknown as LogParserWorkerContract;
    let db: any = $state();
    let isReady = $state(false);

    let fileInput: HTMLInputElement = $state() as unknown as HTMLInputElement;
    let loading = $state(false);
    let errorStr = $state('');
    let lineCount = $state(0);

    let logLines: string[] = $state([]);
    let suggestedPattern: LogPattern | null = $state(null);
    let parsedData: LogParseResult | null = $state(null);
    let anomalyClusters: AnomalyCluster[] = $state([]);

    let patternRegexInput = $state('');

    onMount(async () => {
        try {
            logParser = await WorkerManager.getLogParser() as unknown as LogParserWorkerContract;
            db = await WorkerManager.getDuckDB();
            const embedder = await WorkerManager.getEmbeddings();
            await logParser.init(db, embedder);
            isReady = true;
        } catch (e: any) {
            errorStr = 'Failed to initialize workers: ' + e.message;
        }
    });

    async function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        loading = true;
        errorStr = '';
        logLines = [];
        suggestedPattern = null;
        parsedData = null;
        anomalyClusters = [];

        try {
            const file = input.files[0];
            const result = await logParser.loadLog(file);
            lineCount = result.lineCount;

            const res = await db.query('SELECT raw_line FROM raw_lines LIMIT 500', 500);
            logLines = res.rows.map((r: any) => r.raw_line);
        } catch (e: any) {
            errorStr = 'Failed to load log: ' + e.message;
        } finally {
            loading = false;
        }
    }

    async function handleSelection() {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;
        const text = selection.toString().trim();
        if (!text) return;

        try {
            loading = true;
            suggestedPattern = await logParser.suggestPattern(text);
            patternRegexInput = suggestedPattern.regex;
        } catch (e: any) {
            errorStr = 'Failed to suggest pattern: ' + e.message;
        } finally {
            loading = false;
        }
    }

    async function handleApplyPattern() {
        if (!suggestedPattern) return;
        loading = true;
        errorStr = '';
        try {
            // Update regex in case user edited it
            suggestedPattern.regex = patternRegexInput;
            parsedData = await logParser.applyPattern(suggestedPattern);
        } catch (e: any) {
            errorStr = 'Failed to apply pattern: ' + e.message;
        } finally {
            loading = false;
        }
    }

    async function handleDetectAnomalies() {
        loading = true;
        errorStr = '';
        try {
            anomalyClusters = await logParser.clusterAnomalies(8);
        } catch (e: any) {
            errorStr = 'Failed to detect anomalies: ' + e.message;
        } finally {
            loading = false;
        }
    }

    function exportAnomalies() {
        const anomalies = anomalyClusters.filter(c => c.isAnomaly);
        if (anomalies.length === 0) return;

        let text = anomalies.map(c => `Cluster Size: ${c.size}\nCentroid: ${c.centroid}\nSample Lines:\n${c.sampleLines.join('\n')}`).join('\n\n---\n\n');

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'anomalies.txt';
        a.click();
        URL.revokeObjectURL(url);
    }
</script>

<div class="container mx-auto p-4 max-w-7xl" role="button" tabindex="0" onmouseup={handleSelection}>
    <h1 class="text-3xl font-bold mb-6 text-slate-800">Visual Log Parser & Anomaly Detector</h1>

    {#if !isReady}
        <div class="p-4 bg-yellow-50 text-yellow-800 rounded mb-4">Initializing WASM Workers...</div>
    {/if}

    {#if errorStr}
        <div class="p-4 bg-red-100 text-red-800 rounded mb-4 shadow">{errorStr}</div>
    {/if}

    <div class="mb-6 p-6 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 text-center hover:bg-slate-100 transition-colors">
        <label class="cursor-pointer flex flex-col items-center justify-center">
            <span class="text-slate-600 font-medium mb-2">Drop a raw .log or .txt file here, or click to browse</span>
            <input
                type="file"
                class="hidden"
                bind:this={fileInput}
                onchange={handleFileChange}
                disabled={!isReady || loading}
            />
            <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50" disabled={!isReady || loading} onclick={() => fileInput.click()}>
                Select Log File
            </button>
        </label>
        {#if lineCount > 0}
            <div class="mt-4 text-sm text-green-600 font-semibold">Loaded {lineCount.toLocaleString()} lines</div>
        {/if}
    </div>

    <!-- Viewer and Editor Area -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Raw Log Viewer -->
        {#if logLines.length > 0}
            <div class="bg-white border rounded shadow flex flex-col h-[600px]">
                <div class="p-3 border-b bg-slate-50 font-semibold text-slate-700 flex justify-between items-center">
                    <span>Raw Log (First {logLines.length} lines)</span>
                    <span class="text-xs font-normal text-slate-500">Highlight a line to generate a pattern</span>
                </div>
                <div class="flex-1 overflow-auto p-2 bg-slate-900 text-green-400 font-mono text-sm whitespace-pre relative">
                    <VirtualList items={logLines} let:item>
                        <div class="hover:bg-slate-800 px-1">{item}</div>
                    </VirtualList>
                </div>
            </div>
        {/if}

        <!-- Right Side panels -->
        <div class="flex flex-col gap-6">

            <!-- Pattern Editor -->
            {#if suggestedPattern}
                <div class="bg-white border rounded shadow p-4">
                    <h3 class="font-semibold text-slate-800 mb-3">Suggested Pattern</h3>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-slate-700 mb-1" for="regex-pattern">Regex Pattern (DuckDB syntax)</label>
                        <input id="regex-pattern"
                            type="text"
                            class="w-full border rounded p-2 font-mono text-sm"
                            bind:value={patternRegexInput}
                        />
                    </div>
                    <div class="mb-4">
                        <span class="text-sm font-medium text-slate-700">Extracted Columns:</span>
                        <div class="flex flex-wrap gap-2 mt-1">
                            {#each suggestedPattern.columns as col}
                                <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-mono">{col}</span>
                            {/each}
                        </div>
                    </div>
                    <button class="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium disabled:opacity-50" onclick={handleApplyPattern} disabled={loading}>
                        {loading ? 'Applying...' : 'Apply Pattern'}
                    </button>
                </div>
            {/if}

            <!-- Anomaly Detection -->
            {#if parsedData}
                <div class="bg-white border rounded shadow p-4">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-semibold text-slate-800">Anomaly Detection</h3>
                        <button class="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50" onclick={handleDetectAnomalies} disabled={loading}>
                            Detect Anomalies
                        </button>
                    </div>

                    {#if anomalyClusters.length > 0}
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-slate-600">Identified {anomalyClusters.length} clusters</span>
                                <button class="px-3 py-1 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300" onclick={exportAnomalies}>
                                    Export Anomalies
                                </button>
                            </div>

                            <div class="flex gap-1 h-12 w-full rounded overflow-hidden">
                                {#each anomalyClusters as cluster}
                                    <div
                                        class="h-full {cluster.isAnomaly ? 'bg-red-500' : 'bg-slate-400'} border-r border-white/20 last:border-0 hover:opacity-80 transition-opacity"
                                        style="flex-grow: {cluster.size};"
                                        title="{cluster.size} lines\n{cluster.centroid}"
                                    ></div>
                                {/each}
                            </div>

                            <div class="mt-4">
                                <h4 class="text-sm font-medium text-slate-700 mb-2">Anomalous Clusters (Red)</h4>
                                <div class="space-y-2">
                                    {#each anomalyClusters.filter(c => c.isAnomaly) as cluster}
                                        <div class="p-3 bg-red-50 border border-red-100 rounded text-sm text-red-900 font-mono break-all">
                                            <div class="font-semibold text-red-700 mb-1 border-b border-red-200 pb-1">Size: {cluster.size} lines</div>
                                            {cluster.centroid}
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    </div>

    <!-- Structured Data Grid -->
    {#if parsedData}
        <div class="mt-6 bg-white border rounded shadow overflow-hidden">
            <div class="p-4 border-b bg-slate-50 flex justify-between items-center">
                <h3 class="font-semibold text-slate-800">Structured Data</h3>
                <span class="text-sm text-slate-500">
                    Matched {parsedData.rowCount - parsedData.unmatchedLines} / {parsedData.rowCount} lines
                    ({parsedData.executionTimeMs.toFixed(0)}ms)
                </span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm whitespace-nowrap">
                    <thead class="bg-slate-100 text-slate-600 font-semibold border-b">
                        <tr>
                            {#each parsedData.columns as col}
                                <th class="px-4 py-2 border-r last:border-0">{col}</th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody class="divide-y text-slate-700 font-mono">
                        {#each parsedData.sample as row}
                            <tr class="hover:bg-slate-50">
                                {#each parsedData.columns as col}
                                    <td class="px-4 py-2 border-r last:border-0 max-w-xs truncate" title={row[col]}>{row[col] || '-'}</td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
</div>
