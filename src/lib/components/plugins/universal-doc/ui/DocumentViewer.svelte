<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-svelte';
    import Button from './Button.svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';

    interface Props {
        fileType: 'pdf' | 'text' | 'markdown' | 'csv' | null;
        rawText?: string;
        pdfBuffer?: ArrayBuffer | null;
    }

    let { fileType, rawText = '', pdfBuffer = null }: Props = $props();

    let canvasRef = $state<HTMLCanvasElement | null>(null);
    let muPdfWorker = $state.raw<any>(null);
    let currentPage = $state(0);
    let totalPages = $state(0);
    let isRendering = $state(false);
    let zoomLevel = $state(1);

    onMount(async () => {
        try {
            muPdfWorker = await WorkerManager.getMuPDF();
        } catch (error) {
            console.error("Failed to load MuPDF worker:", error);
        }
    });

    $effect(() => {
        if (fileType === 'pdf' && pdfBuffer && muPdfWorker) {
            loadPdf();
        }
    });

    $effect(() => {
        if (fileType === 'pdf' && totalPages > 0 && muPdfWorker) {
            renderCurrentPage();
        }
    });

    async function loadPdf() {
        if (!pdfBuffer || !muPdfWorker) return;
        try {
            const cleanBuffer = pdfBuffer.slice(0);
            const metadata = await muPdfWorker.loadPDF(cleanBuffer);
            totalPages = metadata.pageCount;
            currentPage = 0;
            zoomLevel = 1;
        } catch (e) {
            console.error("Error loading PDF metadata:", e);
        }
    }

    async function renderCurrentPage() {
        if (!muPdfWorker || !canvasRef || fileType !== 'pdf') return;

        isRendering = true;
        try {
            // Default 72 DPI, scaled by zoom level.
            // We can increase base DPI for better clarity if needed.
            const dpi = 150 * zoomLevel;
            const pngBuffer = await muPdfWorker.renderPage(currentPage, dpi);

            const blob = new Blob([pngBuffer], { type: 'image/png' });
            const url = URL.createObjectURL(blob);

            const img = new Image();
            img.onload = () => {
                if (canvasRef) {
                    canvasRef.width = img.width;
                    canvasRef.height = img.height;
                    const ctx = canvasRef.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0);
                    }
                }
                URL.revokeObjectURL(url);
                isRendering = false;
            };
            img.src = url;

        } catch (error) {
            console.error("Error rendering PDF page:", error);
            isRendering = false;
        }
    }

    function nextPage() {
        if (currentPage < totalPages - 1) {
            currentPage++;
        }
    }

    function prevPage() {
        if (currentPage > 0) {
            currentPage--;
        }
    }

    function zoomIn() {
        zoomLevel += 0.25;
    }

    function zoomOut() {
        if (zoomLevel > 0.5) {
            zoomLevel -= 0.25;
        }
    }
</script>

<div class="flex flex-col h-full w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
    {#if fileType === 'pdf'}
        <div class="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
            <div class="flex items-center space-x-2">
                <Button variant="ghost" onclick={prevPage} disabled={currentPage === 0 || isRendering}>
                    <ChevronLeft class="w-4 h-4" />
                </Button>
                <span class="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Page {currentPage + 1} of {totalPages || 1}
                </span>
                <Button variant="ghost" onclick={nextPage} disabled={currentPage === totalPages - 1 || totalPages === 0 || isRendering}>
                    <ChevronRight class="w-4 h-4" />
                </Button>
            </div>

            <div class="flex items-center space-x-2">
                <Button variant="ghost" onclick={zoomOut} disabled={isRendering || zoomLevel <= 0.5}>
                    <ZoomOut class="w-4 h-4" />
                </Button>
                <span class="text-xs text-zinc-500 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                <Button variant="ghost" onclick={zoomIn} disabled={isRendering}>
                    <ZoomIn class="w-4 h-4" />
                </Button>
            </div>
        </div>

        <div class="flex-1 overflow-auto bg-zinc-100/50 dark:bg-zinc-900/50 flex justify-center p-4 relative">
            {#if isRendering}
                <div class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 z-10">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div>
                </div>
            {/if}
            <canvas
                bind:this={canvasRef}
                class="max-w-full shadow-md bg-white transition-opacity {isRendering ? 'opacity-50' : 'opacity-100'}"
            ></canvas>
        </div>
    {:else if fileType === 'text' || fileType === 'markdown' || fileType === 'csv'}
        <div class="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
            <span class="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Text View
            </span>
        </div>
        <div class="flex-1 overflow-auto p-4 text-sm font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
            {rawText}
        </div>
    {:else}
        <div class="flex-1 flex items-center justify-center text-zinc-500">
            No document loaded
        </div>
    {/if}
</div>
