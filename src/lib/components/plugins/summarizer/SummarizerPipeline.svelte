<script lang="ts">
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import { decodeAudio, chunkAudio } from './AudioChunker';
    import { renderMarkdown } from '$lib/utils/markdown-renderer';
    import { Download, Copy, RefreshCw, AlertCircle } from 'lucide-svelte';
    import Card from './ui/Card.svelte';
    import Progress from './ui/Progress.svelte';
    import Button from './ui/Button.svelte';

    // Props using Svelte 5 runes
    interface Props {
        mediaFile: File;
        onReset?: () => void;
    }
    let { mediaFile, onReset }: Props = $props();

    type PipelineState = 'idle' | 'decoding' | 'transcribing' | 'summarizing' | 'done' | 'error';

    let pipelineState: PipelineState = $state('idle');
    let progressPercent: number = $state(0);
    let statusText: string = $state('');
    let renderedSummary: string = $state('');
    let rawSummary: string = $state('');
    let errorMessage: string = $state('');

    let fullTranscript: string = '';

    // Model options (Hardcoded to default loaded model for now)
    const LLM_MODEL = 'Llama-3.2-1B-Instruct-q4f16_1';
    const SYSTEM_PROMPT = "You are a professional assistant. Summarize the following transcript. Provide 'Key Takeaways' and 'Action Items' in markdown format.";

    // Action function to start pipeline
    $effect(() => {
        if (mediaFile && pipelineState === 'idle') {
            startPipeline();
        }
    });

    async function startPipeline() {
        try {
            pipelineState = 'decoding';
            progressPercent = 5;
            statusText = 'Decoding audio file...';

            // 1. Decode and chunk
            const audioBuffer = await decodeAudio(mediaFile);
            progressPercent = 10;
            statusText = 'Chunking audio...';

            // Chunk into 5-minute segments
            const chunks = chunkAudio(audioBuffer, 300);

            // 2. Transcribe
            pipelineState = 'transcribing';
            progressPercent = 15;

            const whisperWorker = await WorkerManager.getWhisper();

            await whisperWorker.init('tiny', (data: any) => {});

            fullTranscript = '';
            for (let i = 0; i < chunks.length; i++) {
                statusText = `Transcribing chunk ${i + 1} of ${chunks.length}...`;
                const result = await whisperWorker.transcribe(chunks[i]);
                fullTranscript += result.text + ' ';
                progressPercent = 15 + Math.floor(((i + 1) / chunks.length) * 45); // Takes 15 to 60
            }

            // 3. Summarize
            pipelineState = 'summarizing';
            progressPercent = 65;
            statusText = 'Loading LLM model...';

            const webllmWorker = await WorkerManager.getWebLLM();

            await webllmWorker.loadModel(LLM_MODEL, (progress: number, text: string) => {
                progressPercent = 65 + Math.floor(progress * 15); // Takes 65 to 80
                statusText = `Loading model: ${text}`;
            });

            statusText = 'Generating summary...';
            progressPercent = 85;

            // Map-reduce if transcript is huge
            const chunkSize = 4000;
            let finalSummary = '';

            if (fullTranscript.length > chunkSize) {
                // Map-reduce
                const textChunks = [];
                for (let i = 0; i < fullTranscript.length; i += chunkSize) {
                    textChunks.push(fullTranscript.substring(i, i + chunkSize));
                }

                let chunkSummaries = '';
                for (let i = 0; i < textChunks.length; i++) {
                    statusText = `Summarizing part ${i + 1} of ${textChunks.length}...`;
                    const prompt = `Summarize this part of the transcript:\n\n${textChunks[i]}`;
                    const reply = await webllmWorker.complete(prompt, 1000); // 1000 tokens per chunk
                    chunkSummaries += reply + '\n\n';
                    progressPercent = 85 + Math.floor(((i + 1) / textChunks.length) * 10);
                }

                statusText = 'Combining summaries...';
                const reducePrompt = `${SYSTEM_PROMPT}\n\nHere are partial summaries of the transcript:\n\n${chunkSummaries}\n\nPlease combine them into a final summary with 'Key Takeaways' and 'Action Items'.`;
                finalSummary = await webllmWorker.complete(reducePrompt, 2048);

            } else {
                const prompt = `${SYSTEM_PROMPT}\n\nTranscript:\n\n${fullTranscript}`;
                finalSummary = await webllmWorker.complete(prompt, 2048);
            }

            rawSummary = finalSummary;
            renderedSummary = await renderMarkdown(finalSummary);

            progressPercent = 100;
            pipelineState = 'done';
            statusText = 'Complete!';

            try {
                await webllmWorker.unloadModel();
            } catch (e) {
                console.error("Could not unload WebLLM", e);
            }

        } catch (error: any) {
            console.error('Pipeline error:', error);
            pipelineState = 'error';
            errorMessage = error.message || 'An error occurred during processing.';
        }
    }

    function copyToClipboard() {
        navigator.clipboard.writeText(rawSummary).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }

    function exportMarkdown() {
        const blob = new Blob([rawSummary], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${mediaFile.name.split('.')[0]}_summary.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
</script>

<Card class="flex h-full w-full flex-col p-6">
    {#if pipelineState !== 'done' && pipelineState !== 'error'}
        <div class="flex flex-col items-center justify-center flex-1 space-y-6">
            <RefreshCw class="h-12 w-12 animate-spin text-blue-500" />
            <div class="text-center w-full max-w-md">
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Processing Media</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{statusText}</p>
                <Progress value={progressPercent} />
            </div>
        </div>
    {/if}

    {#if pipelineState === 'error'}
        <div class="flex flex-col items-center justify-center flex-1 space-y-4">
            <AlertCircle class="h-12 w-12 text-red-500" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Processing Failed</h3>
            <p class="text-sm text-red-500">{errorMessage}</p>
            {#if onReset}
                <Button variant="secondary" onclick={onReset} class="mt-4">Try Again</Button>
            {/if}
        </div>
    {/if}

    {#if pipelineState === 'done'}
        <div class="flex flex-col h-full">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Meeting Summary</h2>
                <div class="flex space-x-2">
                    <Button variant="secondary" size="sm" onclick={copyToClipboard} title="Copy to Clipboard">
                        <Copy class="h-4 w-4 mr-2" />
                        Copy
                    </Button>
                    <Button variant="primary" size="sm" onclick={exportMarkdown} title="Export as Markdown">
                        <Download class="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    {#if onReset}
                        <Button variant="ghost" size="sm" onclick={onReset} title="Process another file">
                            <RefreshCw class="h-4 w-4 mr-2" />
                            New
                        </Button>
                    {/if}
                </div>
            </div>

            <div class="prose dark:prose-invert max-w-none flex-1 overflow-y-auto pr-4 custom-scrollbar bg-gray-50 dark:bg-gray-950 p-6 rounded-lg border border-gray-100 dark:border-gray-800">
                {@html renderedSummary}
            </div>
        </div>
    {/if}
</Card>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #cbd5e1;
        border-radius: 20px;
    }
    :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #475569;
    }
</style>
