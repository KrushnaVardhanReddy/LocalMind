<script lang="ts">
    import { onMount } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import type { OCRResult, TesseractWorkerContract } from '$lib/workers/tesseract.worker';
    import type { MuPDFWorkerContract } from '$lib/workers/mupdf.worker';
    import type { DuckDBWorkerContract } from '$lib/workers/duckdb.worker';
    import { BulkProcessingQueue, type BulkJob } from '$lib/workers/bulk-queue';

    let isDragging = false;
    let files: File[] = [];
    let fileInput: HTMLInputElement;
    let isExporting = false;

    let queue: BulkProcessingQueue | null = null;
    let jobs: BulkJob[] = [];
    let isProcessing = false;

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        isDragging = true;
    }

    function handleDragLeave(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
    }

    async function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragging = false;

        if (!e.dataTransfer) return;

        const items = e.dataTransfer.items;
        const promises: Promise<File[]>[] = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const entry = item.webkitGetAsEntry();
                if (entry) {
                    if (entry.isDirectory) {
                        promises.push(readDirectory(entry as FileSystemDirectoryEntry));
                    } else if (entry.isFile) {
                        promises.push(new Promise((resolve) => {
                            (entry as FileSystemFileEntry).file((file) => resolve([file]));
                        }));
                    }
                }
            }
        }

        const resolvedFiles = await Promise.all(promises);
        const allFiles = resolvedFiles.flat();

        // Filter for accepted types
        const acceptedFiles = allFiles.filter(file => {
            const name = file.name.toLowerCase();
            return name.endsWith('.pdf') || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.tiff');
        });

        files = [...files, ...acceptedFiles];
        startProcessing();
    }

    async function readDirectory(directory: FileSystemDirectoryEntry): Promise<File[]> {
        return new Promise((resolve, reject) => {
            const dirReader = directory.createReader();
            const entries: File[] = [];

            const readEntries = () => {
                dirReader.readEntries(async (results: FileSystemEntry[]) => {
                    if (!results.length) {
                        resolve(entries);
                    } else {
                        const promises: Promise<File[]>[] = [];
                        for (const result of results) {
                            if (result.isDirectory) {
                                promises.push(readDirectory(result as FileSystemDirectoryEntry));
                            } else if (result.isFile) {
                                promises.push(new Promise((res) => {
                                    (result as FileSystemFileEntry).file((file) => res([file]));
                                }));
                            }
                        }
                        const files = await Promise.all(promises);
                        entries.push(...files.flat());
                        readEntries();
                    }
                }, reject);
            };
            readEntries();
        });
    }

    function handleFileSelect(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files) {
            const newFiles = Array.from(target.files).filter(file => {
                const name = file.name.toLowerCase();
                return name.endsWith('.pdf') || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.tiff');
            });
            files = [...files, ...newFiles];
            startProcessing();
        }
    }

    function startProcessing() {
        if (isProcessing || files.length === 0) return;
        isProcessing = true;
        queue = new BulkProcessingQueue(files, () => {
            jobs = queue ? queue.getQueue() : [];
            jobs = [...jobs]; // trigger reactivity
        });
        jobs = queue.getQueue();
        queue.start().then(() => { isProcessing = false; });
    }

    async function handleExportCSV() {
        isExporting = true;
        try {
            const doneJobs = jobs.filter(j => j.status === 'done' && j.extractedData);
            if (doneJobs.length === 0) return;

            // Flatten extracted data
            const rows = doneJobs.map(job => {
                return {
                    file_name: job.file.name,
                    document_type: job.type,
                    ...job.extractedData
                };
            });

            // Create a JSON file and load it into DuckDB
            const jsonString = JSON.stringify(rows);
            const file = new File([jsonString], 'export.json', { type: 'application/json' });

            const db = await WorkerManager.getDuckDB();
            await db.init();
            await db.registerFile(file, 'export_table');

            const res = await db.query("COPY (SELECT * FROM export_table) TO 'export.csv' (HEADER, DELIMITER ',')");

            const data = await db.query("SELECT * FROM export_table");
            const header = data.columns.join(',');
            const csvContent = data.rows.map((r: any) => data.columns.map((c: string) => `"${(r[c] || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');

            const blob = new Blob([header + '\n' + csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'extracted_data.csv';
            a.click();
            URL.revokeObjectURL(url);
        } catch(e) {
            console.error(e);
        } finally {
            isExporting = false;
        }
    }

    function handleExportJSON() {
        const doneJobs = jobs.filter(j => j.status === 'done' && j.extractedData);
        if (doneJobs.length === 0) return;
        const out = doneJobs.map(job => ({ file: job.file.name, type: job.type, data: job.extractedData }));

        const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'extracted_data.json';
        a.click();
        URL.revokeObjectURL(url);
    }

</script>

<div class="p-6">
    <h1 class="text-3xl font-bold mb-2">Bulk Document Parsing</h1>
    <p class="text-gray-600 mb-6">Drop a folder of PDFs or images to extract structured data locally.</p>

    <div
        role="region"
        aria-label="Drop zone for files and folders"
        class="border-2 border-dashed rounded-lg p-12 text-center transition-colors {isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}"
        class:hidden={files.length > 0}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
    >
        <div class="mb-4">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
        </div>
        <label for="bulk-file-upload" class="sr-only">Upload files or folders</label>
        <p class="text-lg mb-2">Drag and drop a folder or files here</p>
        <p class="text-sm text-gray-500 mb-4">Supports .pdf, .png, .jpg, .tiff</p>

        <label for="bulk-file-upload" class="sr-only">Upload files or folders</label>
        <input
            id="bulk-file-upload"
            type="file"
            bind:this={fileInput}
            multiple
            class="hidden"
            onchange={handleFileSelect}
        />
        <button
            class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:ring focus:ring-blue-300"
            onclick={() => fileInput.click()}
        >
            Select Files
        </button>
    </div>

    {#if jobs.length > 0}
        <div class="mt-4">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold">Processing Queue ({jobs.filter(j => j.status === 'done').length}/{jobs.length})</h2>
                <div class="flex gap-2">
                    {#if !isProcessing}
                        <button class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700" onclick={handleExportCSV} disabled={isExporting}>Export CSV</button>
                        <button class="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-900" onclick={handleExportJSON} disabled={isExporting}>Export JSON</button>
                        <button class="text-blue-600 border border-blue-600 px-3 py-1 rounded hover:bg-blue-50" onclick={() => { files = []; jobs = []; queue = null; }}>Start Over</button>
                    {/if}
                </div>
            </div>

            <div class="overflow-x-auto bg-white rounded shadow">
                <table class="min-w-full text-sm text-left">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                            <th class="px-4 py-3">File Name</th>
                            <th class="px-4 py-3">Status</th>
                            <th class="px-4 py-3">Detected Type</th>
                            <th class="px-4 py-3">Extracted Fields</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each jobs as job}
                            <tr class="border-b hover:bg-gray-50">
                                <td class="px-4 py-3 font-medium truncate max-w-[200px]" title={job.file.name}>{job.file.name}</td>
                                <td class="px-4 py-3">
                                    {#if job.status === 'queued'}
                                        <span class="text-gray-500">Queued</span>
                                    {:else if job.status === 'processing'}
                                        <span class="text-blue-600 flex items-center gap-1">
                                            <span class="animate-spin inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full"></span>
                                            Processing
                                        </span>
                                    {:else if job.status === 'error'}
                                        <span class="text-red-600" title={job.error}>Error: {job.error}</span>
                                    {:else}
                                        <span class="text-green-600">Done</span>
                                    {/if}
                                </td>
                                <td class="px-4 py-3">
                                    {#if job.type}
                                        <span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{job.type}</span>
                                    {/if}
                                </td>
                                <td class="px-4 py-3 min-w-[300px]">
                                    {#if job.extractedData}
                                        <div class="flex flex-col gap-1">
                                            {#each Object.entries(job.extractedData) as [key, value]}
                                                <div class="flex items-center gap-2">
                                                    <label for={`input-${job.file.name.replace(/[^a-zA-Z0-9]/g,'')}-${key}`} class="text-gray-500 text-xs w-24 shrink-0">{key}:</label>
                                                    <input
                                                        id={`input-${job.file.name.replace(/[^a-zA-Z0-9]/g,'')}-${key}`}
                                                        type="text"
                                                        bind:value={job.extractedData[key]}
                                                        class="border rounded px-2 py-1 text-xs flex-1 focus:ring-1 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
</div>
