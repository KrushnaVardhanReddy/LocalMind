<script lang="ts">
    import { parseHarFile, type HarEntry, type SecurityIssue } from '$lib/utils/har-parser';
    import { WorkerManager } from '$lib/workers/WorkerManager';

    let entries: HarEntry[] = $state([]);
    let filteredEntries: HarEntry[] = $state([]);
    let securityIssues: SecurityIssue[] = $state([]);
    let summary: any = $state(null);
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    // Filters
    let filterMethod = $state('ALL');
    let filterStatus = $state('ALL');
    let filterDomain = $state('');

    // Selection
    let selectedEntry: HarEntry | null = $state(null);

    // SQL
    let sqlQuery = $state('SELECT method, status, count(*) as count FROM entries GROUP BY method, status ORDER BY count DESC;');
    let sqlResult = $state<{columns: string[], rows: any[]} | null>(null);
    let sqlError = $state<string | null>(null);
    let isExecutingSql = $state(false);

    let duckdb: any = null;

    $effect(() => {
        let result = entries;

        if (filterMethod !== 'ALL') {
            result = result.filter(e => e.method === filterMethod);
        }

        if (filterStatus !== 'ALL') {
            if (filterStatus === '2XX') result = result.filter(e => e.status >= 200 && e.status < 300);
            if (filterStatus === '3XX') result = result.filter(e => e.status >= 300 && e.status < 400);
            if (filterStatus === '4XX') result = result.filter(e => e.status >= 400 && e.status < 500);
            if (filterStatus === '5XX') result = result.filter(e => e.status >= 500);
        }

        if (filterDomain.trim() !== '') {
            result = result.filter(e => {
                try {
                    const url = new URL(e.url);
                    return url.hostname.includes(filterDomain);
                } catch {
                    return e.url.includes(filterDomain);
                }
            });
        }

        filteredEntries = result;
    });

    async function handleFileDrop(e: DragEvent) {
        e.preventDefault();
        const file = e.dataTransfer?.files[0];
        if (file && file.name.endsWith('.har')) {
            await processFile(file);
        } else {
            error = "Please drop a .har file";
        }
    }

    async function handleFileInput(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            await processFile(file);
        }
    }

    async function processFile(file: File) {
        isLoading = true;
        error = null;
        try {
            const result = await parseHarFile(file);
            entries = result.entries;
            securityIssues = result.securityIssues;
            summary = result.summary;

            // Load into DuckDB
            duckdb = await WorkerManager.getDuckDB();

            const blob = new Blob([JSON.stringify(entries)], { type: 'application/json' });
            const entriesFile = new File([blob], 'entries.json');

            await duckdb.registerFile(entriesFile, 'entries');

        } catch (err: any) {
            error = err.message || "Failed to parse HAR file";
            console.error(err);
        } finally {
            isLoading = false;
        }
    }

    async function executeQuery() {
        if (!duckdb || !sqlQuery.trim()) return;

        isExecutingSql = true;
        sqlError = null;

        try {
            const result = await duckdb.query(sqlQuery);
            sqlResult = { columns: result.columns, rows: result.rows };
        } catch (err: any) {
            sqlError = err.message || "Query failed";
            sqlResult = null;
        } finally {
            isExecutingSql = false;
        }
    }

    function truncateUrl(url: string, maxLength: number = 60) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength / 2) + '...' + url.substring(url.length - (maxLength / 2));
    }

    function getStatusColor(status: number) {
        if (status >= 200 && status < 300) return 'text-green-600 bg-green-100';
        if (status >= 300 && status < 400) return 'text-yellow-600 bg-yellow-100';
        if (status >= 400) return 'text-red-600 bg-red-100';
        return 'text-gray-600 bg-gray-100';
    }

    function getStatusDotColor(status: number) {
        if (status >= 200 && status < 300) return 'bg-green-500';
        if (status >= 300 && status < 400) return 'bg-yellow-500';
        if (status >= 400) return 'bg-red-500';
        return 'bg-gray-500';
    }

    function getMinStartTime() {
        if (entries.length === 0) return 0;
        return Math.min(...entries.map(e => new Date(e.startedDateTime).getTime()));
    }

    function getMaxEndTime() {
        if (entries.length === 0) return 1;
        const minTime = getMinStartTime();
        let maxDuration = 0;

        for (const entry of entries) {
            const startTime = new Date(entry.startedDateTime).getTime() - minTime;
            const totalDuration = calculateTotalDuration(entry.timings);
            maxDuration = Math.max(maxDuration, startTime + totalDuration);
        }

        return maxDuration || 1;
    }

    function calculateTotalDuration(timings: any) {
        if (!timings) return 0;
        let total = 0;
        if (timings.dns > 0) total += timings.dns;
        if (timings.connect > 0) total += timings.connect;
        if (timings.ssl > 0) total += timings.ssl;
        if (timings.send > 0) total += timings.send;
        if (timings.wait > 0) total += timings.wait;
        if (timings.receive > 0) total += timings.receive;
        return total;
    }

    // A simple function to mask sensitive values in the UI by default
    function maskSensitive(name: string, value: string) {
        const lowerName = name.toLowerCase();
        if (lowerName === 'authorization' || lowerName === 'cookie' || lowerName === 'x-api-key') {
            return '******** (Click to reveal)'; // A real implementation would toggle this, but for now we'll just mask it completely for simplicity and privacy. Or we can use a component to handle revealing it.
        }
        return value;
    }
