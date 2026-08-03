<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { proxy } from 'comlink';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import { BookOpen, FileText, Mic, Play, RefreshCw, Upload, CheckCircle2 } from 'lucide-svelte';
    import FlashcardViewer from '$lib/components/plugins/study-notes/FlashcardViewer.svelte';
    import { FLASHCARD_SYSTEM_PROMPT, extractFlashcardsFromResponse, type Flashcard } from '$lib/components/plugins/study-notes/FlashcardGenerator';

    const AVAILABLE_MODELS = [
        { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", label: "Llama-3.2 1B (Fastest)" },
        { id: "Phi-3-mini-4k-instruct-q4f16_1-MLC", label: "Phi-3 Mini (Balanced)" },
        { id: "gemma-2b-it-q4f32_1-MLC", label: "Gemma 2B (Creative)" }
    ];

    let webllmWorker: any = null;
    let whisperWorker: any = null;

    let selectedModelId = $state(AVAILABLE_MODELS[0].id);
    let loadedModelId = $state<string | null>(null);
    let isModelLoading = $state(false);
    let llmLoadProgress = $state({ progress: 0, text: '' });

    let isWhisperLoading = $state(false);
    let isWhisperLoaded = $state(false);
    let whisperLoadProgress = $state({ progress: 0, text: '' });

    let activeTab = $state<'text' | 'audio'>('text');
    let sourceText = $state('');
    let transcribedText = $state('');

    let isTranscribing = $state(false);
    let isGenerating = $state(false);

    let flashcards = $state<Flashcard[]>([]);
    let generationError = $state<string | null>(null);

    onMount(async () => {
        webllmWorker = await WorkerManager.getWebLLM();
        loadedModelId = await webllmWorker.getLoadedModel();

        whisperWorker = await WorkerManager.getWhisper();
    });

    async function loadLLMModel() {
        if (!webllmWorker) return;
        isModelLoading = true;
        try {
            await webllmWorker.loadModel(selectedModelId, proxy((progress: number, text: string) => {
                llmLoadProgress = { progress: Math.round(progress * 100), text };
            }));
            loadedModelId = await webllmWorker.getLoadedModel();
        } catch (e: any) {
            console.error("Failed to load WebLLM model:", e);
            alert("Failed to load model: " + e.message);
        } finally {
            isModelLoading = false;
        }
    }

    async function loadWhisperModel() {
        if (!whisperWorker || isWhisperLoaded) return;
        isWhisperLoading = true;
        try {
            await whisperWorker.init('tiny', proxy((data: any) => {
                if (data.status === 'progress') {
                    whisperLoadProgress = { progress: Math.round(data.progress), text: data.file };
                } else if (data.status === 'ready') {
                    whisperLoadProgress = { progress: 100, text: 'Ready' };
                }
            }));
            isWhisperLoaded = true;
        } catch (e: any) {
            console.error("Failed to load Whisper model:", e);
            alert("Failed to load transcription model: " + e.message);
        } finally {
            isWhisperLoading = false;
        }
    }

    async function handleAudioUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file || !whisperWorker) return;

        if (!isWhisperLoaded) {
            await loadWhisperModel();
        }

        isTranscribing = true;
        transcribedText = '';

        try {
            const buffer = await file.arrayBuffer();
            const result = await whisperWorker.transcribe(buffer);
            transcribedText = result.text;
        } catch (e: any) {
            console.error("Transcription failed:", e);
            alert("Transcription failed: " + e.message);
        } finally {
            isTranscribing = false;
        }
    }

    async function generateFlashcards() {
        if (!webllmWorker || !loadedModelId) return;

        const textToProcess = activeTab === 'text' ? sourceText : transcribedText;
        if (!textToProcess.trim()) return;

        isGenerating = true;
        generationError = null;
        let rawResponse = '';

        const messages = [{ role: 'user', content: textToProcess }];

        try {
            await webllmWorker.chat(
                messages,
                FLASHCARD_SYSTEM_PROMPT,
                proxy((token: string) => {
                    rawResponse += token;
                })
            );

            flashcards = extractFlashcardsFromResponse(rawResponse);
        } catch (e: any) {
            console.error("Failed to generate flashcards:", e);
            generationError = e.message || 'Unknown error occurred during generation.';

            // Helpful message if extraction failed
            if (e.message.includes('Failed to parse flashcards')) {
                 console.log("Raw LLM output:", rawResponse);
            }
        } finally {
            isGenerating = false;
        }
    }
</script>

<svelte:head>
    <title>Study Notes - LocalMind OS</title>
</svelte:head>

