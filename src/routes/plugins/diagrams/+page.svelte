<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { proxy } from 'comlink';
    import MermaidRenderer from '$lib/components/plugins/diagrams/MermaidRenderer.svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import { Bot, Play, Settings, RefreshCw, XCircle } from 'lucide-svelte';

    const AVAILABLE_MODELS = [
        { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", label: "Llama-3.2 1B (Fastest)" },
        { id: "Phi-3-mini-4k-instruct-q4f16_1-MLC", label: "Phi-3 Mini (Balanced)" },
        { id: "gemma-2b-it-q4f32_1-MLC", label: "Gemma 2B (Creative)" }
    ];

    let webllmWorker: any = null;
    let selectedModelId = $state(AVAILABLE_MODELS[0].id);
    let loadedModelId = $state<string | null>(null);
    let isModelLoading = $state(false);
    let loadProgress = $state({ progress: 0, text: '' });

    let prompt = $state('');
    let mermaidCode = $state('graph TD\n    A[Start] --> B{Is it a diagram?}\n    B -- Yes --> C[Render SVG]\n    B -- No --> D[Show Error]');
    let isGenerating = $state(false);

    onMount(async () => {
        webllmWorker = await WorkerManager.getWebLLM();
        loadedModelId = await webllmWorker.getLoadedModel();
    });

    onDestroy(async () => {
        // We don't unload the model here as the user might be using it in other plugins
    });

    async function loadModel() {
        if (!webllmWorker) return;
        isModelLoading = true;
        try {
            await webllmWorker.loadModel(selectedModelId, proxy((progress: number, text: string) => {
                loadProgress = { progress: Math.round(progress * 100), text };
            }));
            loadedModelId = await webllmWorker.getLoadedModel();
        } catch (e: any) {
            console.error("Failed to load model:", e);
            alert("Failed to load model: " + e.message);
        } finally {
            isModelLoading = false;
        }
    }

    async function generateDiagram() {
        if (!webllmWorker || !loadedModelId || !prompt.trim()) return;

        isGenerating = true;
        mermaidCode = '';

        const systemPrompt = `You are an expert at creating mermaid.js diagrams.
Output ONLY the raw mermaid code, no markdown wrappers, no explanations.
If the user asks for a specific type of diagram, generate valid mermaid syntax for it.
Do not include \`\`\`mermaid or \`\`\` at the beginning or end of your response.
Do not include any other markdown formatting or literal newlines in your response that would break the mermaid parser.`;

        const messages = [{ role: 'user', content: prompt }];

        try {
            await webllmWorker.chat(
                messages,
                systemPrompt,
                proxy((token: string) => {
                    mermaidCode += token;
                })
            );
        } catch (e: any) {
            console.error("Failed to generate diagram:", e);
            mermaidCode = `graph TD\n    Error[Error Generating Diagram] --> Details["${e.message || 'Unknown Error'}"]`;
        } finally {
            isGenerating = false;
            // Clean up potentially broken model output
            mermaidCode = mermaidCode.trim();
            if (mermaidCode.startsWith('```mermaid')) {
                mermaidCode = mermaidCode.replace(/^```mermaid\n/, '');
            }
            if (mermaidCode.endsWith('```')) {
                mermaidCode = mermaidCode.replace(/\n```$/, '');
            }
        }
    }
</script>

<svelte:head>
    <title>AI Diagrams - LocalMind OS</title>
</svelte:head>

<div class="h-full flex flex-col bg-slate-50">
    <header class="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-3">
            <div class="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <Bot size={20} />
            </div>
            <div>
                <h1 class="text-xl font-bold text-slate-800 leading-none">AI Diagrams</h1>
                <p class="text-sm text-slate-500 mt-1">Generate Mermaid diagrams locally with WebLLM</p>
            </div>
        </div>

        <div class="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-2">
            {#if loadedModelId}
                <div class="flex items-center gap-2 px-2">
                    <span class="relative flex h-3 w-3">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span class="text-xs font-medium text-slate-700 truncate max-w-[150px]" title={loadedModelId}>
                        {loadedModelId.split('-')[0]} loaded
                    </span>
                </div>
            {:else}
                <select
                    bind:value={selectedModelId}
                    disabled={isModelLoading}
                    class="text-sm bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    {#each AVAILABLE_MODELS as model}
                        <option value={model.id}>{model.label}</option>
                    {/each}
                </select>

                <button
                    onclick={loadModel}
                    disabled={isModelLoading}
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded shadow-sm transition-colors"
                >
                    {#if isModelLoading}
                        <RefreshCw size={14} class="animate-spin" />
                        {loadProgress.progress}%
                    {:else}
                        <Play size={14} />
                        Load Model
                    {/if}
                </button>
            {/if}
        </div>
    </header>

    <div class="flex-1 flex overflow-hidden">
        <!-- Left Pane: Editor -->
        <div class="w-1/3 min-w-[350px] max-w-[500px] border-r border-slate-200 flex flex-col bg-white">
            <div class="p-4 border-b border-slate-200 flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                    <label for="prompt" class="text-sm font-semibold text-slate-700">AI Prompt</label>
                    <textarea
                        id="prompt"
                        bind:value={prompt}
                        placeholder="E.g., Create an architecture diagram of a web server with a load balancer and database..."
                        class="w-full h-24 p-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none transition-colors"
                        disabled={!loadedModelId || isGenerating}
                    ></textarea>
                </div>

                <button
                    onclick={generateDiagram}
                    disabled={!loadedModelId || isGenerating || !prompt.trim()}
                    class="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm transition-all"
                >
                    {#if isGenerating}
                        <RefreshCw size={18} class="animate-spin" />
                        Generating...
                    {:else}
                        <Bot size={18} />
                        Generate Diagram
                    {/if}
                </button>

                {#if !loadedModelId}
                    <p class="text-xs text-orange-600 text-center font-medium bg-orange-50 py-1.5 rounded border border-orange-100">
                        Load an AI model first to generate diagrams.
                    </p>
                {/if}
            </div>

            <div class="flex-1 flex flex-col overflow-hidden">
                <div class="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <label for="code" class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Mermaid Code</label>
                </div>
                <textarea
                    id="code"
                    bind:value={mermaidCode}
                    class="flex-1 w-full p-4 font-mono text-sm bg-white focus:outline-none resize-none text-slate-800"
                    spellcheck="false"
                ></textarea>
            </div>
        </div>

        <!-- Right Pane: Preview -->
        <div class="flex-1 p-6 bg-slate-100 overflow-hidden flex flex-col">
            <MermaidRenderer code={mermaidCode} />
        </div>
    </div>
</div>
