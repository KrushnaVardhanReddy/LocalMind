<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import type { ChatMessage, WebLLMWorkerContract } from '$lib/contracts/phase-5/webllm_worker_contract';
    import { proxy } from 'comlink';

    let webllmWorker: WebLLMWorkerContract | null = null;
    let sqliteWorker: any = null;

    let models = [
        'Phi-3-mini-4k-instruct-q4',
        'Gemma-2b-it-q4f32_1',
        'Llama-3.2-1B-Instruct-q4f16_1'
    ];
    let selectedModel = $state(models[0]);
    let isModelLoaded = $state(false);
    let isModelLoading = $state(false);
    let loadProgress = $state({ progress: 0, text: '' });

    import { writable, type Writable } from 'svelte/store';

    let messagesStore: Writable<ChatMessage[]> = writable([]);
    let userInput = $state('');
    let isGenerating = $state(false);
    let currentResponse = $state('');

    let systemPrompt = $state('You are LocalMind Assistant, a helpful local AI. All processing is done on this device.');
    let showSystemPrompt = $state(false);

    let chatContainer: HTMLElement;

    onMount(() => {
        const init = async () => {
            webllmWorker = await WorkerManager.getWebLLM();
            sqliteWorker = await WorkerManager.getSQLite();

            try {
                const savedPrompt = await sqliteWorker.getPreference('system_prompt');
                if (savedPrompt) {
                    systemPrompt = savedPrompt;
                }
            } catch (e) {
                console.error("Failed to load system prompt from preferences", e);
            }

            try {
                if (webllmWorker) {
                    const loadedModel = await webllmWorker.getLoadedModel();
                    if (loadedModel) {
                        selectedModel = loadedModel;
                        isModelLoaded = true;
                    }
                }
            } catch (e) {
                console.error("Error getting loaded model", e);
            }
        };

        init();

        // Handle navigation away
        return () => {
            if (webllmWorker) {
                webllmWorker.unloadModel().catch(console.error);
            }
        };
    });

    async function handleLoadModel() {
        if (!webllmWorker) return;

        isModelLoading = true;
        loadProgress = { progress: 0, text: 'Starting download...' };

        try {
            await webllmWorker.loadModel(selectedModel, (progress, text) => {
                loadProgress = { progress: Math.round(progress * 100), text };
            });
            isModelLoaded = true;
        } catch (e: any) {
            alert(`Failed to load model: ${e.message}`);
        } finally {
            isModelLoading = false;
        }
    }

    async function handleUnloadModel() {
        if (!webllmWorker) return;

        try {
            await webllmWorker.unloadModel();
            isModelLoaded = false;
        } catch (e: any) {
            alert(`Failed to unload model: ${e.message}`);
        }
    }

    async function handleSend() {
        if (!userInput.trim() || !webllmWorker || !isModelLoaded || isGenerating) return;

        messagesStore.update(m => [...m, { role: 'user', content: userInput.trim() }]);
        userInput = '';
        currentResponse = '';
        isGenerating = true;

        await scrollToBottom();

        let messagesArray: ChatMessage[] = [];
        messagesStore.subscribe(val => {
            messagesArray = val;
        })();

        try {
            const onToken = proxy(async (token: string) => {
                currentResponse += token;
                await scrollToBottom();
            });

            await webllmWorker.chat(messagesArray, systemPrompt, onToken);

            messagesStore.update(m => [...m, { role: 'assistant', content: currentResponse }]);
            currentResponse = '';
        } catch (e: any) {
            messagesStore.update(m => [...m, { role: 'assistant', content: `[Error: ${e.message}]` }]);
        } finally {
            isGenerating = false;
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSend();
        }
    }

    async function scrollToBottom() {
        await tick();
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    async function saveSystemPrompt() {
        if (sqliteWorker) {
            try {
                await sqliteWorker.setPreference('system_prompt', systemPrompt);
                alert('System prompt saved.');
            } catch (e) {
                console.error('Failed to save system prompt', e);
                alert('Failed to save system prompt.');
            }
        }
    }

    function handleNewChat() {
        messagesStore.set([]);
        currentResponse = '';
    }

    function handleExportChat() {
        let content = `# LocalMind Chat Export\n\n**Model:** ${selectedModel}\n**System Prompt:** ${systemPrompt}\n\n`;

        let messagesArray: ChatMessage[] = [];
        messagesStore.subscribe(val => {
            messagesArray = val;
        })();

        for (const msg of messagesArray) {
            content += `### ${msg.role === 'user' ? 'You' : 'Assistant'}\n${msg.content}\n\n`;
        }

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `localmind-chat-${new Date().toISOString().slice(0, 10)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
</script>

<div class="flex flex-col h-full bg-white relative">
    <!-- Header -->
    <header class="flex items-center justify-between p-4 border-b bg-slate-50">
        <div class="flex items-center gap-4">
            <h1 class="text-xl font-semibold text-slate-800">Local Chat</h1>
            <div class="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
                🔒 Running locally — no data sent anywhere
            </div>
        </div>

        <div class="flex items-center gap-2">
            <select class="border border-slate-300 rounded p-1.5 text-sm" bind:value={selectedModel} disabled={isModelLoaded || isModelLoading}>
                {#each models as model}
                    <option value={model}>{model}</option>
                {/each}
            </select>

            {#if isModelLoaded}
                <button class="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded text-sm font-medium transition-colors" onclick={handleUnloadModel}>
                    Unload Model
                </button>
            {:else}
                <button class="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50" onclick={handleLoadModel} disabled={isModelLoading}>
                    {isModelLoading ? 'Loading...' : 'Load Model'}
                </button>
            {/if}

            <button class="bg-slate-200 text-slate-700 hover:bg-slate-300 px-3 py-1.5 rounded text-sm font-medium ml-2" onclick={handleNewChat}>
                New Chat
            </button>
            <button class="bg-slate-200 text-slate-700 hover:bg-slate-300 px-3 py-1.5 rounded text-sm font-medium" onclick={handleExportChat}>
                Export Chat
            </button>
        </div>
    </header>

    <!-- Chat Messages -->
    <main class="flex-1 overflow-y-auto p-4 space-y-6" bind:this={chatContainer}>
        {#if $messagesStore.length === 0 && !currentResponse}
            <div class="h-full flex items-center justify-center text-slate-400">
                Send a message to start a local conversation.
            </div>
        {/if}

        {#each $messagesStore as msg}
            <div class="flex flex-col max-w-3xl {msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}">
                <div class="text-xs font-medium text-slate-500 mb-1">{msg.role === 'user' ? 'You' : 'Assistant'}</div>
                <div class="px-4 py-3 rounded-xl whitespace-pre-wrap {msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}">
                    {msg.content}
                </div>
            </div>
        {/each}

        {#if currentResponse}
            <div class="flex flex-col max-w-3xl mr-auto items-start">
                <div class="text-xs font-medium text-slate-500 mb-1">Assistant</div>
                <div class="px-4 py-3 rounded-xl whitespace-pre-wrap bg-slate-100 text-slate-800 rounded-bl-none">
                    {currentResponse}<span class="animate-pulse">_</span>
                </div>
            </div>
        {/if}

        {#if isGenerating && !currentResponse}
            <div class="flex flex-col max-w-3xl mr-auto items-start">
                <div class="px-4 py-3 rounded-xl bg-slate-100 text-slate-500 rounded-bl-none flex items-center gap-1 h-[48px]">
                    <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                    <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                    <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
                </div>
            </div>
        {/if}
    </main>

    <!-- Input Area -->
    <footer class="p-4 border-t bg-white">
        <!-- System Prompt Accordion -->
        <div class="mb-4">
            <button class="text-sm text-slate-500 font-medium hover:text-slate-700 flex items-center gap-1" onclick={() => showSystemPrompt = !showSystemPrompt}>
                <svg class="w-4 h-4 transition-transform {showSystemPrompt ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                System Prompt
            </button>
            {#if showSystemPrompt}
                <div class="mt-2 p-3 bg-slate-50 border rounded-lg">
                    <textarea class="w-full text-sm p-2 border rounded resize-y focus:outline-blue-500" rows="3" bind:value={systemPrompt}></textarea>
                    <div class="mt-2 flex justify-end">
                        <button class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700" onclick={saveSystemPrompt}>Save as Default</button>
                    </div>
                </div>
            {/if}
        </div>

        <div class="flex items-end gap-2 max-w-4xl mx-auto">
            <textarea
                class="flex-1 border border-slate-300 rounded-lg p-3 resize-none focus:outline-blue-500 min-h-[56px] max-h-40"
                placeholder={isModelLoaded ? "Type a message... (Ctrl+Enter to send)" : "Please load a model first..."}
                rows="2"
                bind:value={userInput}
                onkeydown={handleKeyDown}
                disabled={!isModelLoaded || isGenerating}
            ></textarea>
            <button
                aria-label="Send message"
                title="Send message"
                class="bg-blue-600 text-white rounded-lg p-3 hover:bg-blue-700 transition-colors disabled:opacity-50 h-[56px] flex items-center justify-center min-w-[56px]"
                onclick={handleSend}
                disabled={!userInput.trim() || !isModelLoaded || isGenerating}
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
        </div>
    </footer>

    <!-- Loading Modal -->
    {#if isModelLoading}
        <div class="absolute inset-0 bg-slate-900/50 flex items-center justify-center z-50">
            <div class="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
                <h3 class="text-lg font-semibold text-slate-800 mb-2">Downloading Model</h3>
                <p class="text-sm text-slate-600 mb-4">{selectedModel}</p>

                <div class="w-full bg-slate-200 rounded-full h-2 mb-2 overflow-hidden">
                    <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: {loadProgress.progress}%"></div>
                </div>
                <div class="flex justify-between text-xs text-slate-500 mb-6">
                    <span>{loadProgress.text}</span>
                    <span>{loadProgress.progress}%</span>
                </div>

                <div class="flex justify-end">
                    <button class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium" onclick={() => {
                        handleUnloadModel();
                        isModelLoading = false;
                    }}>Cancel</button>
                </div>
            </div>
        </div>
    {/if}
</div>