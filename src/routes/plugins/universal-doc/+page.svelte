<script lang="ts">
    import { onMount } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import { proxy } from 'comlink';
    import FileUploader from '$lib/components/plugins/universal-doc/ui/FileUploader.svelte';
    import DocumentViewer from '$lib/components/plugins/universal-doc/ui/DocumentViewer.svelte';
    import ChatInterface from '$lib/components/plugins/universal-doc/ui/ChatInterface.svelte';

    let fileType = $state<'pdf' | 'text' | 'markdown' | 'csv' | null>(null);
    let rawText = $state('');
    let pdfBuffer = $state<ArrayBuffer | null>(null);

    let chatMessages = $state<{ role: 'user' | 'assistant', content: string }[]>([]);
    let isParsing = $state(false);
    let isGenerating = $state(false);
    let modelLoaded = $state(false);

    let muPdfWorker = $state.raw<any>(null);
    let webLlmWorker = $state.raw<any>(null);

    onMount(async () => {
        try {
            muPdfWorker = await WorkerManager.getMuPDF();
        } catch (e) {
            console.error("Failed to initialize MuPDF worker", e);
        }

        try {
            webLlmWorker = await WorkerManager.getWebLLM();
            await webLlmWorker.loadModel('Llama-3-8B-Instruct-q4f32_1-MLC');
            modelLoaded = true;
        } catch (e) {
            console.error("Failed to initialize WebLLM worker", e);
        }
    });

    async function handleFileSelected(file: File) {
        isParsing = true;
        fileType = null;
        rawText = '';
        pdfBuffer = null;
        chatMessages = [];

        try {
            const ext = file.name.toLowerCase();
            if (ext.endsWith('.pdf')) {
                fileType = 'pdf';
                pdfBuffer = await file.arrayBuffer();
                if (muPdfWorker) {
                    const cleanBuffer = pdfBuffer.slice(0);
                    await muPdfWorker.loadPDF(cleanBuffer);
                    rawText = await muPdfWorker.extractText();
                }
            } else {
                if (ext.endsWith('.md')) fileType = 'markdown';
                else if (ext.endsWith('.csv')) fileType = 'csv';
                else fileType = 'text';

                rawText = await file.text();
            }
        } catch (e) {
            console.error("File parsing error", e);
        } finally {
            isParsing = false;
        }
    }

    async function handleSendMessage(message: string) {
        if (!webLlmWorker || !modelLoaded) return;

        chatMessages = [...chatMessages, { role: 'user', content: message }];
        isGenerating = true;

        const systemPrompt = `You are a helpful assistant analyzing the following document. Answer the user's questions based strictly on the provided text. \n\n <Document_Text> ${rawText} </Document_Text>`;

        let assistantMessage = '';
        chatMessages = [...chatMessages, { role: 'assistant', content: assistantMessage }];
        const messageIndex = chatMessages.length - 1;

        try {
            await webLlmWorker.chat(chatMessages.slice(0, -1), systemPrompt, proxy((token: string) => {
                assistantMessage += token;
                chatMessages[messageIndex] = { role: 'assistant', content: assistantMessage };
            }));
        } catch (e) {
            console.error("Chat generation error", e);
            chatMessages[messageIndex] = { role: 'assistant', content: "Sorry, I encountered an error generating a response." };
        } finally {
            isGenerating = false;
        }
    }

</script>

<div class="h-full w-full bg-zinc-100 dark:bg-zinc-950 p-4 font-sans text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row gap-4 overflow-hidden">
    <!-- Left Pane: Document Ingestion / Viewer -->
    <div class="flex-1 min-w-0 flex flex-col h-full rounded-2xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-xl">
        {#if !fileType && !isParsing}
            <div class="flex-1 p-6">
                <FileUploader onFileSelected={handleFileSelected} />
            </div>
        {:else if isParsing}
             <div class="flex-1 flex flex-col items-center justify-center space-y-4 text-zinc-500">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p>Parsing document...</p>
            </div>
        {:else}
            <DocumentViewer
                {fileType}
                {rawText}
                {pdfBuffer}
            />
        {/if}
    </div>

    <!-- Right Pane: AI Chat Interface -->
    <div class="flex-1 min-w-0 md:max-w-md lg:max-w-lg xl:max-w-xl flex flex-col h-full rounded-2xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-xl relative">
        {#if !fileType}
            <div class="absolute inset-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <p class="text-zinc-500 text-sm font-medium">Upload a document to start chatting</p>
            </div>
        {/if}

        <ChatInterface
            messages={chatMessages}
            {isGenerating}
            onSendMessage={handleSendMessage}
        />
    </div>
</div>
