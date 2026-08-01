<script lang="ts">
    import { onMount } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import { proxy } from 'comlink';
    import type { OCRResult } from '$lib/workers/tesseract.worker';
    import type { NERWorkerContract, PIIEntity } from '$lib/workers/ner.worker';
    import type { MuPDFWorkerContract } from '$lib/workers/mupdf.worker';
    import type { EmbeddingsWorkerContract } from '$lib/contracts/embeddings_worker_contract';
    import type { WaSQLiteWorkerContract } from '$lib/contracts/wa_sqlite_contract';

    let activeTab = $state('viewer');

    let isProcessing = $state(false);
    let isNerProcessing = $state(false);
    let piiEntities: (PIIEntity & { selected: boolean })[] = $state([]);
    let progress = $state(0);
    let statusMessage = $state('');
    let ocrResult: OCRResult | null = $state(null);
    let imageSrc: string | null = $state(null);
    let originalPdfBuffer: ArrayBuffer | null = $state(null);
    let originalPdfFileName: string = $state('');

    // Image enhancement state
    let originalImageBuffer: ArrayBuffer | null = null;
    let enhancedImageBuffer: ArrayBuffer | null = null;
    let originalImageSrc: string | null = $state(null);
    let enhancedImageSrc: string | null = $state(null);
    let useEnhanced: boolean = $state(true);
    let imageMimeType: string = '';
    let isDragging = $state(false);
    let imageWidth: number = 0;
    let imageHeight: number = 0;
    let isRedacting = $state(false);

    let searchQuery = $state('');
    let isSearching = $state(false);
    let searchResults: { file_name: string; chunk_text: string; score: number }[] = $state([]);

    let tesseractWorker: any = null;
    let opencvWorker: any = null;
    let nerWorker: NERWorkerContract | null = null;
    let mupdfWorker: MuPDFWorkerContract | null = null;
    let embeddingsWorker: EmbeddingsWorkerContract | null = null;
    let sqliteWorker: WaSQLiteWorkerContract | null = null;

    let isIndexing = $state(false);
    let defaultWorkspaceId = 'default-workspace'; // Default workspace for MVP

    onMount(async () => {
        try {
            tesseractWorker = await WorkerManager.getTesseract();
            opencvWorker = await WorkerManager.getOpenCV();
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

        try {
            nerWorker = await WorkerManager.getNER();
            await nerWorker?.init();
        } catch (e) {
            console.error("Failed to initialize NER", e);
        }

        try {
            mupdfWorker = await WorkerManager.getMuPDF();
        } catch (e) {
            console.error("Failed to initialize MuPDF", e);
        }

        try {
            embeddingsWorker = await WorkerManager.getEmbeddings();
            await embeddingsWorker?.init();
        } catch (e) {
            console.error("Failed to initialize Embeddings worker", e);
        }

        try {
            sqliteWorker = await WorkerManager.getSQLite();
            // Ensure workspace exists
            try {
                await sqliteWorker?.createWorkspace(defaultWorkspaceId);
            } catch (e) {
                // Ignore if it already exists or handle accordingly
            }
        } catch (e) {
            console.error("Failed to initialize SQLite", e);
        }
    });

    const handleToggleEnhanced = async () => {
        useEnhanced = !useEnhanced;

        // Re-run OCR with the selected buffer
        if (!originalImageBuffer || !enhancedImageBuffer) return;

        const bufferToUse = useEnhanced ? enhancedImageBuffer : originalImageBuffer;
        const srcToUse = useEnhanced ? enhancedImageSrc : originalImageSrc;

        isProcessing = true;
        progress = 0;
        statusMessage = `Running OCR on ${useEnhanced ? 'enhanced' : 'original'} image...`;
        ocrResult = null;
        piiEntities = [];

        // Update main preview source without revoking since originalImageSrc and enhancedImageSrc are long-lived
        imageSrc = srcToUse ? srcToUse : null;

        try {
            await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    imageWidth = img.width;
                    imageHeight = img.height;
                    resolve(null);
                };
                img.src = imageSrc!;
            });

            ocrResult = await tesseractWorker.recognizeImage(bufferToUse, imageMimeType);
            statusMessage = 'OCR Complete';
            progress = 100;
        } catch (error) {
            console.error('OCR Error', error);
            statusMessage = 'OCR Failed';
        } finally {
            isProcessing = false;
        }
    };

    const chunkText = (text: string, maxTokens: number = 256, overlapTokens: number = 32): string[] => {
        // Approximate tokenization: 1 token ~ 4 chars
        const maxChars = maxTokens * 4;
        const overlapChars = overlapTokens * 4;
        const chunks: string[] = [];

        if (!text) return chunks;

        let startIndex = 0;
        while (startIndex < text.length) {
            let endIndex = startIndex + maxChars;
            if (endIndex < text.length) {
                // Try to find a nice break point (space or newline)
                let breakPoint = text.lastIndexOf('\n', endIndex);
                if (breakPoint <= startIndex) {
                    breakPoint = text.lastIndexOf(' ', endIndex);
                }
                if (breakPoint > startIndex) {
                    endIndex = breakPoint;
                }
            } else {
                endIndex = text.length;
            }

            chunks.push(text.substring(startIndex, endIndex).trim());
            startIndex = endIndex - overlapChars;
            if (startIndex < 0) startIndex = 0;
            // Prevent infinite loop if overlap is too big
            if (endIndex <= startIndex) startIndex = endIndex;
        }

        return chunks.filter(c => c.length > 0);
    };

    const indexDocument = async (fileName: string, text: string) => {
        if (!embeddingsWorker || !sqliteWorker || !text) return;

        isIndexing = true;
        const currentStatus = statusMessage;
        statusMessage = `Indexing ${fileName} for Semantic Search...`;

        try {
            const chunks = chunkText(text);
            if (chunks.length > 0) {
                // We could batch them, but our worker's embedBatch already handles batching internally if we pass the whole array
                // The prompt says: "For each chunk, call EmbeddingsWorkerContract.embed()."
                // OR "process in batches of 32 to avoid OOM errors". We'll use embedBatch.
                const vectors = await embeddingsWorker.embedBatch(chunks);

                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    const vector = vectors[i];

                    // Convert number[] to Float32Array then to ArrayBuffer for wa-sqlite
                    const floatArray = new Float32Array(vector);

                    await sqliteWorker.insertDocumentChunk({
                        workspace_id: defaultWorkspaceId,
                        file_name: fileName,
                        chunk_index: i,
                        chunk_text: chunk,
                        embedding: floatArray.buffer
                    });
                }
            }
        } catch (error) {
            console.error("Error indexing document:", error);
            alert("Failed to index document for semantic search.");
        } finally {
            isIndexing = false;
            statusMessage = currentStatus;
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim() || !embeddingsWorker || !sqliteWorker) return;

        isSearching = true;
        searchResults = [];

        try {
            // Embed query
            const queryVector = await embeddingsWorker.embed(searchQuery);

            // Load all chunks
            const chunks = await sqliteWorker.getAllDocumentChunks(defaultWorkspaceId);

            if (chunks.length === 0) {
                alert("No documents indexed for search.");
                return;
            }

            // Gather raw blobs to pass to worker
            const chunkBlobs: Uint8Array[] = chunks.map(chunk => new Uint8Array(chunk.embedding));

            // Compute similarity locally in the worker off the main thread
            const scores = await embeddingsWorker.computeSimilarity(queryVector, chunkBlobs);

            // Zip and sort
            const scoredChunks = chunks.map((chunk, i) => ({
                file_name: chunk.file_name,
                chunk_text: chunk.chunk_text,
                score: scores[i]
            }));

            scoredChunks.sort((a, b) => b.score - a.score);

            // Return top 10
            searchResults = scoredChunks.slice(0, 10);

        } catch (error) {
            console.error("Search error:", error);
            alert("Search failed.");
        } finally {
            isSearching = false;
        }
    };

    const handleSearchKeypress = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

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
        piiEntities = [];
        originalPdfBuffer = null;
        originalPdfFileName = file.name;

        try {
            if (file.type.startsWith('image/')) {
                const arrayBuffer = await file.arrayBuffer();
                originalImageBuffer = arrayBuffer.slice(0);
                imageMimeType = file.type;

                // Cleanup old preview URLs
                if (originalImageSrc) URL.revokeObjectURL(originalImageSrc);
                if (enhancedImageSrc) URL.revokeObjectURL(enhancedImageSrc);
                if (imageSrc) URL.revokeObjectURL(imageSrc);

                originalImageSrc = URL.createObjectURL(new Blob([originalImageBuffer], { type: imageMimeType }));

                // Phase 1: Enhancement
                statusMessage = 'Enhancing image... 1/2';
                progress = 25;

                // Run enhancement worker
                enhancedImageBuffer = await opencvWorker.enhance_and_deskew(originalImageBuffer);
                enhancedImageSrc = URL.createObjectURL(new Blob([enhancedImageBuffer!], { type: 'image/png' }));

                // Set main image source based on toggle (default to enhanced)
                useEnhanced = true;
                imageSrc = enhancedImageSrc;

                await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        imageWidth = img.width;
                        imageHeight = img.height;
                        resolve(null);
                    };
                    img.src = imageSrc!;
                });

                // Phase 2: OCR
                statusMessage = 'Running OCR... 2/2';
                progress = 75;

                // We pass arrayBuffer and mimeType. Comlink handles transfer by default for ArrayBuffer in some setups,
                // but usually requires Comlink.transfer. For simplicity we just pass it directly.
                // The task instruction says: "The image is passed as an ArrayBuffer"
                ocrResult = await tesseractWorker.recognizeImage(useEnhanced ? enhancedImageBuffer : originalImageBuffer, useEnhanced ? 'image/png' : imageMimeType);

                statusMessage = 'OCR Complete';
                progress = 100;
            } else if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                originalPdfBuffer = arrayBuffer.slice(0); // Keep a copy for redaction

                try {
                    // Temporarily using recognizePDF for full text but we need page dimensions for accurate redaction.
                    // If we rely on recognizePDF, it returns OCRResult[], we'd need to adapt the UI to handle pages.
                    // For now, let's render the first page via MuPDF to get an image for the existing UI,
                    // and run OCR on that image, so the bounding boxes align perfectly.

                    if (mupdfWorker) {
                        const meta = await mupdfWorker.loadPDF(arrayBuffer);
                        const pageImageBuffer = await mupdfWorker.renderPage(0, 150);

                        // Set up imageSrc from rendered page
                        const blob = new Blob([pageImageBuffer], { type: 'image/png' });
                        if (imageSrc) URL.revokeObjectURL(imageSrc);
                        imageSrc = URL.createObjectURL(blob);

                        await new Promise((resolve) => {
                            const img = new Image();
                            img.onload = () => {
                                imageWidth = img.width;
                                imageHeight = img.height;
                                resolve(null);
                            };
                            img.src = imageSrc!;
                        });

                        // Pass to tesseract as image to get exact bounding boxes for the rendered page
                        ocrResult = await tesseractWorker.recognizeImage(pageImageBuffer, 'image/png');
                        statusMessage = 'PDF Page 1 OCR Complete';
                        progress = 100;
                    } else {
                        try {
                            // Fallback to Tesseract PDF handling if MuPDF fails
                            const results = await tesseractWorker.recognizePDF(arrayBuffer);
                            if (results && results.length > 0) {
                                ocrResult = results[0]; // Just show first page for simplicity
                            }
                        } catch(e: any) {
                            alert(e.message || "PDF processing error");
                        }
                    }
                } catch(e: any) {
                    alert(e.message || "PDF processing error");
                }
            }

            // Index the document for semantic search after successful OCR
            if (ocrResult?.text) {
                await indexDocument(file.name, ocrResult.text);
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

    const scanForPii = async () => {
        if (!ocrResult?.text || !nerWorker) return;
        isNerProcessing = true;
        try {
            const entities = await nerWorker.detectPII(ocrResult.text);
            // Deduplicate logic or merging could go here, but for now map directly
            piiEntities = entities.map((e: any) => ({
                ...e,
                selected: e.confidence >= 0.7 && ['PERSON', 'EMAIL', 'PHONE', 'SSN'].includes(e.type)
            }));
        } catch (error) {
            console.error("NER Error", error);
            alert("Failed to scan for PII");
        } finally {
            isNerProcessing = false;
        }
    };

    const getEntityColor = (type: string) => {
        switch (type) {
            case 'PERSON': return 'rgba(239, 68, 68, 0.4)'; // red
            case 'EMAIL': return 'rgba(249, 115, 22, 0.4)'; // orange
            case 'PHONE': return 'rgba(59, 130, 246, 0.4)'; // blue
            case 'SSN': return 'rgba(168, 85, 247, 0.4)'; // purple
            case 'LOC': return 'rgba(34, 197, 94, 0.4)'; // green
            case 'ORG': return 'rgba(236, 72, 153, 0.4)'; // pink
            default: return 'rgba(156, 163, 175, 0.4)'; // gray
        }
    };

    // Extract bounding box calculations to a reusable function
    // Calculates the offset based on character index if possible, otherwise falls back to basic match
    const getEntityBbox = (entity: PIIEntity) => {
        if (!ocrResult) return null;

        let matchingWords = [];

        // Use character offsets if available and align with word text
        let charIndex = 0;
        for (const word of ocrResult.words) {
            const wordStart = charIndex;
            const wordEnd = charIndex + word.text.length;

            // Check if entity overlaps with word based on character position
            if (entity.startChar < wordEnd && entity.endChar > wordStart) {
                matchingWords.push(word);
            }
            // Add 1 for the space that separated the words
            charIndex = wordEnd + 1;
        }

        // Fallback to naive string matching if char offset mapping failed
        if (matchingWords.length === 0) {
            matchingWords = ocrResult.words.filter(w =>
                entity.text.includes(w.text) || w.text.includes(entity.text)
            );
        }

        if (matchingWords.length === 0) return null;

        const x0 = Math.min(...matchingWords.map(w => w.bbox.x0));
        const y0 = Math.min(...matchingWords.map(w => w.bbox.y0));
        const x1 = Math.max(...matchingWords.map(w => w.bbox.x1));
        const y1 = Math.max(...matchingWords.map(w => w.bbox.y1));

        return { x0, y0, x1, y1 };
    };

    const getPiiBboxStyle = (entity: PIIEntity) => {
        if (!imageWidth || !imageHeight) return '';

        const bbox = getEntityBbox(entity);
        if (!bbox) return 'display: none;';

        const { x0, y0, x1, y1 } = bbox;

        const left = (x0 / imageWidth) * 100;
        const top = (y0 / imageHeight) * 100;
        const width = ((x1 - x0) / imageWidth) * 100;
        const height = ((y1 - y0) / imageHeight) * 100;

        const bgColor = getEntityColor(entity.type);
        const borderColor = bgColor.replace('0.4)', '1.0)');

        return `left: ${left}%; top: ${top}%; width: ${width}%; height: ${height}%; background-color: ${bgColor}; border: 2px solid ${borderColor}; position: absolute; z-index: 10;`;
    };

    const applyRedactions = async () => {
        if (!originalPdfBuffer || !mupdfWorker) {
            alert("Redaction is only supported for PDF files.");
            return;
        }

        const selectedEntities = piiEntities.filter(e => e.selected);
        if (selectedEntities.length === 0) {
            alert("No PII entities selected for redaction.");
            return;
        }

        const confirmRedact = confirm("⚠️ Redactions are permanent. The original file on your disk is unchanged. Do you want to download the redacted copy?");
        if (!confirmRedact) return;

        isRedacting = true;
        try {
            // Re-load the original PDF buffer to ensure pristine state
            await mupdfWorker.loadPDF(originalPdfBuffer.slice(0));

            // Map selected entities to RedactionRegions
            // In a real app, we need to map OCR image coordinates to PDF point coordinates.
            // Assuming MuPDF rendered page at 150 DPI, PDF points are 72 DPI.
            // Ratio = 72 / 150 = 0.48
            const scaleRatio = 72 / 150;

            const regions = selectedEntities.map(entity => {
                const bbox = getEntityBbox(entity);
                if (!bbox) return null;

                return {
                    page: 0, // Hardcoded to page 0 for this prototype since we only OCR'd page 0
                    x: bbox.x0 * scaleRatio,
                    y: bbox.y0 * scaleRatio,
                    width: (bbox.x1 - bbox.x0) * scaleRatio,
                    height: (bbox.y1 - bbox.y0) * scaleRatio
                };
            }).filter(Boolean) as { page: number, x: number, y: number, width: number, height: number }[];

            if (regions.length > 0) {
                const redactedBuffer = await mupdfWorker.applyRedactions(regions);

                // Download redacted PDF
                const blob = new Blob([redactedBuffer], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = originalPdfFileName.replace('.pdf', '_redacted.pdf');
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 100);
            }
        } catch (error) {
            console.error("Redaction error", error);
            alert("Failed to apply redactions.");
        } finally {
            isRedacting = false;
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

<div class="flex h-screen w-full overflow-hidden bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-50">
    <!-- Sidebar -->
    <aside class="w-64 flex flex-col border-r border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800" data-testid="docs-sidebar">
        <div class="p-4 border-b border-surface-200 dark:border-surface-700">
            <h2 class="text-lg font-semibold">Docs Workspace</h2>
        </div>

        <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
            <!-- File List Section -->
            <section data-testid="sidebar-file-list">
                <h3 class="text-sm font-semibold uppercase tracking-wider text-surface-500 mb-2">File List</h3>
                <ul class="space-y-1">
                    <li class="text-sm px-2 py-1 bg-surface-200 dark:bg-surface-700 rounded text-surface-700 dark:text-surface-300">No files uploaded</li>
                </ul>
            </section>

            <!-- OCR Queue Section -->
            <section data-testid="sidebar-ocr-queue">
                <h3 class="text-sm font-semibold uppercase tracking-wider text-surface-500 mb-2">OCR Queue</h3>
                {#if progress > 0 && progress < 100}
                    <div class="text-sm mb-1">{statusMessage}</div>
                    <div class="w-full bg-surface-300 dark:bg-surface-600 rounded-full h-2">
                        <div class="bg-primary-600 h-2 rounded-full transition-all duration-300" style="width: {progress}%"></div>
                    </div>
                {:else}
                    <div class="text-sm text-surface-500 italic">Queue is empty</div>
                {/if}
            </section>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 bg-surface-50 dark:bg-surface-900">
        <!-- Tabs Bar -->
        <nav class="flex border-b border-surface-200 dark:border-surface-700 px-4 bg-surface-100 dark:bg-surface-800" data-testid="docs-tabs">
            {#each [
                { id: 'viewer', label: 'Viewer' },
                { id: 'merge-split', label: 'Merge & Split' },
                { id: 'redact', label: 'Redact' },
                { id: 'extract', label: 'Extract' }
            ] as tab}
                <button
                    class="px-4 py-3 text-sm font-medium border-b-2 transition-colors {activeTab === tab.id ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:border-surface-300 dark:hover:border-surface-600'}"
                    onclick={() => activeTab = tab.id}
                    data-testid={`tab-${tab.id}`}
                    aria-label={tab.label}
                >
                    {tab.label}
                </button>
            {/each}
        </nav>

        <!-- Active Tab Content -->
        <div class="flex-1 overflow-y-auto p-6" data-testid="tab-content">
            {#if activeTab === 'extract'}
                <!-- Move existing code to extract tab for now -->
                <div class="container mx-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h1 class="text-3xl font-bold">Docs Engine (OCR)</h1>

                        <!-- Search Bar -->
                        <div class="flex gap-2 w-96">
            <input
                type="text"
                bind:value={searchQuery}
                onkeypress={handleSearchKeypress}
                placeholder="Semantic search (e.g., 'invoices from CA')"
                class="border rounded px-4 py-2 flex-grow"
                disabled={isSearching || isIndexing}
            />
            <button
                onclick={handleSearch}
                disabled={isSearching || isIndexing || !searchQuery.trim()}
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
                {isSearching ? 'Searching...' : 'Search'}
            </button>
        </div>
    </div>

    <!-- Search Results View -->
    {#if searchResults.length > 0}
        <div class="mb-8">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-semibold">Search Results</h2>
                <button class="text-gray-500 hover:text-gray-800" onclick={() => searchResults = []}>Clear Results</button>
            </div>

            <div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {#each searchResults as result}
                    <div class="bg-white border rounded p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-bold text-sm truncate text-blue-800" title={result.file_name}>{result.file_name}</h3>
                            <span class="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">Score: {result.score.toFixed(3)}</span>
                        </div>
                        <p class="text-sm text-gray-700 line-clamp-4 leading-relaxed bg-gray-50 p-2 rounded border border-gray-100">
                            {result.chunk_text}
                        </p>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <div
        class="border-4 border-dashed rounded-lg p-12 text-center transition-colors {isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}"
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
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
                    <div class="flex gap-2">
                        <button class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50" onclick={scanForPii} disabled={isNerProcessing || piiEntities.length > 0}>
                            {isNerProcessing ? 'Scanning...' : 'Scan for PII'}
                        </button>
                        <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onclick={copyToClipboard}>
                            Copy Text
                        </button>
                    </div>
                </div>

                <div class="bg-white border rounded p-4 flex-grow overflow-auto mb-4">
                    <pre class="whitespace-pre-wrap font-mono text-sm">{ocrResult.text}</pre>
                </div>

                {#if piiEntities.length > 0}
                    <div class="bg-white border rounded p-4 mb-4">
                        <h3 class="font-bold mb-2">Detected PII ({piiEntities.length})</h3>
                        <div class="max-h-48 overflow-y-auto space-y-2">
                            {#each piiEntities as entity, i}
                                <div class="flex items-center justify-between p-2 bg-gray-50 rounded text-sm border {entity.selected ? 'border-purple-300' : 'border-transparent'}">
                                    <div class="flex items-center gap-3">
                                        <input type="checkbox" bind:checked={piiEntities[i].selected} class="w-4 h-4 text-purple-600" />
                                        <div>
                                            <span class="font-mono bg-gray-200 px-1 rounded">{entity.text}</span>
                                            <span class="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style="background-color: {getEntityColor(entity.type).replace('0.4', '1.0')}">
                                                {entity.type}
                                            </span>
                                            {#if entity.confidence < 0.7}
                                                <span class="text-xs text-amber-600 ml-1 font-semibold">(Uncertain)</span>
                                            {/if}
                                        </div>
                                    </div>
                                    <span class="text-gray-500 text-xs">{(entity.confidence * 100).toFixed(1)}%</span>
                                </div>
                            {/each}
                        </div>

                        {#if originalPdfBuffer}
                            <div class="mt-4 pt-4 border-t flex justify-end">
                                <button class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50" onclick={applyRedactions} disabled={isRedacting || !piiEntities.some(e => e.selected)}>
                                    {isRedacting ? 'Applying...' : 'Apply Redactions'}
                                </button>
                            </div>
                        {:else}
                            <div class="mt-4 pt-4 border-t text-sm text-gray-500">
                                ℹ️ Redaction is only supported for PDF files.
                            </div>
                        {/if}
                    </div>
                {/if}

                <div class="text-sm text-gray-500 mt-2">
                    Execution time: {Math.round(ocrResult.executionTimeMs)}ms | Overall Confidence: {Math.round(ocrResult.confidence)}%
                </div>
            </div>

            <!-- Preview Column -->
            <div>
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-semibold">Preview & Confidence</h2>
                    {#if originalImageSrc && enhancedImageSrc}
                        <div class="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                class="px-3 py-1 rounded-md text-sm font-medium transition-colors {useEnhanced ? 'text-gray-600' : 'bg-white shadow text-blue-600'}"
                                onclick={() => { if(useEnhanced) handleToggleEnhanced(); }}
                                disabled={isProcessing}
                            >
                                Original
                            </button>
                            <button
                                class="px-3 py-1 rounded-md text-sm font-medium transition-colors {useEnhanced ? 'bg-white shadow text-blue-600' : 'text-gray-600'}"
                                onclick={() => { if(!useEnhanced) handleToggleEnhanced(); }}
                                disabled={isProcessing}
                            >
                                Enhanced
                            </button>
                        </div>
                    {/if}
                </div>

                {#if originalImageSrc && enhancedImageSrc}
                <div class="flex gap-4 mb-4 overflow-hidden h-32 opacity-70 hover:opacity-100 transition-opacity">
                    <div class="flex-1 flex flex-col items-center">
                        <span class="text-xs text-gray-500 mb-1">Original</span>
                        <img src={originalImageSrc} alt="Original Thumbnail" class="h-full object-contain bg-gray-50 border rounded {useEnhanced ? '' : 'ring-2 ring-blue-500'}" />
                    </div>
                    <div class="flex-1 flex flex-col items-center">
                        <span class="text-xs text-gray-500 mb-1">Enhanced (Deskew + Denoise)</span>
                        <img src={enhancedImageSrc} alt="Enhanced Thumbnail" class="h-full object-contain bg-gray-50 border rounded {useEnhanced ? 'ring-2 ring-blue-500' : ''}" />
                    </div>
                </div>
                {/if}

                <div class="relative inline-block max-w-full border rounded shadow-sm bg-gray-50">
                    {#if imageSrc}
                        <img src={imageSrc} alt="Document Preview" class="w-full h-auto block" />
                        {#each ocrResult.words as word}
                            <div style={getBboxStyle(word.bbox, word.confidence)} title="{word.text} ({word.confidence}%)"></div>
                        {/each}
                        {#each piiEntities.filter(e => e.selected) as entity}
                            <div style={getPiiBboxStyle(entity)} title="{entity.type}: {entity.text}"></div>
                        {/each}
                    {/if}
                </div>
            </div>
                        </div>
                    {/if}
                </div>
            {:else if activeTab === 'viewer'}
                <div class="flex items-center justify-center h-full text-surface-500">
                    <p>Select a document to view</p>
                </div>
            {:else if activeTab === 'merge-split'}
                <div class="flex items-center justify-center h-full text-surface-500">
                    <p>Merge and Split tool (Coming Soon)</p>
                </div>
            {:else if activeTab === 'redact'}
                <div class="flex items-center justify-center h-full text-surface-500">
                    <p>Redaction tool (Coming Soon)</p>
                </div>
            {/if}
        </div>
    </main>
</div>
