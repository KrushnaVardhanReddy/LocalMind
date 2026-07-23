<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { checkWebGPUSupport } from '$lib/utils/webgpu-check';
    import { proxy } from 'comlink';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import type { WebLLMWorkerContract, ChatMessage } from '../../../docs/contracts/phase-5/webllm_worker_contract';

    let webgpuSupported = $state(true);
    let webgpuError = $state('');

    let modelId = $state('Phi-3-mini-4k-instruct-q4f16_1-MLC');
    let loadedModel = $state<string | null>(null);
    let isDownloading = $state(false);
    let downloadProgress = $state(0);
    let downloadText = $state('');

    let chatInput = $state('');
    let messages = $state<ChatMessage[]>([]);
    let isGenerating = $state(false);

    let webllmWorker: any;

    onMount(async () => {
        const check = checkWebGPUSupport();
        if (!check.supported) {
            webgpuSupported = false;
            webgpuError = check.reason || 'WebGPU is not supported.';
            return;
        }

        webllmWorker = await WorkerManager.getWebLLM();
        loadedModel = await webllmWorker.getLoadedModel();
    });

    onDestroy(async () => {
        if (webllmWorker) {
            await webllmWorker.unloadModel();
        }
    });

    async function handleLoadModel() {
        if (!webllmWorker) return;
        isDownloading = true;
        downloadProgress = 0;
        downloadText = 'Initializing...';
        loadedModel = null;

        try {
            const onProgress = proxy((progress: number, text: string) => {
                downloadProgress = Math.round(progress * 100);
                downloadText = text;
            });
            await webllmWorker.loadModel(modelId, onProgress);
            loadedModel = await webllmWorker.getLoadedModel();
        } catch (e: any) {
            console.error('Failed to load model', e);
            alert(`Failed to load model: ${e.message}`);
        } finally {
            isDownloading = false;
        }
    }

    async function handleCancelDownload() {
        if (!webllmWorker) return;
        isDownloading = false;
        await webllmWorker.unloadModel();
    }

    async function handleUnloadModel() {
        if (!webllmWorker) return;
        await webllmWorker.unloadModel();
        loadedModel = null;
    }

    async function handleSendMessage() {
        if (!webllmWorker || !loadedModel || !chatInput.trim()) return;

        messages = [...messages, { role: 'user', content: chatInput }];
        chatInput = '';
        isGenerating = true;

        messages = [...messages, { role: 'assistant', content: '' }];

        try {
            const onChunk = proxy((chunk: string) => {
                messages[messages.length - 1].content += chunk;
                messages = [...messages]; // trigger reactivity
            });
            await webllmWorker.chat(messages.slice(0, -1), undefined, onChunk);
        } catch (e: any) {
             console.error('Chat error', e);
             messages[messages.length - 1].content = `Error: ${e.message}`;
             messages = [...messages];
        } finally {
            isGenerating = false;
        }
    }

</script>

<svelte:head>
    <title>Intelligence | LocalMind</title>
</svelte:head>

<div class="p-6 h-full flex flex-col">
    <h1 class="text-2xl font-bold mb-4 text-white">Intelligence (Local AI)</h1>

    {#if !webgpuSupported}
        <div class="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            {webgpuError}
        </div>
    {:else}
        <div class="bg-gray-800 p-4 rounded-lg shadow-md mb-4 flex flex-wrap gap-4 items-end">
            <div class="flex-1 min-w-[200px]">
                <label for="model-select" class="block text-sm font-medium text-gray-300 mb-1">Select Model</label>
                <select
                    id="model-select"
                    bind:value={modelId}
                    disabled={isDownloading || loadedModel !== null}
                    class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                >
                    <option value="Phi-3-mini-4k-instruct-q4f16_1-MLC">Phi-3-mini-4k-instruct (q4) - ~2.3GB</option>
                    <option value="gemma-2b-it-q4f32_1-MLC">Gemma-2b-it (q4) - ~1.5GB</option>
                    <option value="Llama-3.2-1B-Instruct-q4f16_1-MLC">Llama-3.2-1B-Instruct (q4) - ~1GB</option>
                </select>
            </div>

            {#if !loadedModel && !isDownloading}
                <button
                    onclick={handleLoadModel}
                    class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Load Model
                </button>
            {/if}

            {#if loadedModel}
                <div class="flex items-center gap-4">
                    <span class="text-green-400">Model Loaded: {loadedModel}</span>
                    <button
                        onclick={handleUnloadModel}
                        class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Unload
                    </button>
                </div>
            {/if}
        </div>

        {#if isDownloading}
            <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div class="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
                    <h2 class="text-xl font-bold mb-2 text-white">Downloading Model</h2>
                    <p class="text-gray-300 mb-4 text-sm truncate">{downloadText}</p>
                    <div class="w-full bg-gray-700 rounded-full h-4 mb-4">
                        <div class="bg-blue-600 h-4 rounded-full transition-all duration-300" style="width: {downloadProgress}%"></div>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-white">{downloadProgress}%</span>
                        <button
                            onclick={handleCancelDownload}
                            class="bg-gray-600 hover:bg-gray-500 text-white py-1 px-3 rounded"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        {/if}

        <div class="flex-1 bg-gray-900 rounded-lg shadow-inner overflow-hidden flex flex-col min-h-0 border border-gray-800">
            <div class="flex-1 overflow-y-auto p-4 space-y-4">
                {#if messages.length === 0}
                    <div class="text-gray-500 text-center mt-10">
                        {loadedModel ? "Model loaded. Start chatting!" : "Load a model to start chatting. Data stays 100% locally."}
                    </div>
                {/if}
                {#each messages as msg, i}
                    <div class="flex flex-col {msg.role === 'user' ? 'items-end' : 'items-start'}">
                        <div class="max-w-[80%] rounded-lg p-3 {msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}">
                            <span class="text-xs opacity-50 block mb-1">{msg.role === 'user' ? 'You' : loadedModel || 'AI'}</span>
                            <div class="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                    </div>
                {/each}
            </div>

            <div class="p-3 border-t border-gray-800 bg-gray-800 flex gap-2">
                <input
                    type="text"
                    bind:value={chatInput}
                    onkeydown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    disabled={!loadedModel || isGenerating}
                    placeholder={loadedModel ? "Type a message..." : "Load a model first..."}
                    class="flex-1 bg-gray-900 border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
                <button
                    onclick={handleSendMessage}
                    disabled={!loadedModel || isGenerating || !chatInput.trim()}
                    class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Send
                </button>
            </div>
        </div>
    {/if}
</div>