</script>

<div class="p-6">
    <div class="mb-6">
        <h1 class="text-2xl font-bold mb-2">HAR File Analyzer</h1>
        <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
            <p class="font-bold">⚠️ Privacy Warning</p>
            <p>HAR files contain your browser's network traffic, including auth tokens and cookies. This file is processed entirely locally and never sent to any server.</p>
        </div>
    </div>

    {#if !summary}
        <div
            class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center" role="region" aria-label="Dropzone"
            ondragover={(e) => e.preventDefault()}
            ondrop={handleFileDrop}
        >
            <p class="text-gray-600 mb-4">Drag and drop a .har file here</p>
            <p class="text-gray-400 mb-4">or</p>
            <input
                type="file"
                accept=".har"
                class="hidden"
                id="har-upload"
                onchange={handleFileInput}
            >
            <label
                for="har-upload"
                class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded cursor-pointer"
            >
                Select File
            </label>
        </div>
    {/if}

    {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
            {error}
        </div>
    {/if}

    {#if isLoading}
        <div class="mt-4 text-gray-600">Loading and analyzing HAR file...</div>
    {/if}

    {#if summary && !isLoading}
        <div class="mt-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div class="bg-white p-4 rounded shadow border border-gray-200">
                    <p class="text-sm text-gray-500">Total Requests</p>
                    <p class="text-2xl font-bold">{summary.totalRequests}</p>
                </div>
                <div class="bg-white p-4 rounded shadow border border-gray-200">
                    <p class="text-sm text-gray-500">Total Transfer Size</p>
                    <p class="text-2xl font-bold">{(summary.totalTransferSize / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div class="bg-white p-4 rounded shadow border border-gray-200">
                    <p class="text-sm text-gray-500">Page Load Time</p>
                    <p class="text-2xl font-bold">{(summary.pageLoadTime / 1000).toFixed(2)} s</p>
                </div>
            </div>

            {#if securityIssues.length > 0}
                <details class="bg-red-50 border border-red-200 rounded-lg mb-8 cursor-pointer group">
                    <summary class="p-4 font-bold text-red-700 flex justify-between items-center">
                        <span>Security Findings ({securityIssues.length} issues detected)</span>
                        <span class="text-xl group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div class="p-4 border-t border-red-200">
                        <ul class="list-disc pl-5">
                            {#each securityIssues as issue}
                                <li class="text-red-600 mb-2">
                                    <span class="font-semibold">[{issue.severity}]</span> {issue.message}
                                    <span class="text-sm text-gray-500 block truncate" title={issue.url}>{issue.url}</span>
                                </li>
                            {/each}
                        </ul>
                    </div>
                </details>
            {/if}

            <!-- Waterfall Section -->
            <div class="bg-white rounded shadow border border-gray-200 mb-8 flex flex-col h-[600px]">
                <div class="p-4 border-b border-gray-200 flex gap-4 flex-wrap bg-gray-50">
                    <select bind:value={filterMethod} class="border border-gray-300 rounded p-1 text-sm">
                        <option value="ALL">All Methods</option>
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="OPTIONS">OPTIONS</option>
                    </select>

                    <select bind:value={filterStatus} class="border border-gray-300 rounded p-1 text-sm">
                        <option value="ALL">All Status</option>
                        <option value="2XX">2XX Success</option>
                        <option value="3XX">3XX Redirection</option>
                        <option value="4XX">4XX Client Error</option>
                        <option value="5XX">5XX Server Error</option>
                    </select>

                    <input
                        type="text"
                        bind:value={filterDomain}
                        placeholder="Filter by Domain"
                        class="border border-gray-300 rounded p-1 text-sm flex-grow min-w-[200px]"
                    >
                </div>

                <div class="flex flex-1 overflow-hidden">
                    <!-- Waterfall Chart -->
                    <div class="flex-1 overflow-auto p-4 border-r border-gray-200 relative">
                        <div class="min-w-[800px]">
                            <!-- Waterfall Header -->
                            <div class="flex border-b border-gray-300 pb-2 mb-2 text-xs font-bold text-gray-500 sticky top-0 bg-white z-10">
                                <div class="w-1/3 min-w-[250px]">Name / URL</div>
                                <div class="w-20 text-center">Status</div>
                                <div class="w-24 text-right pr-4">Size</div>
                                <div class="flex-1 relative">Timeline</div>
                            </div>

                            <!-- Waterfall Rows -->
                            {#each filteredEntries as entry}
                                {@const startTime = new Date(entry.startedDateTime).getTime() - getMinStartTime()}
                                {@const totalDuration = calculateTotalDuration(entry.timings)}
                                {@const maxTime = getMaxEndTime()}
                                {@const startPct = (startTime / maxTime) * 100}
                                {@const widthPct = (totalDuration / maxTime) * 100}

                                <div
                                    class="flex items-center text-sm border-b border-gray-100 py-1 hover:bg-blue-50 cursor-pointer {selectedEntry === entry ? 'bg-blue-100' : ''}"
                                    onclick={() => selectedEntry = entry} onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") selectedEntry = entry; }} role="button" tabindex="0"
                                >
                                    <!-- URL -->
                                    <div class="w-1/3 min-w-[250px] truncate pr-2 flex items-center gap-2">
                                        <span class="w-2 h-2 rounded-full {getStatusDotColor(entry.status)} shrink-0"></span>
                                        <span class="font-mono text-xs text-gray-500">{entry.method}</span>
                                        <span class="truncate" title={entry.url}>{truncateUrl(entry.url)}</span>
                                    </div>
                                    <!-- Status -->
                                    <div class="w-20 text-center">
                                        <span class="px-2 py-0.5 rounded text-xs {getStatusColor(entry.status)}">{entry.status}</span>
                                    </div>
                                    <!-- Size -->
                                    <div class="w-24 text-right pr-4 text-gray-500 font-mono text-xs">
                                        {entry.responseBodySize > 0 ? (entry.responseBodySize / 1024).toFixed(1) + ' KB' : '-'}
                                    </div>
                                    <!-- Timeline Bar -->
                                    <div class="flex-1 relative h-4 bg-gray-50 group">
                                        <div
                                            class="absolute h-full flex"
                                            style="left: {startPct}%; width: {Math.max(widthPct, 0.5)}%; min-width: 2px;"
                                        >
                                            {#if entry.timings}
                                                {@const dnsPct = ((Math.max(entry.timings.dns, 0) || 0) / totalDuration) * 100}
                                                {@const connPct = ((Math.max(entry.timings.connect, 0) || 0) / totalDuration) * 100}
                                                {@const sslPct = ((Math.max(entry.timings.ssl, 0) || 0) / totalDuration) * 100}
                                                {@const waitPct = ((Math.max(entry.timings.wait, 0) || 0) / totalDuration) * 100}
                                                {@const recvPct = ((Math.max(entry.timings.receive, 0) || 0) / totalDuration) * 100}

                                                {#if dnsPct > 0}<div class="bg-teal-500 h-full" style="width: {dnsPct}%"></div>{/if}
                                                {#if connPct > 0}<div class="bg-orange-500 h-full" style="width: {connPct}%"></div>{/if}
                                                {#if sslPct > 0}<div class="bg-purple-500 h-full" style="width: {sslPct}%"></div>{/if}
                                                {#if waitPct > 0}<div class="bg-green-500 h-full" style="width: {waitPct}%"></div>{/if}
                                                {#if recvPct > 0}<div class="bg-blue-500 h-full" style="width: {recvPct}%"></div>{/if}
                                                <!-- If total is 0 or timings missing, render a default bar -->
                                                {#if totalDuration === 0}
                                                    <div class="bg-gray-400 h-full w-full"></div>
                                                {/if}
                                            {:else}
                                                <div class="bg-gray-400 h-full w-full"></div>
                                            {/if}
                                        </div>

                                        <!-- Tooltip (simplified) -->
                                        <div class="hidden group-hover:block absolute top-6 left-0 bg-gray-800 text-white p-2 rounded text-xs z-50 whitespace-nowrap shadow-lg">
                                            <div>Total: {totalDuration.toFixed(2)} ms</div>
                                            {#if entry.timings}
                                                {#if entry.timings.dns > 0}<div>DNS: {entry.timings.dns.toFixed(2)} ms</div>{/if}
                                                {#if entry.timings.connect > 0}<div>Connect: {entry.timings.connect.toFixed(2)} ms</div>{/if}
                                                {#if entry.timings.ssl > 0}<div>TLS: {entry.timings.ssl.toFixed(2)} ms</div>{/if}
                                                {#if entry.timings.wait > 0}<div>Wait (TTFB): {entry.timings.wait.toFixed(2)} ms</div>{/if}
                                                {#if entry.timings.receive > 0}<div>Download: {entry.timings.receive.toFixed(2)} ms</div>{/if}
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>

                    <!-- Request Inspector -->
                    <div class="w-1/3 min-w-[300px] overflow-auto bg-white p-4">
                        {#if selectedEntry}
                            <h3 class="font-bold text-lg mb-2">Request Inspector</h3>
                            <div class="break-all font-mono text-sm mb-4 text-blue-600 bg-blue-50 p-2 rounded">
                                {selectedEntry.url}
                            </div>

                            <div class="grid grid-cols-2 gap-2 mb-4 text-sm">
                                <div><span class="font-bold">Method:</span> {selectedEntry.method}</div>
                                <div><span class="font-bold">Status:</span> {selectedEntry.status}</div>
                                <div><span class="font-bold">Size:</span> {selectedEntry.responseBodySize} bytes</div>
                                <div><span class="font-bold">Time:</span> {calculateTotalDuration(selectedEntry.timings).toFixed(2)} ms</div>
                            </div>

                            <h4 class="font-bold mt-4 mb-2 text-gray-700 border-b pb-1">Request Headers</h4>
                            <div class="bg-gray-50 p-2 rounded overflow-x-auto text-xs font-mono">
                                {#if selectedEntry.requestHeaders && selectedEntry.requestHeaders.length > 0}
                                    {#each selectedEntry.requestHeaders as header}
                                        {@const isSensitive = ['authorization', 'cookie', 'x-api-key'].includes((header.name||'').toLowerCase())}
                                        <div class="mb-1 flex">
                                            <span class="font-bold text-gray-700 w-1/3 shrink-0">{header.name}:</span>
                                            {#if isSensitive}
                                                <details class="w-2/3">
                                                    <summary class="cursor-pointer text-blue-500">******** (Click to reveal)</summary>
                                                    <span class="break-all text-gray-600 mt-1 block">{header.value}</span>
                                                </details>
                                            {:else}
                                                <span class="w-2/3 break-all text-gray-600">{header.value}</span>
                                            {/if}
                                        </div>
                                    {/each}
                                {:else}
                                    <div class="text-gray-500 italic">No headers recorded</div>
                                {/if}
                            </div>

                            <h4 class="font-bold mt-4 mb-2 text-gray-700 border-b pb-1">Timing Breakdown</h4>
                            <div class="bg-gray-50 p-2 rounded text-xs font-mono">
                                {#if selectedEntry.timings}
                                    <div class="grid grid-cols-2 gap-1">
                                        <div>DNS Lookup:</div> <div class="text-right">{Math.max(selectedEntry.timings.dns || 0, 0).toFixed(2)} ms</div>
                                        <div>TCP Connect:</div> <div class="text-right">{Math.max(selectedEntry.timings.connect || 0, 0).toFixed(2)} ms</div>
                                        <div>TLS Setup:</div> <div class="text-right">{Math.max(selectedEntry.timings.ssl || 0, 0).toFixed(2)} ms</div>
                                        <div>Request Sent:</div> <div class="text-right">{Math.max(selectedEntry.timings.send || 0, 0).toFixed(2)} ms</div>
                                        <div>Wait (TTFB):</div> <div class="text-right">{Math.max(selectedEntry.timings.wait || 0, 0).toFixed(2)} ms</div>
                                        <div>Download:</div> <div class="text-right">{Math.max(selectedEntry.timings.receive || 0, 0).toFixed(2)} ms</div>
                                    </div>
                                    <div class="border-t border-gray-300 mt-2 pt-2 grid grid-cols-2 gap-1 font-bold">
                                        <div>Total Time:</div> <div class="text-right">{calculateTotalDuration(selectedEntry.timings).toFixed(2)} ms</div>
                                    </div>
                                {:else}
                                    <div class="text-gray-500 italic">No timing information available</div>
                                {/if}
                            </div>
                        {:else}
                            <div class="h-full flex items-center justify-center text-gray-400 text-center">
                                Select a request from the waterfall<br>to view details.
                            </div>
                        {/if}
                    </div>
                </div>
            </div>

            <div class="mt-8 mb-12">
                <h2 class="text-xl font-bold mb-4">SQL Data Explorer</h2>
                <div class="bg-white p-4 rounded shadow border border-gray-200">
                    <p class="text-sm text-gray-500 mb-2">Query the <code>entries</code> table directly using DuckDB. Columns: url, method, status, startedDateTime, responseBodySize</p>
                    <textarea
                        bind:value={sqlQuery}
                        class="w-full h-24 p-2 border border-gray-300 rounded font-mono text-sm mb-2 focus:ring focus:ring-blue-200 outline-none"
                        placeholder="SELECT * FROM entries LIMIT 10;"
                    ></textarea>
                    <div class="flex justify-end mb-4">
                        <button
                            onclick={executeQuery}
                            disabled={isExecutingSql}
                            class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors"
                        >
                            {isExecutingSql ? 'Running...' : 'Run Query'}
                        </button>
                    </div>

                    {#if sqlError}
                        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                            {sqlError}
                        </div>
                    {/if}

                    {#if sqlResult}
                        <div class="overflow-x-auto border border-gray-200 rounded">
                            <table class="min-w-full bg-white text-sm">
                                <thead class="bg-gray-100 border-b">
                                    <tr>
                                        {#each sqlResult.columns as col}
                                            <th class="text-left py-2 px-4 font-semibold text-gray-700">{col}</th>
                                        {/each}
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each sqlResult.rows as row}
                                        <tr class="border-b hover:bg-gray-50">
                                            {#each sqlResult.columns as col}
                                                <td class="py-2 px-4 whitespace-nowrap max-w-xs truncate" title={String(row[col])}>{row[col]}</td>
                                            {/each}
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>
