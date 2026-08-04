<script lang="ts">
    import { WorkerManager } from '$lib/workers/WorkerManager';

    interface Props {
        onScanComplete?: () => void;
    }
    const { onScanComplete }: Props = $props();

    let isScanning = $state(false);
    let scanProgress = $state(0);
    let totalFiles = $state(0);
    let processedFiles = $state(0);
    let statusText = $state('');

    async function handleSelectDirectory() {
        if (!('showDirectoryPicker' in window)) {
            alert('Your browser does not support the File System Access API. Please use a modern browser like Chrome or Edge.');
            return;
        }

        try {
            const dirHandle = await (window as any).showDirectoryPicker({ mode: 'read' });
            isScanning = true;
            statusText = 'Scanning for files...';

            const fileHandles: any[] = [];
            await traverseDirectory(dirHandle, fileHandles);

            totalFiles = fileHandles.length;
            if (totalFiles === 0) {
                statusText = 'No supported files found (.txt, .md, .pdf).';
                isScanning = false;
                return;
            }

            statusText = 'Initializing Web Workers...';
            const mupdf = await WorkerManager.getMuPDF();
            const duckdb = await WorkerManager.getDuckDB();
            const embeddings = await WorkerManager.getEmbeddings();

            // Initialize DuckDB connection and ensure vector search extension is loaded
            await duckdb.init();

            // Check if AI is enabled, if not enable it
            const aiEnabled = await embeddings.isAIEnabled();
            if (!aiEnabled) {
                await embeddings.enableAI();
            } else {
                await embeddings.init();
            }

            // Loop files
            processedFiles = 0;
            let dbInitialized = false;

            for (const handle of fileHandles) {
                statusText = `Processing: ${handle.name}`;
                try {
                    const file = await handle.getFile();
                    let text = '';
                    if (file.name.toLowerCase().endsWith('.pdf')) {
                        const buffer = await file.arrayBuffer();
                        text = await mupdf.extractText(buffer);
                    } else {
                        text = await file.text();
                    }

                    // Clean and chunk text
                    const words = text.split(/\s+/).filter(w => w.length > 0);
                    const chunkSize = 500;
                    const overlap = 50;
                    const chunks: string[] = [];

                    for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
                        const chunkWords = words.slice(i, i + chunkSize);
                        if (chunkWords.length > 0) {
                            chunks.push(chunkWords.join(' '));
                        }
                    }

                    if (chunks.length > 0) {
                        const chunkVectors = await embeddings.embedBatch(chunks);

                        if (!dbInitialized && chunkVectors.length > 0) {
                            const vecDim = chunkVectors[0].length;
                            // Initialize DuckDB table with dynamically discovered vector dimension
                            await duckdb.query(`CREATE TABLE IF NOT EXISTS docs (path VARCHAR, content VARCHAR, vec FLOAT[${vecDim}]);`);
                            // Also truncate if we want to overwrite, but spec says "sweep across local filesystem", maybe we just append
                            // For simplicity, let's DROP and re-create to avoid duplicates on multiple scans
                            await duckdb.query(`DROP TABLE IF EXISTS docs;`);
                            await duckdb.query(`CREATE TABLE docs (path VARCHAR, content VARCHAR, vec FLOAT[${vecDim}]);`);
                            dbInitialized = true;
                        }

                        // Insert chunks into DuckDB
                        for (let i = 0; i < chunks.length; i++) {
                            const chunk = chunks[i];
                            const vector = chunkVectors[i];

                            // Escape single quotes and newlines for SQL insertion
                            const safePath = file.name.replace(/'/g, "''").replace(/\n/g, ' ');
                            const safeContent = chunk.replace(/'/g, "''").replace(/\n/g, ' ');
                            const vecStr = `[${vector.join(',')}]`;

                            const query = `INSERT INTO docs VALUES ('${safePath}', '${safeContent}', ${vecStr}::FLOAT[${vector.length}]);`;
                            await duckdb.query(query);
                        }
                    }

                } catch (err) {
                    console.error(`Failed to process ${handle.name}`, err);
                }

                processedFiles++;
                scanProgress = Math.round((processedFiles / totalFiles) * 100);
            }

            statusText = 'Indexing complete!';
            setTimeout(() => {
                isScanning = false;
                if (onScanComplete) onScanComplete();
            }, 1000);

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Error scanning directory:', error);
                statusText = 'Error: ' + error.message;
            }
            isScanning = false;
        }
    }

    async function traverseDirectory(dirHandle: any, fileHandles: any[]) {
        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file') {
                const name = entry.name.toLowerCase();
                if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.pdf')) {
                    fileHandles.push(entry);
                }
            } else if (entry.kind === 'directory') {
                await traverseDirectory(entry, fileHandles);
            }
        }
    }
</script>

<div class="flex flex-col h-full">
    <h2 class="text-lg font-medium text-slate-200 mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
        Directory Scanner
    </h2>

    <p class="text-sm text-slate-400 mb-6">Select a folder on your computer to recursively scan and index PDFs, Markdown, and Text files. Processing happens entirely in your browser.</p>

    {#if isScanning}
        <div class="my-4 bg-slate-900 rounded-lg p-4">
            <div class="flex justify-between text-sm text-slate-400 mb-2">
                <span>{statusText}</span>
                <span>{scanProgress}% ({processedFiles}/{totalFiles})</span>
            </div>
            <div class="w-full bg-slate-700 rounded-full h-2.5">
                <div class="bg-indigo-500 h-2.5 rounded-full transition-all duration-300" style="width: {scanProgress}%"></div>
            </div>
        </div>
    {/if}

    <div class="mt-auto">
        <button
            class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            onclick={handleSelectDirectory}
            disabled={isScanning}
        >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z"></path></svg>
            {isScanning ? 'Scanning...' : 'Select Directory to Scan'}
        </button>
    </div>
</div>
