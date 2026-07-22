<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { parseOpenAPI, type ParsedEndpoint } from '$lib/utils/openapi-parser';
    import { generateHandlers, type EndpointConfig } from '$lib/mock-server/handler-generator';
    import { startMockServer, stopMockServer } from '$lib/mock-server/index';
    import * as yaml from 'js-yaml';

    let isServerRunning = false;
    let dragOver = false;
    let endpointConfigs: EndpointConfig[] = [];
    let activityLog: Array<{ method: string, path: string, status: number, latency: number, time: Date }> = [];
    let workerInstance: any = null;
    let parseError = '';

    // Status color mapping for badge
    function getMethodColor(method: string) {
        switch (method.toLowerCase()) {
            case 'get': return 'bg-blue-100 text-blue-800';
            case 'post': return 'bg-green-100 text-green-800';
            case 'put': return 'bg-yellow-100 text-yellow-800';
            case 'delete': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    async function handleDrop(e: DragEvent) {
        e.preventDefault();
        dragOver = false;
        parseError = '';

        if (!e.dataTransfer?.files.length) return;

        const file = e.dataTransfer.files[0];
        if (!file.name.endsWith('.json') && !file.name.endsWith('.yaml') && !file.name.endsWith('.yml')) {
            parseError = 'Please drop a .json or .yaml file';
            return;
        }

        const text = await file.text();
        try {
            let specContent: any;
            if (file.name.endsWith('.json')) {
                specContent = JSON.parse(text);
            } else {
                specContent = yaml.load(text);
            }

            const endpoints = await parseOpenAPI(specContent);
            endpointConfigs = endpoints.map(ep => ({
                endpoint: ep,
                enabled: true,
                statusOverride: undefined,
                latencyOverride: undefined
            }));

            // Auto stop server if new spec dropped
            if (isServerRunning) {
                await stopServer();
            }
        } catch (err: any) {
            parseError = `Failed to parse OpenAPI spec: ${err.message}`;
            console.error(err);
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        dragOver = true;
    }

    function handleDragLeave(e: DragEvent) {
        e.preventDefault();
        dragOver = false;
    }

    async function startServer() {
        if (endpointConfigs.length === 0) return;

        try {
            const handlers = generateHandlers(endpointConfigs);
            workerInstance = await startMockServer(handlers);
            isServerRunning = true;

            // Listen to MSW events for activity log
            if (workerInstance && workerInstance.events) {
                // Remove previous listeners if any (simple approach)
                workerInstance.events.removeAllListeners();

                workerInstance.events.on('response:mocked', async (context: any) => {
                    const { request, response } = context;
                    const url = new URL(request.url);

                    // Basic latency calculation (since response:mocked doesn't inherently have it, we mock it)
                    // Real MSW doesn't provide latency directly in response:mocked event natively in standard API without custom tracking,
                    // but we can estimate or just show a default log.

                    activityLog = [{
                        method: request.method,
                        path: url.pathname,
                        status: response.status,
                        latency: 200, // Hardcoded for log simplicity in this mock
                        time: new Date()
                    }, ...activityLog].slice(0, 100); // Keep last 100
                });
            }
        } catch (err) {
            console.error("Failed to start mock server", err);
        }
    }

    async function stopServer() {
        stopMockServer();
        isServerRunning = false;
        if (workerInstance && workerInstance.events) {
            workerInstance.events.removeAllListeners();
        }
        workerInstance = null;
    }

    onDestroy(() => {
        if (isServerRunning) {
            stopMockServer();
        }
    });

</script>

<div class="p-6 max-w-6xl mx-auto space-y-6">
    <div class="flex justify-between items-center border-b pb-4">
        <h1 class="text-2xl font-bold">Local Mock API Server</h1>
        {#if isServerRunning}
            <div class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Mock Server Active
            </div>
        {/if}
    </div>

    <!-- Drop Zone -->
    <div
        role="region"
        aria-label="File drop zone"
        class="border-2 border-dashed rounded-lg p-10 text-center transition-colors {dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}"
        on:dragover={handleDragOver}
        on:dragleave={handleDragLeave}
        on:drop={handleDrop}
    >
        <div class="text-gray-600">
            <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p class="text-lg mb-1">Drag and drop an OpenAPI spec here</p>
            <p class="text-sm text-gray-500">Supports .json and .yaml files</p>
        </div>
    </div>

    {#if parseError}
        <div class="p-4 bg-red-50 text-red-700 rounded-lg">
            {parseError}
        </div>
    {/if}

    {#if endpointConfigs.length > 0}
        <div class="grid grid-cols-3 gap-6">
            <!-- Left Column: Endpoints & Controls -->
            <div class="col-span-2 space-y-4">
                <div class="flex justify-between items-center">
                    <h2 class="text-lg font-semibold">Detected Endpoints ({endpointConfigs.length})</h2>
                    <div class="space-x-2">
                        {#if !isServerRunning}
                            <button
                                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                on:click={startServer}
                            >
                                Start Mock Server
                            </button>
                        {:else}
                            <button
                                class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                on:click={stopServer}
                            >
                                Stop
                            </button>
                        {/if}
                    </div>
                </div>

                <div class="bg-white border rounded-lg overflow-hidden">
                    <table class="w-full text-sm text-left">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="px-4 py-3">Enabled</th>
                                <th class="px-4 py-3">Method</th>
                                <th class="px-4 py-3">Path</th>
                                <th class="px-4 py-3">Status Override</th>
                                <th class="px-4 py-3">Latency (ms)</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            {#each endpointConfigs as config, i}
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-3">
                                        <input type="checkbox" bind:checked={config.enabled} disabled={isServerRunning} class="rounded border-gray-300" />
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class={`px-2 py-1 rounded text-xs font-bold uppercase ${getMethodColor(config.endpoint.method)}`}>
                                            {config.endpoint.method}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 font-mono text-gray-700">
                                        {config.endpoint.path}
                                    </td>
                                    <td class="px-4 py-3">
                                        <select bind:value={config.statusOverride} disabled={isServerRunning} class="border rounded p-1 text-sm">
                                            <option value={undefined}>Default ({config.endpoint.statusCode})</option>
                                            <option value={200}>200 OK</option>
                                            <option value={201}>201 Created</option>
                                            <option value={400}>400 Bad Request</option>
                                            <option value={401}>401 Unauthorized</option>
                                            <option value={404}>404 Not Found</option>
                                            <option value={500}>500 Internal Error</option>
                                        </select>
                                    </td>
                                    <td class="px-4 py-3">
                                        <input
                                            type="range"
                                            min="0" max="5000" step="100"
                                            bind:value={config.latencyOverride}
                                            disabled={isServerRunning}
                                            class="w-24 align-middle"
                                        />
                                        <span class="text-xs text-gray-500 ml-1 w-12 inline-block">
                                            {config.latencyOverride === undefined ? 'Auto' : config.latencyOverride}
                                        </span>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Right Column: Activity Log -->
            <div class="col-span-1 border rounded-lg bg-gray-50 flex flex-col max-h-[600px]">
                <div class="p-3 border-b bg-gray-100 flex justify-between items-center">
                    <h3 class="font-semibold text-gray-700">Activity Log</h3>
                    <button class="text-xs text-gray-500 hover:text-gray-700" on:click={() => activityLog = []}>Clear</button>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-2">
                    {#if activityLog.length === 0}
                        <p class="text-sm text-gray-400 text-center mt-4">Waiting for requests...</p>
                    {:else}
                        {#each activityLog as log}
                            <div class="bg-white border rounded p-2 text-sm shadow-sm flex flex-col gap-1">
                                <div class="flex justify-between items-center">
                                    <div class="flex gap-2 items-center">
                                        <span class={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${getMethodColor(log.method)}`}>
                                            {log.method}
                                        </span>
                                        <span class="font-mono text-gray-700 truncate max-w-[150px]" title={log.path}>
                                            {log.path}
                                        </span>
                                    </div>
                                    <div class="flex gap-2 items-center text-xs">
                                        <span class={log.status >= 400 ? 'text-red-600' : 'text-green-600'}>{log.status}</span>
                                    </div>
                                </div>
                                <div class="text-[10px] text-gray-400 text-right">
                                    {log.time.toLocaleTimeString()}
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>
