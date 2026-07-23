<script lang="ts">
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import type { GitWorkerContract } from '$lib/workers/git.worker';
    import type { DuckDBWorkerContract, QueryResult } from '$lib/workers/duckdb.worker';
    import * as echarts from 'echarts';
    import { onMount, onDestroy } from 'svelte';

    let files: FileList | null = $state(null);
    let isLoading = $state(false);
    let error = $state<string | null>(null);
    let statusMessage = $state<string>('');

    let gitWorker: GitWorkerContract | null = null;
    let duckDbWorker: DuckDBWorkerContract | null = null;

    let activeTab: 'timeline' | 'hotspots' | 'contributors' | 'log' = $state('timeline');

    // UI Refs
    let timelineRef: HTMLElement = $state() as unknown as HTMLElement;
    let hotspotsRef: HTMLElement = $state() as unknown as HTMLElement;
    let contributorsRef: HTMLElement = $state() as unknown as HTMLElement;

    // Data
    let commits: any[] = $state([]);
    let fileChurn: any[] = $state([]);
    let contributorStats: any[] = $state([]);
    let sqlQuery = $state("SELECT * FROM commits LIMIT 10");
    let sqlResult: QueryResult | null = $state(null);
    let sqlError: string | null = $state(null);
    let isSqlLoading = $state(false);

    let charts: echarts.ECharts[] = [];

    onMount(async () => {
        duckDbWorker = await WorkerManager.getDuckDB();
        await duckDbWorker!.init();
    });

    onDestroy(() => {
        charts.forEach(c => c.dispose());
    });

    function handleFolderChange(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            files = input.files;
            processRepository();
        }
    }

    async function processRepository() {
        if (!files) return;
        isLoading = true;
        error = null;
        statusMessage = "Loading git worker...";

        try {
            gitWorker = await WorkerManager.getGit();

            statusMessage = "Copying files to memory...";
            const payload = Array.from(files).map(f => ({
                path: f.webkitRelativePath,
                file: f
            }));
            await gitWorker!.loadRepository(payload);

            statusMessage = "Extracting commits...";
            commits = await gitWorker!.getCommitLog();

            statusMessage = "Extracting file churn...";
            fileChurn = await gitWorker!.getFileChurn();

            statusMessage = "Extracting contributor stats...";
            contributorStats = await gitWorker!.getContributorStats();

            statusMessage = "Loading into DuckDB...";

            // Create blobs for DuckDB
            const commitsBlob = new Blob([JSON.stringify(commits)], { type: 'application/json' });
            const commitsFile = new File([commitsBlob], 'commits.json', { type: 'application/json' });

            const churnBlob = new Blob([JSON.stringify(fileChurn)], { type: 'application/json' });
            const churnFile = new File([churnBlob], 'file_churn.json', { type: 'application/json' });

            const contributorsBlob = new Blob([JSON.stringify(contributorStats)], { type: 'application/json' });
            const contributorsFile = new File([contributorsBlob], 'contributors.json', { type: 'application/json' });

            await duckDbWorker!.registerFile(commitsFile, 'commits');
            await duckDbWorker!.registerFile(churnFile, 'file_churn');
            await duckDbWorker!.registerFile(contributorsFile, 'contributors');

            statusMessage = "Rendering charts...";

            setTimeout(() => {
                renderCharts();
                runSqlQuery();
            }, 100);

        } catch (e: any) {
            error = e.message || "An error occurred";
        } finally {
            isLoading = false;
        }
    }

    async function runSqlQuery() {
        if (!duckDbWorker) return;
        isSqlLoading = true;
        sqlError = null;
        try {
            sqlResult = await duckDbWorker.query(sqlQuery);
        } catch (e: any) {
            sqlError = e.message;
        } finally {
            isSqlLoading = false;
        }
    }

    function renderCharts() {
        charts.forEach(c => c.dispose());
        charts = [];

        if (activeTab === 'timeline' && timelineRef && commits.length > 0) {
            const chart = echarts.init(timelineRef);
            // Group by week using JS for simplicity here or use DuckDB?
            // We can just use DuckDB for it!
            duckDbWorker!.query(`
                SELECT
                    date_trunc('week', CAST(date AS TIMESTAMP)) as week,
                    COUNT(*) as count
                FROM commits
                GROUP BY week
                ORDER BY week ASC
            `).then(res => {
                const dates = res.rows.map(r => new Date(r.week).toLocaleDateString());
                const counts = res.rows.map(r => Number(r.count));

                chart.setOption({
                    title: { text: 'Commits per Week' },
                    tooltip: { trigger: 'axis' },
                    xAxis: { type: 'category', data: dates },
                    yAxis: { type: 'value' },
                    series: [{ data: counts, type: 'bar' }]
                });
            });
            charts.push(chart);
        } else if (activeTab === 'hotspots' && hotspotsRef && fileChurn.length > 0) {
            const chart = echarts.init(hotspotsRef);
            duckDbWorker!.query(`
                SELECT filepath, totalCommits, linesAdded + linesDeleted as churn
                FROM file_churn
                ORDER BY totalCommits DESC
                LIMIT 50
            `).then(res => {
                const data = res.rows.map(r => ({
                    name: r.filepath,
                    value: Number(r.totalCommits),
                    itemStyle: {
                        color: echarts.color.modifyHSL('#5470c6', Math.round((Number(r.totalCommits) / res.rows[0].totalCommits) * 100))
                    }
                }));

                chart.setOption({
                    title: { text: 'File Hotspots (Top 50)' },
                    tooltip: { formatter: '{b}: {c} commits' },
                    series: [{
                        type: 'treemap',
                        data: data
                    }]
                });
            });
            charts.push(chart);
        } else if (activeTab === 'contributors' && contributorsRef && contributorStats.length > 0) {
            const chart = echarts.init(contributorsRef);
            duckDbWorker!.query(`
                SELECT name, linesAdded, linesDeleted
                FROM contributors
                ORDER BY linesAdded + linesDeleted DESC
                LIMIT 20
            `).then(res => {
                const names = res.rows.map(r => r.name);
                const added = res.rows.map(r => Number(r.linesAdded));
                const deleted = res.rows.map(r => Number(r.linesDeleted));

                chart.setOption({
                    title: { text: 'Top Contributors by Lines Changed' },
                    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                    legend: { data: ['Added', 'Deleted'] },
                    xAxis: { type: 'value' },
                    yAxis: { type: 'category', data: names, inverse: true },
                    series: [
                        { name: 'Added', type: 'bar', stack: 'total', itemStyle: { color: '#91cc75' }, data: added },
                        { name: 'Deleted', type: 'bar', stack: 'total', itemStyle: { color: '#ee6666' }, data: deleted }
                    ]
                });
            });
            charts.push(chart);
        }
    }

    // React to tab change
    $effect(() => {
        if (!isLoading && commits.length > 0) {
            // Need a tiny delay for the DOM to render the new tab content ref
            setTimeout(renderCharts, 50);
        }
    });