<div class="h-full flex flex-col bg-slate-50">
    <header class="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-3">
            <div class="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <BookOpen size={20} />
            </div>
            <div>
                <h1 class="text-xl font-bold text-slate-800 leading-none">Study Notes & Flashcards</h1>
                <p class="text-sm text-slate-500 mt-1">Extract key concepts from text and lectures locally</p>
            </div>
        </div>

        <div class="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-2">
            <span class="text-xs font-semibold text-slate-500 uppercase px-2">LLM Engine</span>
            {#if loadedModelId}
                <div class="flex items-center gap-2 px-2 bg-white border border-slate-200 rounded py-1">
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
                    onclick={loadLLMModel}
                    disabled={isModelLoading}
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded shadow-sm transition-colors"
                >
                    {#if isModelLoading}
                        <RefreshCw size={14} class="animate-spin" />
                        {llmLoadProgress.progress}%
                    {:else}
                        <Play size={14} />
                        Load Model
                    {/if}
                </button>
            {/if}
        </div>
    </header>

    <div class="flex-1 flex overflow-hidden">
        <!-- Left Pane: Input Sources -->
        <div class="w-1/2 max-w-xl border-r border-slate-200 flex flex-col bg-white">

            <!-- Tabs -->
            <div class="flex border-b border-slate-200">
                <button
                    class="flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors {activeTab === 'text' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-600 hover:bg-slate-50'}"
                    onclick={() => activeTab = 'text'}
                >
                    <FileText size={16} />
                    Paste Text
                </button>
                <button
                    class="flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors {activeTab === 'audio' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-600 hover:bg-slate-50'}"
                    onclick={() => activeTab = 'audio'}
                >
                    <Mic size={16} />
                    Upload Audio
                </button>
            </div>

            <!-- Content Area -->
            <div class="flex-1 p-6 flex flex-col overflow-y-auto">
                {#if activeTab === 'text'}
                    <div class="flex-1 flex flex-col gap-3">
                        <label for="sourceText" class="text-sm font-semibold text-slate-700">Study Material</label>
                        <textarea
                            id="sourceText"
                            bind:value={sourceText}
                            placeholder="Paste your notes, textbook excerpts, or articles here..."
                            class="flex-1 w-full p-4 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none transition-colors"
                        ></textarea>
                    </div>
                {:else if activeTab === 'audio'}
                    <div class="flex flex-col gap-6 h-full">
                        <div class="flex flex-col gap-2">
                            <span class="text-sm font-semibold text-slate-700">Lecture Audio</span>
                            <div class="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 transition-colors hover:bg-slate-100 relative">
                                <input
                                    type="file"
                                    accept="audio/*,video/*"
                                    onchange={handleAudioUpload}
                                    disabled={isTranscribing || isWhisperLoading}
                                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                />
                                {#if isWhisperLoading}
                                    <RefreshCw size={24} class="animate-spin text-indigo-500 mb-2" />
                                    <p class="text-sm font-medium text-slate-700">Loading Transcription Model...</p>
                                    <p class="text-xs text-slate-500 mt-1">{whisperLoadProgress.progress}% - {whisperLoadProgress.text}</p>
                                {:else if isTranscribing}
                                    <RefreshCw size={24} class="animate-spin text-indigo-500 mb-2" />
                                    <p class="text-sm font-medium text-slate-700">Transcribing Audio...</p>
                                    <p class="text-xs text-slate-500 mt-1">This happens locally and may take a moment</p>
                                {:else}
                                    <Upload size={24} class="text-slate-400 mb-2" />
                                    <p class="text-sm font-medium text-slate-700">Click to upload lecture audio/video</p>
                                    <p class="text-xs text-slate-500 mt-1">Supports MP3, WAV, MP4</p>
                                {/if}
                            </div>
                        </div>

                        {#if isWhisperLoaded && !isTranscribing && !isWhisperLoading}
                            <div class="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-md self-start border border-green-200">
                                <CheckCircle2 size={14} />
                                Transcription Engine Ready
                            </div>
                        {/if}

                        <div class="flex-1 flex flex-col gap-2 mt-4">
                            <label for="transcribedText" class="text-sm font-semibold text-slate-700">Transcribed Text</label>
                            <textarea
                                id="transcribedText"
                                bind:value={transcribedText}
                                placeholder="Transcription will appear here..."
                                class="flex-1 w-full p-4 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-colors"
                            ></textarea>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Action Area -->
            <div class="p-4 border-t border-slate-200 bg-slate-50">
                {#if generationError}
                    <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                        <span class="font-bold">Error:</span> {generationError}
                    </div>
                {/if}

                {#if !loadedModelId}
                    <div class="text-xs text-orange-600 text-center font-medium bg-orange-50 py-2 rounded border border-orange-100 mb-3">
                        Load an AI model first to generate flashcards.
                    </div>
                {/if}

                <button
                    onclick={generateFlashcards}
                    disabled={!loadedModelId || isGenerating || (activeTab === 'text' ? !sourceText.trim() : !transcribedText.trim())}
                    class="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm transition-all"
                >
                    {#if isGenerating}
                        <RefreshCw size={18} class="animate-spin" />
                        Analyzing text and generating flashcards...
                    {:else}
                        <BookOpen size={18} />
                        Generate Flashcards
                    {/if}
                </button>
            </div>
        </div>

        <!-- Right Pane: Flashcard Viewer -->
        <div class="flex-1 bg-slate-100 overflow-y-auto flex items-center justify-center p-6 relative">
            {#if isGenerating}
                <div class="absolute inset-0 bg-slate-100/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                    <div class="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center max-w-sm w-full border border-indigo-100">
                        <RefreshCw size={32} class="animate-spin text-indigo-600 mb-4" />
                        <h3 class="text-lg font-bold text-slate-800">Generating Study Notes</h3>
                        <p class="text-sm text-slate-500 text-center mt-2">
                            The local AI is reading the material and extracting key concepts...
                        </p>
                        <div class="w-full bg-slate-100 h-1.5 rounded-full mt-6 overflow-hidden">
                            <div class="bg-indigo-500 h-full w-full animate-pulse origin-left"></div>
                        </div>
                    </div>
                </div>
            {/if}

            <FlashcardViewer {flashcards} />
        </div>
    </div>
</div>
