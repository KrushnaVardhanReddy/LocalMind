<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import type { JqWorkerContract } from '$lib/contracts/phase-4/jq_worker_contract';

    let Monaco: any = null;
    let editorContainer: HTMLDivElement;
    let outputContainer: HTMLDivElement;
    let inputEditor: any;
    let outputEditor: any;

    let queryType: 'jq' | 'jsonpath' = 'jq';
    let query = '.users[] | select(.age > 30) | .name';
    let errorStr = '';
    let execTimeMs = 0;
    let outputSizeBytes = 0;

    let jqWorker: any;

    onMount(async () => {
        if (!browser) return;

        jqWorker = await WorkerManager.getJq();

        // Load monaco
        Monaco = await import('monaco-editor');

        inputEditor = Monaco.editor.create(editorContainer, {
            value: "{\n  \"users\": [\n    { \"name\": \"Alice\", \"age\": 25 },\n    { \"name\": \"Bob\", \"age\": 35 }\n  ]\n}",
            language: 'json',
            theme: 'vs-dark',
            minimap: { enabled: false },
            automaticLayout: true,
        });

        outputEditor = Monaco.editor.create(outputContainer, {
            value: '',
            language: 'json',
            theme: 'vs-dark',
            readOnly: true,
            minimap: { enabled: false },
            automaticLayout: true,
        });

        runQuery();
    });

    onDestroy(() => {
        if (inputEditor) inputEditor.dispose();
        if (outputEditor) outputEditor.dispose();
    });

    async function runQuery() {
        if (!jqWorker || !inputEditor) return;
        errorStr = '';
        execTimeMs = 0;
        outputSizeBytes = 0;

        try {
            const inputVal = inputEditor.getValue();
            if (!inputVal.trim() || !query.trim()) {
                outputEditor.setValue('');
                return;
            }

            const result = await jqWorker.executeQuery(query, inputVal, queryType);

            if (result.error) {
                errorStr = result.error;
                outputEditor.setValue('');
            } else {
                outputEditor.setValue(result.output);
                execTimeMs = result.executionTimeMs;
                outputSizeBytes = new Blob([result.output]).size;
            }
        } catch (e: any) {
            errorStr = `Error executing query: ${e.message}`;
            outputEditor.setValue('');
        }
    }

    async function handleFileDrop(e: DragEvent) {
        e.preventDefault();
        const file = e.dataTransfer?.files[0];
        if (!file || !file.name.endsWith('.json')) {
            alert('Please drop a valid .json file');
            return;
        }

        const text = await file.text();
        inputEditor.setValue(text);
        runQuery();
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
    }

    async function copyOutput() {
        if (!outputEditor) return;
        const text = outputEditor.getValue();
        if (text) {
            try {
                await navigator.clipboard.writeText(text);
            } catch (err) {
                console.error('Failed to copy', err);
            }
        }
    }

    function exportFile() {
        if (!outputEditor) return;
        const text = outputEditor.getValue();
        if (!text) return;

        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'query_result.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
</script>

<div class="flex flex-col h-full bg-slate-900 text-slate-200">
    <div class="p-6 border-b border-slate-700 bg-slate-800 flex flex-col gap-4">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-white mb-2">JSONPath & jq Sandbox</h1>
                <p class="text-slate-400">Offline visual editor to execute queries against large JSON payloads instantly.</p>
            </div>
            <a href="/devtools" class="text-blue-400 hover:text-blue-300 text-sm flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Hub
            </a>
        </div>

        <div class="flex gap-4 items-center">
            <select bind:value={queryType} class="bg-slate-700 text-white rounded p-2 border border-slate-600 focus:outline-none focus:border-blue-500" on:change={() => {
                query = queryType === 'jq' ? '.users[] | select(.age > 30) | .name' : '$.users[?(@.age > 30)].name';
                runQuery();
            }}>
                <option value="jq">jq</option>
                <option value="jsonpath">JSONPath</option>
            </select>
            <input type="text" bind:value={query} class="flex-1 bg-slate-950 text-white font-mono p-2 rounded border border-slate-700 focus:outline-none focus:border-blue-500" placeholder="Enter query..." on:keyup={(e) => { if (e.key === 'Enter') runQuery() }} />
            <button on:click={runQuery} class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded">Run</button>
        </div>
        {#if errorStr}
            <div class="text-red-400 text-sm font-mono mt-2 bg-red-900/30 p-2 border border-red-500 rounded">
                {errorStr}
            </div>
        {/if}
    </div>

    <div class="flex-1 flex overflow-hidden">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="w-1/2 flex flex-col border-r border-slate-700 h-full"
            on:drop={handleFileDrop}
            on:dragover={handleDragOver}
        >
            <div class="p-2 border-b border-slate-700 bg-slate-800 text-sm font-semibold text-slate-400">Input JSON (Drop file here)</div>
            <div bind:this={editorContainer} class="flex-1 w-full h-full"></div>
        </div>

        <div class="w-1/2 flex flex-col h-full bg-slate-950">
            <div class="p-2 border-b border-slate-700 bg-slate-800 flex justify-between items-center text-sm">
                <div class="font-semibold text-slate-400">Output Result</div>
                <div class="flex gap-4 items-center">
                    {#if execTimeMs > 0 || outputSizeBytes > 0}
                        <span class="text-slate-500 text-xs">Executed in {execTimeMs}ms | {(outputSizeBytes / 1024).toFixed(2)} KB</span>
                    {/if}
                    <div class="flex gap-2">
                        <button on:click={copyOutput} class="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-200">Copy</button>
                        <button on:click={exportFile} class="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white">Export</button>
                    </div>
                </div>
            </div>
            <div bind:this={outputContainer} class="flex-1 w-full h-full"></div>
        </div>
    </div>
</div>