</script>

<div class="p-6 max-w-6xl mx-auto space-y-6">
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">Git History Analyzer</h1>
        <p class="text-slate-500">Analyze your `.git` repository locally using DuckDB WASM.</p>
    </div>

    {#if !files}
        <div class="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:bg-slate-50 transition-colors">
            <h3 class="text-lg font-semibold mb-2">Drop a .git folder here</h3>
            <p class="text-sm text-slate-500 mb-4">Or click to select</p>
            <input
                type="file"
                webkitdirectory
                class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                onchange={handleFolderChange}
            />
        </div>
    {:else if isLoading}
        <div class="p-12 text-center bg-slate-50 rounded-lg">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-lg font-medium">{statusMessage}</p>
        </div>
    {:else if error}
        <div class="p-4 bg-red-50 text-red-600 rounded-lg">
            <h3 class="font-bold">Error analyzing repository</h3>
            <p>{error}</p>
            <button class="mt-2 text-sm underline" onclick={() => files = null}>Try again</button>
        </div>
    {:else}
        <div class="flex space-x-4 border-b">
            {#each ['timeline', 'hotspots', 'contributors', 'log'] as tab}
                <button
                    class="py-2 px-4 border-b-2 {activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent hover:border-slate-300'}"
                    onclick={() => activeTab = tab as any}
                >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
            {/each}
        </div>

        <div class="bg-white p-4 rounded-lg shadow min-h-[400px]">
            {#if activeTab === 'timeline'}
                <div bind:this={timelineRef} style="width: 100%; height: 400px;"></div>
            {:else if activeTab === 'hotspots'}
                <div bind:this={hotspotsRef} style="width: 100%; height: 400px;"></div>
            {:else if activeTab === 'contributors'}
                <div bind:this={contributorsRef} style="width: 100%; height: 400px;"></div>
            {:else if activeTab === 'log'}
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 text-sm">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th class="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Author</th>
                                <th class="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Message</th>
                                <th class="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Files Changed</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            {#each commits.slice(0, 100) as commit}
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(commit.date).toLocaleString()}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">{commit.author}</td>
                                    <td class="px-6 py-4 truncate max-w-md">{commit.message}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">{commit.filesChangedCount}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                    {#if commits.length > 100}
                        <p class="text-center text-slate-500 text-xs mt-4">Showing first 100 commits. Use SQL panel to view more.</p>
                    {/if}
                </div>
            {/if}
        </div>

        <div class="mt-8 bg-slate-50 rounded-lg p-6 border">
            <h2 class="text-lg font-bold mb-4">DuckDB SQL Console</h2>
            <div class="flex flex-col space-y-4">
                <textarea
                    bind:value={sqlQuery}
                    class="w-full h-32 p-3 font-mono text-sm border rounded shadow-sm focus:ring focus:ring-blue-200"
                ></textarea>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-slate-500">Available tables: commits, file_churn, contributors</span>
                    <button
                        class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
                        onclick={runSqlQuery}
                        disabled={isSqlLoading}
                    >
                        {isSqlLoading ? 'Running...' : 'Run Query'}
                    </button>
                </div>
            </div>

            {#if sqlError}
                <div class="mt-4 p-4 bg-red-100 text-red-700 rounded font-mono text-sm">
                    {sqlError}
                </div>
            {:else if sqlResult}
                <div class="mt-6 overflow-x-auto">
                    <div class="mb-2 text-xs text-slate-500 text-right">
                        Query executed in {sqlResult.executionTimeMs.toFixed(2)}ms
                    </div>
                    <table class="min-w-full divide-y divide-gray-200 text-sm">
                        <thead class="bg-gray-100">
                            <tr>
                                {#each sqlResult.columns as col}
                                    <th class="px-4 py-2 text-left font-semibold text-gray-700">{col}</th>
                                {/each}
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 bg-white">
                            {#each sqlResult.rows as row}
                                <tr>
                                    {#each sqlResult.columns as col}
                                        <td class="px-4 py-2 whitespace-nowrap">{row[col] ?? 'NULL'}</td>
                                    {/each}
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
    {/if}
</div>
