<script lang="ts">
    import { onMount } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import { uploadedTables } from '$lib/stores/analytics.store';
    import { get } from 'svelte/store';
    import { goto } from '$app/navigation';

    type RecentFile = {
        name: string;
        workspaceType: string;
        timestamp: number;
    };

    let recentFiles = $state<RecentFile[]>([]);

    // Quick actions state
    let isUploading = $state(false);
    let sampleDataLoading = $state(false);

    onMount(async () => {
        try {
            const sqliteWorker = await WorkerManager.getSQLite();

            // Getting all workspaces and then all files is inefficient for a real app,
            // but fine for LocalMind's SQLite DB locally.
            const workspaces = await sqliteWorker.listWorkspaces();

            let allFiles: RecentFile[] = [];

            for (const ws of workspaces) {
                const files = await sqliteWorker.listFiles(ws.id);
                for (const file of files) {
                    allFiles.push({
                        name: file.file_name,
                        workspaceType: 'Analytics', // Currently we only have analytics files in SQLite registered_files
                        timestamp: file.registered_at
                    });
                }
            }

            // Sort by timestamp desc and take top 10
            recentFiles = allFiles.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

            // Add some mock ones if empty for visual
            if (recentFiles.length === 0) {
                recentFiles = [
                    { name: 'sales_2024.csv', workspaceType: 'Analytics', timestamp: Date.now() / 1000 - 120 },
                    { name: 'contract_v3.pdf', workspaceType: 'Docs', timestamp: Date.now() / 1000 - 3600 },
                    { name: 'server_logs.har', workspaceType: 'DevTools', timestamp: Date.now() / 1000 - 86400 }
                ];
            }
        } catch (e) {
            console.error('Failed to load recent files:', e);
        }
    });

    function formatTimeAgo(timestampInSeconds: number) {
        const seconds = Math.floor(Date.now() / 1000) - timestampInSeconds;

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    }

    async function handleOpenFile() {
        try {
            // Check if showOpenFilePicker is available (some browsers/modes don't have it)
            if (typeof (window as any).showOpenFilePicker !== 'function') {
                alert('File System Access API is not supported in this browser.');
                return;
            }

            isUploading = true;
            const [fileHandle] = await (window as any).showOpenFilePicker({
                types: [
                    {
                        description: 'Supported Data Files',
                        accept: {
                            'text/csv': ['.csv'],
                            'application/json': ['.json']
                        }
                    }
                ],
                excludeAcceptAllOption: false
            });

            const file = await fileHandle.getFile();

            // Get DuckDB worker and register
            const db = await WorkerManager.getDuckDB();
            const tableName = file.name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
            await db.registerFile(file, tableName);

            const currentTables = get(uploadedTables);
            if (!currentTables.includes(tableName)) {
                uploadedTables.set([...currentTables, tableName]);
            }
            goto('/analytics');

        } catch (e) {
            console.error(e);
        } finally {
            isUploading = false;
        }
    }

    async function handlePasteData() {
        try {
            const text = await navigator.clipboard.readText();
            if (!text) {
                alert('Clipboard is empty.');
                return;
            }

            // VERY basic heuristic to guess if it's JSON or CSV
            let extension = 'csv';
            let blobType = 'text/csv';
            if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
                extension = 'json';
                blobType = 'application/json';
            }

            const file = new File([text], `pasted_data_${Date.now()}.${extension}`, { type: blobType });

            const db = await WorkerManager.getDuckDB();
            const tableName = file.name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
            await db.registerFile(file, tableName);

            const currentTables = get(uploadedTables);
            if (!currentTables.includes(tableName)) {
                uploadedTables.set([...currentTables, tableName]);
            }
            goto('/analytics');
        } catch (e) {
            console.error('Failed to read clipboard', e);
            alert('Could not read from clipboard. Ensure you granted permission.');
        }
    }

    async function handleTrySampleData() {
        try {
            sampleDataLoading = true;
            const response = await fetch('/demo_sales.csv');
            if (!response.ok) throw new Error('Failed to fetch sample data');

            const blob = await response.blob();
            const file = new File([blob], 'demo_sales.csv', { type: 'text/csv' });

            const db = await WorkerManager.getDuckDB();
            await db.registerFile(file, 'demo_sales');

                        const currentTables = get(uploadedTables);
            if (!currentTables.includes('demo_sales')) {
                uploadedTables.set([...currentTables, 'demo_sales']);
            }
            goto('/analytics');
        } catch (e) {
            console.error(e);
            alert('Failed to load sample data.');
        } finally {
            sampleDataLoading = false;
        }
    }

    const cards = [
        {
            title: 'Analytics',
            icon: '📊',
            description: 'CSV, SQL, Charts, Dashboards',
            path: '/analytics',
            color: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
        },
        {
            title: 'Docs',
            icon: '📄',
            description: 'PDF, OCR, Search, Redaction',
            path: '/docs',
            color: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
        },
        {
            title: 'DevTools',
            icon: '🛠️',
            description: 'JSON, Git, Logs, HAR, PCAP',
            path: '/devtools',
            color: 'bg-amber-50 hover:bg-amber-100 border-amber-200'
        },
        {
            title: 'Media',
            icon: '🎬',
            description: 'FFmpeg, Whisper, Audio, Video',
            path: '/media',
            color: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
        }
    ];
