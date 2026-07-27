<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import type { ChatMessage, WebLLMWorkerContract } from '$lib/contracts/phase-5/webllm_worker_contract';
    import type { WhisperWorkerContract } from '$lib/contracts/phase-3/whisper_worker_contract';
    import type { FFmpegWorkerContract } from '$lib/contracts/phase-3/ffmpeg_worker_contract';
    import { proxy } from 'comlink';

    // State
    let targetLanguage = $state('Spanish');
    let models = [
        'Phi-3-mini-4k-instruct-q4',
        'Gemma-2b-it-q4f32_1',
        'Llama-3.2-1B-Instruct-q4f16_1'
    ];
    let selectedModel = $state(models[0]);
    let isModelLoaded = $state(false);
    let isModelLoading = $state(false);
    let loadProgress = $state({ progress: 0, text: '' });

    let messages = $state<ChatMessage[]>([]);
    let userInput = $state('');
    let isGenerating = $state(false);
    let currentResponse = $state('');
    let systemPrompt = $derived(`You are a helpful and encouraging language tutor teaching ${targetLanguage}. Speak and respond in ${targetLanguage}, and optionally provide translations or explanations in English if asked. Keep responses concise and conversational.`);

    // Audio & Transcription
    let isRecording = $state(false);
    let isTranscribing = $state(false);
    let whisperLoaded = $state(false);
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];

    // Flashcards
    let savedWords = $state<{id: string, word: string, target_lang: string}[]>([]);
    let newWord = $state('');

    // Workers
    let webllmWorker: WebLLMWorkerContract | null = null;
    let whisperWorker: WhisperWorkerContract | null = null;
    let ffmpegWorker: FFmpegWorkerContract | null = null;
    let duckdbWorker: any = null;

    let chatContainer: HTMLElement;

    onMount(async () => {
        // Init DuckDB for flashcards
        duckdbWorker = await WorkerManager.getDuckDB();
        await duckdbWorker.init();
        await duckdbWorker.query(`CREATE TABLE IF NOT EXISTS polyglot_flashcards (id VARCHAR, word VARCHAR, target_lang VARCHAR)`, 0);
        await loadFlashcards();

        // Check if WebLLM already loaded
        webllmWorker = await WorkerManager.getWebLLM();
        if (webllmWorker) {
            const loadedModel = await webllmWorker.getLoadedModel();
            if (loadedModel) {
                isModelLoaded = true;
                selectedModel = loadedModel;
            }
        }
    });

    async function loadFlashcards() {
        if (!duckdbWorker) return;
        try {
            const result = await duckdbWorker.query(`SELECT id, word, target_lang FROM polyglot_flashcards ORDER BY id DESC`, 0);
            console.log("Loaded flashcards:", result.rows);
            savedWords = result.rows;
        } catch (e) {
            console.error("Failed to load flashcards", e);
        }
    }

    async function saveWord() {
        if (!newWord.trim() || !duckdbWorker) return;
        const id = crypto.randomUUID();
        const safeWord = newWord.trim().replace(/'/g, "''");
        const safeLang = targetLanguage.replace(/'/g, "''");

        await duckdbWorker.query(`INSERT INTO polyglot_flashcards (id, word, target_lang) VALUES ('${id}', '${safeWord}', '${safeLang}')`, 0);
        newWord = '';
        await loadFlashcards();
    }

    async function loadModel() {
        if (!webllmWorker) return;
        isModelLoading = true;
        try {
            await webllmWorker.loadModel(selectedModel, proxy((progress: number, text: string) => {
                loadProgress = { progress: Math.round(progress * 100), text };
            }));
            isModelLoaded = true;
        } catch (error) {
            console.error(error);
            alert('Failed to load LLM model.');
        } finally {
            isModelLoading = false;
        }
    }

    async function initWhisper() {
        whisperWorker = await WorkerManager.getWhisper();
        if (whisperWorker) {
            await whisperWorker.init('tiny', proxy((data: any) => {
                console.log("Whisper load:", data);
            }));
            whisperLoaded = true;
        }
        ffmpegWorker = await WorkerManager.getFFmpeg();
        if (ffmpegWorker) {
            await ffmpegWorker.init();
        }
    }

    async function startRecording() {
        if (!whisperLoaded) {
            await initWhisper();
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(audioChunks, { type: 'audio/webm' });
                await processAudio(blob);
            };

            mediaRecorder.start();
            isRecording = true;
        } catch (e) {
            console.error('Error starting recording:', e);
            alert('Could not access microphone.');
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            isRecording = false;
        }
    }

    async function processAudio(blob: Blob) {
        if (!ffmpegWorker || !whisperWorker) return;
        isTranscribing = true;
        try {
            const arrayBuffer = await blob.arrayBuffer();
            // Convert to WAV format for Whisper
            const wavBuffer = await ffmpegWorker.extractAudio(arrayBuffer, 'wav');
            const result = await whisperWorker.transcribe(wavBuffer);
            userInput += (userInput ? ' ' : '') + result.text;
        } catch (e) {
            console.error("Transcription failed", e);
            alert("Transcription failed.");
        } finally {
            isTranscribing = false;
        }
    }

    async function sendMessage() {
        if (!userInput.trim() || !webllmWorker || !isModelLoaded || isGenerating) return;

        const userText = userInput.trim();
        messages.push({ role: 'user', content: userText });
        userInput = '';
        isGenerating = true;
        currentResponse = '';

        await tick();
        scrollToBottom();

        try {
            await webllmWorker.chat(messages, systemPrompt, proxy((token: string) => {
                currentResponse += token;
                scrollToBottom();
            }));

            messages.push({ role: 'assistant', content: currentResponse });
        } catch (error) {
            console.error(error);
            alert('Error generating response.');
        } finally {
            isGenerating = false;
            currentResponse = '';
            scrollToBottom();
        }
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    }

    function speakText(text: string) {
        if (!('speechSynthesis' in window)) {
            alert("Web Speech API not supported in this browser.");
            return;
        }
        window.speechSynthesis.cancel(); // Stop current speech
        const msg = new SpeechSynthesisUtterance(text);

        // Try to set language code (very basic mapping)
        const langMap: Record<string, string> = {
            'Spanish': 'es-ES',
            'French': 'fr-FR',
            'German': 'de-DE',
            'Italian': 'it-IT',
            'Japanese': 'ja-JP',
            'Chinese': 'zh-CN',
            'Russian': 'ru-RU'
        };
        if (langMap[targetLanguage]) {
            msg.lang = langMap[targetLanguage];
        }

        window.speechSynthesis.speak(msg);
    }

    function scrollToBottom() {
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }
</script>

<div class="h-[calc(100vh-4rem)] flex gap-4 p-4 max-w-7xl mx-auto w-full">

    <!-- Chat Section -->
    <div class="flex-1 flex flex-col bg-white border rounded-lg shadow-sm overflow-hidden">

        <!-- Header -->
        <div class="p-4 border-b bg-slate-50 flex items-center justify-between">
            <h1 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                🌍 Polyglot AI Tutor
            </h1>

            <div class="flex items-center gap-4 text-sm">
                <div class="flex items-center gap-2">
                    <label class="font-medium text-slate-700" for="lang-select">Language:</label>
                    <select id="lang-select" class="border rounded p-1 px-2" bind:value={targetLanguage}>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Italian">Italian</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Chinese">Chinese</option>
                    </select>
                </div>

                {#if !isModelLoaded}
                    <div class="flex items-center gap-2">
                        <select class="border rounded p-1 px-2" bind:value={selectedModel} disabled={isModelLoading}>
                            {#each models as m}
                                <option value={m}>{m}</option>
                            {/each}
                        </select>
                        <button
                            class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition disabled:opacity-50"
                            onclick={loadModel}
                            disabled={isModelLoading}
                        >
                            {isModelLoading ? `Loading ${loadProgress.progress}%` : 'Load Model'}
                        </button>
                    </div>
                {:else}
                    <div class="text-green-600 font-medium flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full bg-green-500"></span>
                        Model Ready
                    </div>
                {/if}
            </div>
        </div>

        <!-- Chat Area -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4" bind:this={chatContainer}>
            {#if messages.length === 0}
                <div class="h-full flex items-center justify-center text-slate-500 text-center">
                    <div>
                        <p class="mb-2">Ready to practice {targetLanguage}?</p>
                        <p class="text-sm">Type a message or use the microphone to start.</p>
                    </div>
                </div>
            {/if}

            {#each messages as msg}
                <div class={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div class={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-slate-100 text-slate-800 rounded-bl-none border'
                    }`}>
                        <div class="whitespace-pre-wrap">{msg.content}</div>
                        {#if msg.role === 'assistant'}
                            <button
                                class="mt-2 text-xs flex items-center gap-1 text-slate-500 hover:text-blue-600 transition"
                                onclick={() => speakText(msg.content)}
                                aria-label="Speak text"
                            >
                                🔊 Speak
                            </button>
                        {/if}
                    </div>
                </div>
            {/each}

            {#if isGenerating}
                <div class="flex justify-start">
                    <div class="max-w-[80%] rounded-lg p-3 bg-slate-100 text-slate-800 rounded-bl-none border">
                        <div class="whitespace-pre-wrap">{currentResponse}</div>
                        <span class="inline-block w-2 h-4 bg-slate-400 ml-1 animate-pulse"></span>
                    </div>
                </div>
            {/if}

            {#if isTranscribing}
                <div class="text-sm text-slate-500 italic text-center">Transcribing audio...</div>
            {/if}
        </div>

        <!-- Input Area -->
        <div class="p-4 border-t bg-slate-50">
            <div class="flex gap-2">
                <button
                    class={`p-3 rounded-lg transition border flex items-center justify-center ${
                        isRecording
                            ? 'bg-red-100 text-red-600 border-red-300 hover:bg-red-200'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                    onclick={isRecording ? stopRecording : startRecording}
                    title={isRecording ? "Stop Recording" : "Start Recording"}
                    aria-label={isRecording ? "Stop Recording" : "Start Recording"}
                >
                    🎤
                </button>
                <textarea
                    class="flex-1 border rounded-lg p-2 resize-none h-[50px]"
                    placeholder="Type a message or record audio..."
                    bind:value={userInput}
                    onkeydown={handleKeyDown}
                    disabled={!isModelLoaded || isGenerating}
                ></textarea>
                <button
                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-medium transition disabled:opacity-50"
                    onclick={sendMessage}
                    disabled={!isModelLoaded || isGenerating || !userInput.trim()}
                >
                    Send
                </button>
            </div>
        </div>
    </div>

    <!-- Sidebar: Flashcards -->
    <div class="w-80 bg-white border rounded-lg shadow-sm flex flex-col">
        <div class="p-4 border-b bg-slate-50">
            <h2 class="font-bold text-slate-800">Vocabulary list</h2>
        </div>

        <div class="p-4 border-b">
            <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-slate-700" for="new-word-input">Save a new word:</label>
                <div class="flex gap-2">
                    <input
                        id="new-word-input"
                        type="text"
                        class="flex-1 border rounded p-1 px-2 text-sm"
                        placeholder="e.g. Bonjour"
                        bind:value={newWord}
                        onkeydown={e => e.key === 'Enter' && saveWord()}
                    />
                    <button
                        class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition"
                        onclick={saveWord}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-2">
            {#if savedWords.length === 0}
                <div class="text-sm text-slate-500 text-center py-4">No words saved yet.</div>
            {/if}

            {#each savedWords as item}
                <div class="border rounded p-2 text-sm flex justify-between items-center bg-slate-50">
                    <div>
                        <div class="font-medium">{item.word}</div>
                        <div class="text-xs text-slate-500">{item.target_lang}</div>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>
