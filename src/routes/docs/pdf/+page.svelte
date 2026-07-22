<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import type { PDFMetadata } from '$lib/workers/mupdf.worker';

    // Using Svelte 5 runes for reactivity
    let activeTab = $state<'viewer' | 'merge' | 'split' | 'compress'>('viewer');
    let worker: any = $state(null);

    let viewerFile = $state<File | null>(null);
    let viewerMetadata = $state<PDFMetadata | null>(null);
    let viewerPageImages = $state<string[]>([]);
    let isViewerLoading = $state(false);

    let mergeFiles = $state<File[]>([]);
    let isMergeLoading = $state(false);

    let splitFile = $state<File | null>(null);
    let splitStartPage = $state<number>(1);
    let splitEndPage = $state<number>(1);
    let isSplitLoading = $state(false);

    let compressFile = $state<File | null>(null);
    let isCompressLoading = $state(false);
    let compressResultSize = $state<number | null>(null);
    let compressOriginalSize = $state<number | null>(null);

    onMount(async () => {
        worker = await WorkerManager.getMuPDF();
    });

    onDestroy(() => {
        cleanupViewerImages();
    });

    function cleanupViewerImages() {
        for (const url of viewerPageImages) {
            URL.revokeObjectURL(url);
        }
        viewerPageImages = [];
    }

    async function handleViewerUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        viewerFile = input.files[0];
        isViewerLoading = true;
        cleanupViewerImages();

        try {
            const buffer = await viewerFile.arrayBuffer();
            viewerMetadata = await worker.loadPDF(buffer);

            const newImages = [];
            if (viewerMetadata) {
                for (let i = 0; i < viewerMetadata.pageCount; i++) {
                    const pngBuffer = await worker.renderPage(i, 72); // render lower res for viewer
                    const blob = new Blob([pngBuffer], { type: 'image/png' });
                    newImages.push(URL.createObjectURL(blob));
                }
            }
            viewerPageImages = newImages;
        } catch (err) {
            console.error("Error loading PDF:", err);
            alert("Error loading PDF for viewer.");
        } finally {
            isViewerLoading = false;
        }
    }

    function handleMergeDrop(e: DragEvent) {
        e.preventDefault();
        if (e.dataTransfer?.files) {
            mergeFiles = [...mergeFiles, ...Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')];
        }
    }

    async function doMerge() {
        if (mergeFiles.length < 2) {
            alert("Select at least 2 files to merge.");
            return;
        }
        isMergeLoading = true;
        try {
            const buffers = await Promise.all(mergeFiles.map(f => f.arrayBuffer()));
            const outBuffer = await worker.mergePDFs(buffers);
            downloadBuffer(outBuffer, 'merged.pdf');
        } catch (err) {
            console.error(err);
            alert("Error merging PDFs.");
        } finally {
            isMergeLoading = false;
        }
    }

    async function doSplit() {
        if (!splitFile) return;
        isSplitLoading = true;
        try {
            const buffer = await splitFile.arrayBuffer();
            const meta = await worker.loadPDF(buffer);
            // Verify bounds
            let s = splitStartPage - 1; // UI is 1-indexed
            let e = splitEndPage - 1;
            if (s < 0) s = 0;
            if (e >= meta.pageCount) e = meta.pageCount - 1;
            if (s > e) [s, e] = [e, s];

            const outBuffer = await worker.extractPages(s, e);
            downloadBuffer(outBuffer, `split_${s+1}-${e+1}.pdf`);
        } catch (err) {
            console.error(err);
            alert("Error splitting PDF.");
        } finally {
            isSplitLoading = false;
        }
    }

    async function doCompress() {
        if (!compressFile) return;
        isCompressLoading = true;
        compressOriginalSize = compressFile.size;
        try {
            const buffer = await compressFile.arrayBuffer();
            await worker.loadPDF(buffer);
            const outBuffer = await worker.compressPDF();
            compressResultSize = outBuffer.byteLength;
            downloadBuffer(outBuffer, 'compressed.pdf');
        } catch (err) {
            console.error(err);
            alert("Error compressing PDF.");
        } finally {
            isCompressLoading = false;
        }
    }

    function downloadBuffer(buffer: ArrayBuffer, filename: string) {
        const blob = new Blob([buffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
</script>

<div class="p-6 max-w-6xl mx-auto text-white">
    <h1 class="text-3xl font-bold mb-6">PDF Tools</h1>

    <div class="flex space-x-4 mb-6 border-b border-gray-700 pb-2">
        {#each ['viewer', 'merge', 'split', 'compress'] as tab}
            <button
                class="px-4 py-2 capitalize rounded {activeTab === tab ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'}"
                onclick={() => activeTab = tab as any}
            >
                {tab}
            </button>
        {/each}
    </div>

    <div class="bg-gray-900 p-6 rounded-lg border border-gray-800 shadow-xl">
        {#if activeTab === 'viewer'}
            <div class="space-y-4">
                <h2 class="text-xl font-semibold">PDF Viewer</h2>
                <input type="file" accept="application/pdf" onchange={handleViewerUpload} class="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700" />

                {#if isViewerLoading}
                    <p class="text-gray-400">Loading PDF and rendering pages...</p>
                {/if}

                {#if viewerMetadata}
                    <div class="text-sm text-gray-400">
                        Pages: {viewerMetadata.pageCount} | Size: {(viewerMetadata.fileSizeBytes / 1024).toFixed(2)} KB
                    </div>
                {/if}

                <div class="flex mt-4 gap-4">
                    <!-- Thumbnail Strip -->
                    <div class="w-48 overflow-y-auto max-h-[800px] border-r border-gray-700 pr-4 space-y-4">
                        {#each viewerPageImages as src, idx}
                            <div class="text-center">
                                <span class="text-xs text-gray-500 mb-1 block">Page {idx + 1}</span>
                                <img {src} alt="Page {idx + 1}" class="w-full border border-gray-700 rounded shadow-md" />
                            </div>
                        {/each}
                    </div>
                    <!-- Main Viewer -->
                    <div class="flex-1 overflow-y-auto max-h-[800px] bg-gray-950 p-4 rounded flex flex-col items-center space-y-8">
                        {#if viewerPageImages.length === 0 && !isViewerLoading}
                            <p class="text-gray-500 my-auto">Select a PDF to view.</p>
                        {/if}
                        {#each viewerPageImages as src, idx}
                            <img {src} alt="Page {idx + 1} Large" class="max-w-full shadow-2xl" />
                        {/each}
                    </div>
                </div>
            </div>

        {:else if activeTab === 'merge'}
            <div class="space-y-4">
                <h2 class="text-xl font-semibold">Merge PDFs</h2>
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    class="border-2 border-dashed border-gray-600 rounded p-12 text-center hover:border-purple-500 transition-colors"
                    ondragover={(e) => e.preventDefault()}
                    ondrop={handleMergeDrop}
                >
                    <p class="text-gray-400 mb-2">Drag and drop PDF files here to merge</p>
                    <input type="file" multiple accept="application/pdf" onchange={(e) => mergeFiles = [...mergeFiles, ...Array.from(e.currentTarget.files || [])]} class="hidden" id="merge-upload" />
                    <label for="merge-upload" class="cursor-pointer text-purple-400 hover:text-purple-300 underline">Or click to select files</label>
                </div>

                {#if mergeFiles.length > 0}
                    <ul class="space-y-2">
                        {#each mergeFiles as file, i}
                            <li class="flex justify-between items-center bg-gray-800 p-2 rounded">
                                <span>{i + 1}. {file.name}</span>
                                <button onclick={() => mergeFiles = mergeFiles.filter((_, idx) => idx !== i)} class="text-red-400 hover:text-red-300">Remove</button>
                            </li>
                        {/each}
                    </ul>
                    <button
                        onclick={doMerge}
                        disabled={isMergeLoading}
                        class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded disabled:opacity-50"
                    >
                        {isMergeLoading ? 'Merging...' : 'Merge & Download'}
                    </button>
                {/if}
            </div>

        {:else if activeTab === 'split'}
            <div class="space-y-4">
                <h2 class="text-xl font-semibold">Split / Extract Pages</h2>
                <input type="file" accept="application/pdf" onchange={(e) => splitFile = (e.target as HTMLInputElement).files?.[0] || null} class="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700" />

                {#if splitFile}
                    <div class="flex items-center space-x-4">
                        <label class="flex flex-col">
                            <span class="text-sm text-gray-400">Start Page</span>
                            <input type="number" bind:value={splitStartPage} min="1" class="bg-gray-800 border border-gray-700 rounded px-3 py-1 w-24 text-white" />
                        </label>
                        <span class="text-gray-500 pt-5">to</span>
                        <label class="flex flex-col">
                            <span class="text-sm text-gray-400">End Page</span>
                            <input type="number" bind:value={splitEndPage} min="1" class="bg-gray-800 border border-gray-700 rounded px-3 py-1 w-24 text-white" />
                        </label>
                    </div>
                    <button
                        onclick={doSplit}
                        disabled={isSplitLoading}
                        class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded disabled:opacity-50"
                    >
                        {isSplitLoading ? 'Extracting...' : 'Extract Pages'}
                    </button>
                {/if}
            </div>

        {:else if activeTab === 'compress'}
            <div class="space-y-4">
                <h2 class="text-xl font-semibold">Compress PDF</h2>
                <input type="file" accept="application/pdf" onchange={(e) => compressFile = (e.target as HTMLInputElement).files?.[0] || null} class="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700" />

                {#if compressFile}
                    <button
                        onclick={doCompress}
                        disabled={isCompressLoading}
                        class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded disabled:opacity-50"
                    >
                        {isCompressLoading ? 'Compressing...' : 'Compress & Download'}
                    </button>

                    {#if compressOriginalSize && compressResultSize}
                        <div class="mt-4 p-4 bg-gray-800 rounded">
                            <p>Original: {(compressOriginalSize / 1024).toFixed(2)} KB</p>
                            <p>Compressed: {(compressResultSize / 1024).toFixed(2)} KB</p>
                            <p class="text-green-400">Saved: {((1 - compressResultSize / compressOriginalSize) * 100).toFixed(1)}%</p>
                        </div>
                    {/if}
                {/if}
            </div>
        {/if}
    </div>
</div>