</script>

<svelte:head>
    <title>LocalMind Workspace</title>
</svelte:head>

<div class="max-w-6xl mx-auto p-6 mt-8">

    <div class="mb-12 text-center">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">Welcome to LocalMind</h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            The privacy-first workspace. Process data, documents, and media entirely in your browser using WASM.
        </p>
        <div class="mt-6 inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-medium border border-emerald-300">
            <span>🔒</span> Zero data leaves your device
        </div>
    </div>

    <!-- Quick Actions -->
    <div class="flex flex-wrap justify-center gap-4 mb-12">
        <button
            onclick={handleOpenFile}
            disabled={isUploading}
            class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium shadow-md transition disabled:opacity-50"
        >
            <span>📂</span> {isUploading ? 'Opening...' : 'Open File'}
        </button>
        <button
            onclick={handlePasteData}
            class="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-medium shadow-sm transition"
        >
            <span>📋</span> Paste Data
        </button>
        <button
            onclick={handleTrySampleData}
            disabled={sampleDataLoading}
            class="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-medium shadow-sm transition disabled:opacity-50"
        >
            <span>🎯</span> {sampleDataLoading ? 'Loading...' : 'Try Sample Data'}
        </button>
    </div>

    <!-- Workspaces Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {#each cards as card}
            <a
                href={card.path}
                class="flex flex-col items-center p-8 rounded-xl border-2 transition shadow-sm {card.color}"
            >
                <span class="text-5xl mb-4">{card.icon}</span>
                <h2 class="text-xl font-bold text-gray-900 mb-2">{card.title}</h2>
                <p class="text-gray-600 text-center font-medium">{card.description}</p>
            </a>
        {/each}
    </div>

    <!-- Recent Files -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🕒</span> Recent Files
        </h3>

        {#if recentFiles.length > 0}
            <div class="divide-y divide-gray-100">
                {#each recentFiles as file}
                    <div class="py-3 flex items-center justify-between hover:bg-gray-50 rounded px-2 -mx-2 transition cursor-pointer">
                        <div class="flex items-center gap-3">
                            <span class="text-xl">
                                {#if file.workspaceType === 'Analytics'}📊
                                {:else if file.workspaceType === 'Docs'}📄
                                {:else if file.workspaceType === 'DevTools'}🛠️
                                {:else if file.workspaceType === 'Media'}🎬
                                {:else}📁{/if}
                            </span>
                            <div>
                                <div class="font-medium text-gray-900">{file.name}</div>
                                <div class="text-sm text-gray-500">{file.workspaceType}</div>
                            </div>
                        </div>
                        <div class="text-sm text-gray-400">
                            {formatTimeAgo(file.timestamp)}
                        </div>
                    </div>
                {/each}
            </div>
        {:else}
            <div class="text-center py-8 text-gray-500">
                No recent files found. Open a file to get started!
            </div>
        {/if}
    </div>

</div>
