<script lang="ts">
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import diff_match_patch from 'diff-match-patch';
    import { AlertTriangle, FileText, Upload } from 'lucide-svelte';

    let originalFileHandle = $state<FileSystemFileHandle | null>(null);
    let modifiedFileHandle = $state<FileSystemFileHandle | null>(null);

    let originalText = $state<string>('');
    let modifiedText = $state<string>('');

    let isProcessing = $state(false);
    let errorMessage = $state<string | null>(null);

    let diffs = $state<diff_match_patch.Diff[]>([]);

    async function handleSelectFile(type: 'original' | 'modified') {
        try {
            if (typeof (window as any).showOpenFilePicker !== 'function') {
                throw new Error("File System Access API is not supported in this browser.");
            }

            const [fileHandle] = await (window as any).showOpenFilePicker({
                types: [
                    {
                        description: 'PDF Documents',
                        accept: {
                            'application/pdf': ['.pdf']
                        }
                    }
                ],
                multiple: false
            });

            if (type === 'original') {
                originalFileHandle = fileHandle;
            } else {
                modifiedFileHandle = fileHandle;
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                errorMessage = err.message || 'Failed to select file.';
            }
        }
    }

    async function extractTextFromFile(fileHandle: FileSystemFileHandle): Promise<string> {
        const file = await fileHandle.getFile();
        const arrayBuffer = await file.arrayBuffer();

        const mupdf = await WorkerManager.getMuPDF();
        await mupdf.loadPDF(arrayBuffer);
        const text = await mupdf.extractText();

        return text;
    }

    async function runComparison() {
        if (!originalFileHandle || !modifiedFileHandle) return;

        isProcessing = true;
        errorMessage = null;
        diffs = [];

        try {
            originalText = await extractTextFromFile(originalFileHandle);
            modifiedText = await extractTextFromFile(modifiedFileHandle);

            const dmp = new diff_match_patch();
            const rawDiffs = dmp.diff_main(originalText, modifiedText);
            dmp.diff_cleanupSemantic(rawDiffs);

            diffs = rawDiffs;
        } catch (err: any) {
            errorMessage = err.message || 'Error occurred during comparison.';
        } finally {
            isProcessing = false;
        }
    }
</script>

<div class="h-full flex flex-col p-6 space-y-6">
    <div class="flex flex-col space-y-2">
        <h2 class="text-2xl font-bold">Document Comparison (Redline Diffing)</h2>
        <p class="text-muted-foreground text-sm">Select two PDF documents to compare. Additions will be highlighted in green, deletions in red.</p>
    </div>

    {#if errorMessage}
        <div class="p-4 bg-red-100 text-red-800 rounded-md flex items-center gap-2">
            <AlertTriangle class="w-5 h-5" />
            <span>{errorMessage}</span>
        </div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Original Document -->
        <div class="border rounded-lg p-6 flex flex-col items-center justify-center space-y-4 bg-muted/50">
            <h3 class="text-lg font-semibold">Original Document</h3>
            {#if originalFileHandle}
                <div class="flex items-center gap-2 text-primary">
                    <FileText class="w-6 h-6" />
                    <span>{originalFileHandle.name}</span>
                </div>
                <button class="text-sm underline" onclick={() => originalFileHandle = null}>Clear</button>
            {:else}
                <button
                    class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    onclick={() => handleSelectFile('original')}
                >
                    <Upload class="w-4 h-4" />
                    <span>Select Original PDF</span>
                </button>
            {/if}
        </div>

        <!-- Modified Document -->
        <div class="border rounded-lg p-6 flex flex-col items-center justify-center space-y-4 bg-muted/50">
            <h3 class="text-lg font-semibold">Modified Document</h3>
            {#if modifiedFileHandle}
                <div class="flex items-center gap-2 text-primary">
                    <FileText class="w-6 h-6" />
                    <span>{modifiedFileHandle.name}</span>
                </div>
                <button class="text-sm underline" onclick={() => modifiedFileHandle = null}>Clear</button>
            {:else}
                <button
                    class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    onclick={() => handleSelectFile('modified')}
                >
                    <Upload class="w-4 h-4" />
                    <span>Select Modified PDF</span>
                </button>
            {/if}
        </div>
    </div>

    <div class="flex justify-center">
        <button
            class="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onclick={runComparison}
            disabled={!originalFileHandle || !modifiedFileHandle || isProcessing}
        >
            {isProcessing ? 'Processing...' : 'Compare Documents'}
        </button>
    </div>

    {#if diffs.length > 0}
        <div class="flex-grow border rounded-lg overflow-hidden flex flex-col mt-6">
            <div class="bg-muted p-2 border-b flex justify-between items-center text-sm font-semibold">
                <span>Comparison Result</span>
            </div>
            <div class="p-6 bg-white overflow-auto max-h-[600px] whitespace-pre-wrap font-mono text-sm leading-relaxed doc-diff-result">
                {#each diffs as [op, text], i}
                    {#if op === 1}
                        <ins class="bg-green-200 text-green-900 no-underline px-1 rounded">{text}</ins>
                    {:else if op === -1}
                        <del class="bg-red-200 text-red-900 line-through px-1 rounded">{text}</del>
                    {:else}
                        <span class="text-gray-800">{text}</span>
                    {/if}
                {/each}
            </div>
        </div>
    {/if}
</div>
