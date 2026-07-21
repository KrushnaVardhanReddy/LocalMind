<script lang="ts">
    import { onMount } from 'svelte';
    import JSZip from 'jszip';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import { installPlugin, removePlugin } from '$lib/plugin-runtime/loader';
    import { createPluginWorker } from '$lib/plugin-runtime/plugin-worker';
    import type { InstalledPluginRecord } from '$lib/contracts/wa_sqlite_contract';
    import type { PluginManifest } from '$lib/plugin-runtime/contract';

    let plugins: InstalledPluginRecord[] = [];
    let errorMsg: string | null = null;
    let testOutput: string | null = null;

    async function loadPlugins() {
        const sqlite = await WorkerManager.getSQLite();
        plugins = await sqlite.listPlugins();
    }

    onMount(() => {
        loadPlugins();
    });

    async function handleDrop(e: DragEvent) {
        e.preventDefault();
        errorMsg = null;

        if (!e.dataTransfer?.files.length) return;
        const file = e.dataTransfer.files[0];

        if (!file.name.endsWith('.zip')) {
            errorMsg = 'Please upload a .zip file containing plugin.wasm and plugin.json';
            return;
        }

        try {
            const buffer = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(buffer);

            const wasmFile = zip.file('plugin.wasm');
            const jsonFile = zip.file('plugin.json');

            if (!wasmFile || !jsonFile) {
                throw new Error('ZIP must contain plugin.wasm and plugin.json');
            }

            const wasmBuffer = await wasmFile.async('arraybuffer');
            const jsonStr = await jsonFile.async('string');
            const manifest: PluginManifest = JSON.parse(jsonStr);

            const pluginId = crypto.randomUUID();
            await installPlugin(pluginId, wasmBuffer, manifest);

            await loadPlugins();
        } catch (e: any) {
            errorMsg = e.message || 'Failed to install plugin';
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
    }

    async function togglePlugin(plugin: InstalledPluginRecord) {
        const sqlite = await WorkerManager.getSQLite();
        await sqlite.updatePluginEnabled(plugin.id, plugin.enabled === 1 ? false : true);
        await loadPlugins();
    }

    async function doRemovePlugin(pluginId: string) {
        WorkerManager.removePluginWorker(pluginId);
        await removePlugin(pluginId);
        await loadPlugins();
    }

    async function testPlugin(pluginId: string) {
        errorMsg = null;
        testOutput = null;
        try {
            // Check if worker is already running or create a new one
            let worker = WorkerManager.getPluginWorker(pluginId);
            if (!worker) {
                worker = await createPluginWorker(pluginId);
            }

            const testPayload = "hello localmind";
            const encoder = new TextEncoder();
            const inputBuffer = encoder.encode(testPayload).buffer;

            const outputBuffer = await worker.process(inputBuffer);

            const decoder = new TextDecoder();
            testOutput = decoder.decode(outputBuffer);
        } catch (e: any) {
            errorMsg = e.message || 'Test failed';
        }
    }

</script>

<div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Plugin Manager</h1>

    {#if errorMsg}
        <div class="bg-red-100 text-red-800 p-3 rounded mb-4">
            {errorMsg}
        </div>
    {/if}

    <div
        role="button"
        tabindex="0"
        class="border-2 border-dashed border-gray-300 p-8 rounded text-center mb-8 bg-gray-50 hover:bg-gray-100"
        on:drop={handleDrop}
        on:dragover={handleDragOver}
    >
        <p class="text-gray-600">Drag and drop a plugin .zip file here to install</p>
    </div>

    <div class="space-y-4">
        {#each plugins as plugin}
            <div class="border p-4 rounded bg-white shadow-sm flex items-center justify-between">
                <div>
                    <h3 class="font-semibold text-lg">{plugin.name} v{plugin.version}</h3>
                    {#if plugin.description}
                        <p class="text-gray-600 text-sm">{plugin.description}</p>
                    {/if}
                    <p class="text-xs text-gray-500 mt-1">Author: {plugin.author || 'Unknown'}</p>
                </div>
                <div class="flex items-center space-x-3">
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" class="mr-2" checked={plugin.enabled === 1} on:change={() => togglePlugin(plugin)} />
                        Enabled
                    </label>

                    <button
                        class="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        on:click={() => testPlugin(plugin.id)}
                    >
                        Test Plugin
                    </button>
                    <button
                        class="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        on:click={() => doRemovePlugin(plugin.id)}
                    >
                        Remove
                    </button>
                </div>
            </div>
        {/each}
        {#if plugins.length === 0}
            <p class="text-gray-500 italic">No plugins installed.</p>
        {/if}
    </div>

    {#if testOutput}
        <div class="mt-8 p-4 bg-gray-900 text-green-400 rounded font-mono">
            <h3>Test Output:</h3>
            <pre>{testOutput}</pre>
        </div>
    {/if}
</div>