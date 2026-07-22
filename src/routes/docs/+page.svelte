<script lang="ts">
    import { onMount } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import { proxy } from 'comlink';
    import type { OCRResult, TesseractWorkerContract } from '$lib/workers/tesseract.worker';

    let isProcessing = false;
    let progress = 0;
    let statusMessage = '';
    let ocrResult: OCRResult | null = null;
    let imageSrc: string | null = null;
    let isDragging = false;
    let imageWidth: number = 0;
    let imageHeight: number = 0;

    let tesseractWorker: any = null;

    onMount(async () => {
        try {
            tesseractWorker = await WorkerManager.getTesseract();
            // Assign the proxy callback
            tesseractWorker.onProgress = proxy((p: number, status: string) => {
                progress = Math.round(p * 100);
                statusMessage = status;
            });
            await tesseractWorker.init(['eng']);
        } catch (e) {
            console.error("Failed to initialize Tesseract", e);
            statusMessage = "Failed to initialize Tesseract";
        }
    });

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        isDragging = true;
    };

    const handleDragLeave = () => {
        isDragging = false;
    };

    const handleDrop = async (e: DragEvent) => {
        e.preventDefault();
        isDragging = false;

        if (!e.dataTransfer?.files?.length) return;

        const file = e.dataTransfer.files[0];
        const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff', 'image/bmp'];

        if (!validTypes.includes(file.type)) {
            alert('Invalid file type');
            return;
        }

        isProcessing = true;
        progress = 0;
        statusMessage = `Processing ${file.name}...`;
        ocrResult = null;

        try {
            if (file.type.startsWith('image/')) {
                // Set up preview image and wait for it to load to get dimensions for bounding boxes
                if (imageSrc) {
                    URL.revokeObjectURL(imageSrc);
                }
                imageSrc = URL.createObjectURL(file);
                await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        imageWidth = img.width;
                        imageHeight = img.height;
                        resolve(null);
                    };
                    img.src = imageSrc!;
                });

                const arrayBuffer = await file.arrayBuffer();
                // We pass arrayBuffer and mimeType. Comlink handles transfer by default for ArrayBuffer in some setups,
                // but usually requires Comlink.transfer. For simplicity we just pass it directly.
                // The task instruction says: "The image is passed as an ArrayBuffer"
                ocrResult = await tesseractWorker.recognizeImage(arrayBuffer, file.type);
                statusMessage = 'OCR Complete';
                progress = 100;
            } else if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                try {
                    // Task 2 dependency for MuPDF
                    await tesseractWorker.recognizePDF(arrayBuffer);
                } catch(e: any) {
                    alert(e.message || "PDF processing not fully supported until MuPDF is integrated (Task 2)");
                }
            }
        } catch (error) {
            console.error('Error processing document', error);
            statusMessage = 'Error processing document';
        } finally {
            isProcessing = false;
        }
    };

    const copyToClipboard = async () => {
        if (ocrResult?.text) {
            await navigator.clipboard.writeText(ocrResult.text);
            alert('Copied to clipboard');
        }
    };

    // Calculate percentage coordinates for bounding boxes to overlay on an image
    const getBboxStyle = (bbox: { x0: number, y0: number, x1: number, y1: number }, confidence: number) => {
        if (!imageWidth || !imageHeight) return '';
        const left = (bbox.x0 / imageWidth) * 100;
        const top = (bbox.y0 / imageHeight) * 100;
        const width = ((bbox.x1 - bbox.x0) / imageWidth) * 100;
        const height = ((bbox.y1 - bbox.y0) / imageHeight) * 100;

        // Color mapping: 0-100 confidence
        // Green for high confidence, red for low
        const r = Math.max(0, 255 - (confidence * 2.55));
        const g = Math.min(255, (confidence * 2.55));

        return `left: ${left}%; top: ${top}%; width: ${width}%; height: ${height}%; background-color: rgba(${r}, ${g}, 0, 0.3); border: 1px solid rgba(${r}, ${g}, 0, 0.8); position: absolute;`;
    };

</script>

<div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-6">Docs Engine (OCR)</h1>

    <div
        class="border-4 border-dashed rounded-lg p-12 text-center transition-colors {isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}"
        on:dragover={handleDragOver}
        on:dragleave={handleDragLeave}
        on:drop={handleDrop}
        role="button"
        tabindex="0"
    >
        <div class="text-xl text-gray-600 mb-4">
            Drag & Drop Documents Here
        </div>
        <div class="text-sm text-gray-500">
            Supports: .png, .jpg, .tiff, .bmp, .pdf
        </div>
    </div>

    {#if isProcessing || statusMessage}
        <div class="mt-8 p-4 bg-gray-50 rounded shadow">
            <div class="flex justify-between mb-2">
                <span class="font-semibold text-gray-700">{statusMessage}</span>
                <span class="text-blue-600">{progress}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style="width: {progress}%"></div>
            </div>
        </div>
    {/if}

    {#if ocrResult}
        <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Results Column -->
            <div class="flex flex-col h-full">
                {#if ocrResult.confidence < 80}
                    <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                        <p class="font-bold">Low Confidence Warning</p>
                        <p>Overall confidence is {ocrResult.confidence.toFixed(2)}%. Results may contain errors.</p>
                    </div>
                {/if}

                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-semibold">Extracted Text</h2>
                    <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" on:click={copyToClipboard}>
                        Copy Text
                    </button>
                </div>

                <div class="bg-white border rounded p-4 flex-grow overflow-auto">
                    <pre class="whitespace-pre-wrap font-mono text-sm">{ocrResult.text}</pre>
                </div>
                <div class="text-sm text-gray-500 mt-2">
                    Execution time: {Math.round(ocrResult.executionTimeMs)}ms | Overall Confidence: {Math.round(ocrResult.confidence)}%
                </div>
            </div>

            <!-- Preview Column -->
            <div>
                <h2 class="text-2xl font-semibold mb-4">Preview & Confidence</h2>
                <div class="relative inline-block max-w-full">
                    {#if imageSrc}
                        <img src={imageSrc} alt="Document Preview" class="w-full h-auto block" />
                        {#each ocrResult.words as word}
                            <div style={getBboxStyle(word.bbox, word.confidence)} title="{word.text} ({word.confidence}%)"></div>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>
