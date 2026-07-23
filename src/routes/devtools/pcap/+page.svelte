<script lang="ts">
    import { onMount } from 'svelte';
    import { wrap } from 'comlink';
    import * as echarts from 'echarts';
    import type { PCAPWorkerContract } from '$lib/workers/pcap.worker';
    import type { DuckDBWorkerContract, QueryResult } from '$lib/workers/duckdb.worker';
    import PcapWorker from '$lib/workers/pcap.worker?worker';
    import DuckDbWorker from '$lib/workers/duckdb.worker?worker';

    let pcapWorker: PCAPWorkerContract;
    let duckdbWorker: DuckDBWorkerContract;

    let isProcessing = $state(false);
    let error = $state<string | null>(null);
    let loaded = $state(false);
    let hasCredentials = $state(false);

    let totalPackets = $state(0);
    let uniqueHosts = $state(0);
    let captureDuration = $state(0);
    let topProtocol = $state('Unknown');

    let activeTab = $state('timeline');

    let timelineChartRef: HTMLElement = $state() as unknown as HTMLElement;
    let protocolChartRef: HTMLElement = $state() as unknown as HTMLElement;
    let sankeyChartRef: HTMLElement = $state() as unknown as HTMLElement;

    let chartInstances: echarts.ECharts[] = [];

    let packetsPage = $state(0);
    let rawPacketsResult = $state<QueryResult | null>(null);

    let customQuery = $state('SELECT * FROM packets LIMIT 10');
    let customQueryResult = $state<QueryResult | null>(null);
    let queryError = $state<string | null>(null);

    onMount(async () => {
        pcapWorker = wrap<PCAPWorkerContract>(new PcapWorker());
        duckdbWorker = wrap<DuckDBWorkerContract>(new DuckDbWorker());
        await duckdbWorker.init();

        window.addEventListener('resize', () => {
            chartInstances.forEach(chart => chart.resize());
        });
    });

    async function handleFileDrop(e: DragEvent) {
        e.preventDefault();
        const file = e.dataTransfer?.files[0];
        if (!file || !file.name.endsWith('.pcap')) {
            error = 'Please drop a valid .pcap file';
            return;
        }
        await processFile(file);
    }

    async function handleFileInput(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            await processFile(file);
        }
    }

    async function processFile(file: File) {
        isProcessing = true;
        error = null;
        try {
            const result = await pcapWorker.loadPCAP(file);
            hasCredentials = result.hasCredentials;

            await duckdbWorker.registerFile(result.file, 'packets');

            await duckdbWorker.query(`
                CREATE OR REPLACE VIEW top_talkers AS
                SELECT src_ip, dst_ip, SUM(length) as total_bytes, COUNT(*) as packet_count
                FROM packets GROUP BY src_ip, dst_ip ORDER BY total_bytes DESC LIMIT 20;
            `);

            await duckdbWorker.query(`
                CREATE OR REPLACE VIEW protocol_dist AS
                SELECT protocol, COUNT(*) as count FROM packets GROUP BY protocol;
            `);

            await duckdbWorker.query(`
                CREATE OR REPLACE VIEW traffic_timeline AS
                SELECT epoch(TRY_CAST(timestamp AS TIMESTAMP)) as second, COUNT(*) as pps FROM packets GROUP BY second ORDER BY second;
            `);

            const totalRes = await duckdbWorker.query(`SELECT COUNT(*) as c FROM packets`);
            totalPackets = totalRes.rows[0]?.c || 0;

            const hostsRes = await duckdbWorker.query(`
                SELECT COUNT(DISTINCT ip) as c FROM (
                    SELECT src_ip as ip FROM packets UNION SELECT dst_ip as ip FROM packets
                )
            `);
            uniqueHosts = hostsRes.rows[0]?.c || 0;

            const timeRes = await duckdbWorker.query(`
                SELECT
                    MAX(epoch(TRY_CAST(timestamp AS TIMESTAMP))) - MIN(epoch(TRY_CAST(timestamp AS TIMESTAMP))) as duration
                FROM packets
            `);
            captureDuration = timeRes.rows[0]?.duration || 0;

            const protoRes = await duckdbWorker.query(`SELECT protocol FROM protocol_dist ORDER BY count DESC LIMIT 1`);
            topProtocol = protoRes.rows[0]?.protocol || 'Unknown';

            loaded = true;

            // We need a slight delay to allow Svelte to mount the newly exposed tabs
            setTimeout(async () => {
                await renderCharts();
                await fetchPacketsPage();
            }, 100);

        } catch (err: any) {
            error = err.message || 'Error processing PCAP file';
            console.error(err);
        } finally {
            isProcessing = false;
        }
    }

    async function renderCharts() {
        // Destroy old ones
        chartInstances.forEach(c => c.dispose());
        chartInstances = [];

        // 1. Timeline Chart
        if (timelineChartRef) {
            const timelineData = await duckdbWorker.query('SELECT second, pps FROM traffic_timeline ORDER BY second');
            if (timelineData.rows.length > 0) {
                const baseTime = timelineData.rows[0].second;
                const chart = echarts.init(timelineChartRef, 'dark');
                chart.setOption({
                    backgroundColor: 'transparent',
                    tooltip: { trigger: 'axis' },
                    xAxis: {
                        type: 'category',
                        data: timelineData.rows.map((r: any) => `+${r.second - baseTime}s`)
                    },
                    yAxis: { type: 'value', name: 'Packets/sec' },
                    series: [{
                        data: timelineData.rows.map((r: any) => r.pps),
                        type: 'line',
                        smooth: true,
                        areaStyle: {}
                    }]
                });
                chartInstances.push(chart);
            }
        }

        // 2. Protocol Pie Chart
        if (protocolChartRef) {
            const protoData = await duckdbWorker.query('SELECT protocol, count FROM protocol_dist');
            const chart = echarts.init(protocolChartRef, 'dark');
            chart.setOption({
                backgroundColor: 'transparent',
                tooltip: { trigger: 'item' },
                series: [{
                    type: 'pie',
                    radius: '70%',
                    data: protoData.rows.map((r: any) => ({ value: r.count, name: r.protocol })),
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }]
            });
            chartInstances.push(chart);
        }

        // 3. Top Talkers Sankey
        if (sankeyChartRef) {
            const sankeyData = await duckdbWorker.query('SELECT src_ip, dst_ip, total_bytes FROM top_talkers');

            const nodes = new Set<string>();
            sankeyData.rows.forEach((r: any) => {
                nodes.add(r.src_ip);
                nodes.add(r.dst_ip);
            });

            const chart = echarts.init(sankeyChartRef, 'dark');
            chart.setOption({
                backgroundColor: 'transparent',
                tooltip: { trigger: 'item', formatter: '{b}: {c} bytes' },
                series: [{
                    type: 'sankey',
                    layout: 'none',
                    emphasis: { focus: 'adjacency' },
                    data: Array.from(nodes).map(n => ({ name: n })),
                    links: sankeyData.rows.map((r: any) => ({
                        source: r.src_ip,
                        target: r.dst_ip,
                        value: r.total_bytes
                    }))
                }]
            });
            chartInstances.push(chart);
        }
    }

    async function fetchPacketsPage() {
        const offset = packetsPage * 50;
        rawPacketsResult = await duckdbWorker.query(`SELECT timestamp, src_ip, dst_ip, protocol, length, payload_length FROM packets ORDER BY timestamp ASC LIMIT 50 OFFSET ${offset}`);
    }

    async function nextPage() {
        packetsPage++;
        await fetchPacketsPage();
    }

    async function prevPage() {
        if (packetsPage > 0) {
            packetsPage--;
            await fetchPacketsPage();
        }
    }

    async function runCustomQuery() {
        queryError = null;
        try {
            customQueryResult = await duckdbWorker.query(customQuery, 1000);
        } catch (e: any) {
            queryError = e.message;
            customQueryResult = null;
        }
    }

    function setTab(tab: string) {
        activeTab = tab;
        setTimeout(() => {
            chartInstances.forEach(c => c.resize());
        }, 50);
    }
</script>

<div class="flex flex-col h-full bg-slate-900 text-slate-200">
    <div class="p-6 border-b border-slate-700 bg-slate-800">
        <h1 class="text-2xl font-bold text-white mb-2">PCAP Network Analyzer</h1>
        <p class="text-slate-400">Offline network traffic analysis and visualization.</p>
    </div>

    <!-- Privacy Banner -->
    <div class="bg-amber-900/50 border-b border-amber-700 p-4 text-amber-200 text-sm flex items-center justify-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        ⚠️ PCAP files may contain sensitive data. LocalMind processes this file locally — nothing is uploaded.
    </div>

    {#if hasCredentials}
        <div class="bg-red-900/50 border-b border-red-700 p-4 text-red-200 text-sm flex items-center justify-center font-bold">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            ⚠️ Unencrypted credentials detected in this capture.
        </div>
    {/if}

    <div class="p-6 flex-1 overflow-auto">
        {#if error}
            <div class="bg-red-900/50 text-red-200 p-4 rounded mb-6 border border-red-700">
                {error}
            </div>
        {/if}

        {#if !loaded && !isProcessing}
            <div
                class="border-2 border-dashed border-slate-600 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-800"
                ondragover={(e) => e.preventDefault()}
                ondrop={handleFileDrop}
                onclick={() => document.getElementById('file-upload')?.click()}
                onkeydown={(e) => e.key === 'Enter' && document.getElementById('file-upload')?.click()}
                role="button"
                tabindex="0"
            >
                <input
                    type="file"
                    id="file-upload"
                    class="hidden"
                    accept=".pcap"
                    onchange={handleFileInput}
                >
                <svg class="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p class="text-lg text-slate-300">Drop a .pcap file here</p>
                <p class="text-sm text-slate-500 mt-2">or click to browse</p>
            </div>
        {:else if isProcessing}
            <div class="flex flex-col items-center justify-center p-12 bg-slate-800 rounded-lg border border-slate-700">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p class="text-slate-300">Parsing and loading PCAP data locally...</p>
            </div>
        {:else}
            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-slate-800 border border-slate-700 p-6 rounded-lg">
                    <h3 class="text-slate-400 text-sm font-medium mb-1">Total Packets</h3>
                    <p class="text-2xl font-bold text-white">{totalPackets.toLocaleString()}</p>
                </div>
                <div class="bg-slate-800 border border-slate-700 p-6 rounded-lg">
                    <h3 class="text-slate-400 text-sm font-medium mb-1">Unique Hosts</h3>
                    <p class="text-2xl font-bold text-white">{uniqueHosts.toLocaleString()}</p>
                </div>
                <div class="bg-slate-800 border border-slate-700 p-6 rounded-lg">
                    <h3 class="text-slate-400 text-sm font-medium mb-1">Duration</h3>
                    <p class="text-2xl font-bold text-white">{captureDuration}s</p>
                </div>
                <div class="bg-slate-800 border border-slate-700 p-6 rounded-lg">
                    <h3 class="text-slate-400 text-sm font-medium mb-1">Top Protocol</h3>
                    <p class="text-2xl font-bold text-white">{topProtocol}</p>
                </div>
            </div>

            <div class="border-b border-slate-700 mb-6">
                <nav class="-mb-px flex space-x-8">
                    {#each [
                        { id: 'timeline', name: 'Traffic Timeline' },
                        { id: 'talkers', name: 'Top Talkers' },
                        { id: 'protocol', name: 'Protocol Breakdown' },
                        { id: 'table', name: 'Packet Table' },
                        { id: 'sql', name: 'SQL Query' }
                    ] as tab}
                        <button
                            class="whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm {activeTab === tab.id ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-500'}"
                            onclick={() => setTab(tab.id)}
                        >
                            {tab.name}
                        </button>
                    {/each}
                </nav>
            </div>

            <!-- Tab Contents -->
            <div class="bg-slate-800 border border-slate-700 rounded-lg p-6 min-h-[500px]">
                <div class={activeTab === 'timeline' ? 'block' : 'hidden'}>
                    <div bind:this={timelineChartRef} style="width: 100%; height: 450px;"></div>
                </div>

                <div class={activeTab === 'talkers' ? 'block' : 'hidden'}>
                    <div bind:this={sankeyChartRef} style="width: 100%; height: 450px;"></div>
                </div>

                <div class={activeTab === 'protocol' ? 'block' : 'hidden'}>
                    <div bind:this={protocolChartRef} style="width: 100%; height: 450px;"></div>
                </div>

                <div class={activeTab === 'table' ? 'block' : 'hidden'}>
                    {#if rawPacketsResult && rawPacketsResult.rows.length > 0}
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-slate-700">
                                <thead>
                                    <tr>
                                        {#each rawPacketsResult.columns as col}
                                            <th class="px-3 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{col}</th>
                                        {/each}
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-700">
                                    {#each rawPacketsResult.rows as row}
                                        <tr>
                                            {#each rawPacketsResult.columns as col}
                                                <td class="px-3 py-2 whitespace-nowrap text-sm text-slate-300">{row[col]}</td>
                                            {/each}
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                        <div class="mt-4 flex justify-between items-center text-sm text-slate-400">
                            <span>Showing {packetsPage * 50 + 1} to {(packetsPage + 1) * 50}</span>
                            <div class="space-x-2">
                                <button onclick={prevPage} disabled={packetsPage === 0} class="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50">Previous</button>
                                <button onclick={nextPage} class="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600">Next</button>
                            </div>
                        </div>
                    {:else}
                        <p class="text-slate-400 text-center py-8">No packets available.</p>
                    {/if}
                </div>

                <div class={activeTab === 'sql' ? 'block' : 'hidden'}>
                    <div class="flex flex-col h-full">
                        <div class="mb-4">
                            <label for="sql-input" class="block text-sm font-medium text-slate-400 mb-2">DuckDB SQL Query</label>
                            <textarea
                                id="sql-input"
                                bind:value={customQuery}
                                class="w-full h-32 bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-300 font-mono text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            ></textarea>
                            <div class="mt-3 flex justify-between items-center">
                                <span class="text-xs text-slate-500">Available views: packets, top_talkers, protocol_dist, traffic_timeline</span>
                                <button
                                    onclick={runCustomQuery}
                                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
                                >
                                    Run Query
                                </button>
                            </div>
                        </div>

                        {#if queryError}
                            <div class="bg-red-900/50 text-red-200 p-4 rounded border border-red-700 mb-4 font-mono text-sm overflow-x-auto">
                                {queryError}
                            </div>
                        {/if}

                        {#if customQueryResult}
                            <div class="border border-slate-700 rounded-md overflow-hidden bg-slate-900">
                                <div class="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between text-xs text-slate-400">
                                    <span>{customQueryResult.rows.length} rows returned</span>
                                    <span>{customQueryResult.executionTimeMs.toFixed(2)} ms</span>
                                </div>
                                <div class="overflow-x-auto max-h-[300px]">
                                    <table class="min-w-full divide-y divide-slate-700">
                                        <thead class="bg-slate-800/50">
                                            <tr>
                                                {#each customQueryResult.columns as col}
                                                    <th class="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">{col}</th>
                                                {/each}
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-slate-700">
                                            {#each customQueryResult.rows as row}
                                                <tr class="hover:bg-slate-800/50">
                                                    {#each customQueryResult.columns as col}
                                                        <td class="px-4 py-2 whitespace-nowrap text-sm text-slate-300">
                                                            {row[col] !== null ? String(row[col]) : 'NULL'}
                                                        </td>
                                                    {/each}
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>
