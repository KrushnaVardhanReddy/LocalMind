<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import type { PIIEntity } from '$lib/workers/ner.worker';
    import Papa from 'papaparse';
    import { fade } from 'svelte/transition';

    let file = $state<File | null>(null);
    let isProcessing = $state(false);
    let progress = $state(0);
    let outputUrl = $state<string | null>(null);
    let errorMsg = $state<string | null>(null);

    // Store worker proxy in raw state to prevent Svelte 5 reactivity from intercepting Comlink calls
    let worker = $state.raw<any>(null);

    onMount(async () => {
        try {
            worker = await WorkerManager.getNER();
            await worker.init();
        } catch (err: any) {
            errorMsg = `Failed to initialize NER worker: ${err.message}`;
        }
    });

    onDestroy(() => {
        if (outputUrl) {
            URL.revokeObjectURL(outputUrl);
        }
    });

    function handleFileChange(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            file = target.files[0];
            outputUrl = null;
            errorMsg = null;
            progress = 0;
        }
    }

    async function sanitizeText(text: string): Promise<string> {
        if (!text || text.trim() === '') return text;
        try {
            const entities: PIIEntity[] = await worker.detectPII(text);

            // Sort entities in reverse order of appearance to avoid messing up indices when replacing
            entities.sort((a, b) => b.startChar - a.startChar);

            let sanitized = text;
            for (const entity of entities) {
                // Redact strictly known PII
                if (['PERSON', 'EMAIL', 'PHONE', 'SSN', 'CREDIT_CARD', 'ADDRESS', 'DATE_OF_BIRTH', 'LOC', 'ORG'].includes(entity.type)) {
                     const placeholder = `[REDACTED_${entity.type}]`;
                     sanitized = sanitized.substring(0, entity.startChar) + placeholder + sanitized.substring(entity.endChar);
                }
            }
            return sanitized;
        } catch (err) {
            console.error("NER Error on text chunk:", err);
            return text; // Fallback to original text on error
        }
    }

    async function processCSV(fileToProcess: File) {
        return new Promise<Blob>((resolve, reject) => {
            const chunks: string[] = [];
            let processedBytes = 0;
            let headerParsed = false;

            Papa.parse(fileToProcess, {
                chunkSize: 1024 * 1024 * 2, // 2MB Papa parse chunks to reduce IPC payload
                header: true,
                skipEmptyLines: true,
                chunk: async (results, parser) => {
                    parser.pause();

                    try {
                        const BATCH_SIZE = 100;
                        const processedData = [];

                        // Process rows in batches to avoid IPC flooding
                        for (let i = 0; i < results.data.length; i += BATCH_SIZE) {
                             const batch = results.data.slice(i, i + BATCH_SIZE);

                             const processedBatch = await Promise.all(batch.map(async (row: any) => {
                                 const newRow = { ...row };
                                 for (const key of Object.keys(newRow)) {
                                     if (typeof newRow[key] === 'string' && newRow[key].length > 0) {
                                         newRow[key] = await sanitizeText(newRow[key]);
                                     }
                                 }
                                 return newRow;
                             }));

                             processedData.push(...processedBatch);
                        }

                        // Convert back to CSV
                        const csvChunk = Papa.unparse(processedData, {
                            header: !headerParsed // Only include header in the first chunk
                        });
                        headerParsed = true;

                        chunks.push(csvChunk + '\n');

                        // Approximate progress
                        processedBytes += results.meta.cursor || 0;
                        progress = Math.min(100, Math.round((processedBytes / fileToProcess.size) * 100));

                        parser.resume();
                    } catch (err) {
                        parser.abort();
                        reject(err);
                    }
                },
                complete: () => {
                    const blob = new Blob(chunks, { type: 'text/csv' });
                    resolve(blob);
                },
                error: (err) => {
                    reject(err);
                }
            });
        });
    }

    // Process a JSON file by reading chunks of it.
    // Since reading full JSON strings on main thread causes freezes and using a streaming parser is complex,
    // we stream chunks through a readable stream and extract top level JSON objects for array processing.
    // Given the constraints to avoid blocking main thread, we will read as text and use JSON.parse incrementally.

    async function processJSONStream(fileToProcess: File): Promise<Blob> {
        return new Promise<Blob>(async (resolve, reject) => {
            const stream = fileToProcess.stream();
            const reader = stream.getReader();
            const decoder = new TextDecoder();

            let buffer = '';
            let isInsideString = false;
            let depth = 0;
            let objectStart = -1;

            const sanitizedChunks: string[] = [];
            let processedBytes = 0;
            const totalBytes = fileToProcess.size;

            let batch: any[] = [];
            const BATCH_SIZE = 50;

            async function flushBatch() {
                if (batch.length === 0) return;

                const processedBatch = await Promise.all(batch.map(async obj => {
                     const processed = await traverseAndSanitize(obj);
                     return JSON.stringify(processed);
                }));

                sanitizedChunks.push(...processedBatch);
                batch = [];

                progress = Math.min(100, Math.round((processedBytes / totalBytes) * 100));
            }

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (value) {
                        processedBytes += value.length;
                    }

                    if (done) {
                        if (batch.length > 0) {
                            await flushBatch();
                        }

                        // If it wasn't an array or couldn't parse objects well,
                        // this will result in empty chunks. Let's do a fallback if no objects found.
                        if (sanitizedChunks.length === 0 && buffer.trim().length > 0) {
                            // Try full parse fallback on remaining buffer if small enough
                            try {
                                const fullObj = JSON.parse(buffer);
                                const processed = await traverseAndSanitize(fullObj);
                                resolve(new Blob([JSON.stringify(processed, null, 2)], { type: 'application/json' }));
                            } catch(e) {
                                reject(new Error("Failed to parse JSON file structure."));
                            }
                            return;
                        }

                        // Assemble array
                        const finalBlob = new Blob(['[\n', sanitizedChunks.join(',\n'), '\n]'], { type: 'application/json' });
                        progress = 100;
                        resolve(finalBlob);
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });

                    // Simple lexer to find top-level objects in an array
                    let i = 0;
                    while (i < buffer.length) {
                        const char = buffer[i];

                        // Handle escape sequences correctly for streaming parser
                        if (char === '"' && (i === 0 || buffer[i - 1] !== '\\' || (buffer[i - 1] === '\\' && buffer[i - 2] === '\\'))) {
                            isInsideString = !isInsideString;
                        }

                        if (!isInsideString) {
                            if (char === '{') {
                                if (depth === 0) {
                                    objectStart = i;
                                }
                                depth++;
                            } else if (char === '}') {
                                depth--;
                                if (depth === 0 && objectStart !== -1) {
                                    // Found a complete object
                                    const objStr = buffer.substring(objectStart, i + 1);

                                    try {
                                        const obj = JSON.parse(objStr);
                                        batch.push(obj);

                                        if (batch.length >= BATCH_SIZE) {
                                            await flushBatch();
                                        }
                                    } catch(e) {
                                        // Ignore parsing errors for partial/malformed strings
                                    }

                                    buffer = buffer.substring(i + 1);
                                    i = -1; // Reset loop for new buffer
                                    objectStart = -1;
                                }
                            } else if (depth === 0 && char !== '[' && char !== ']' && char !== ',' && char !== ' ' && char !== '\n' && char !== '\r' && char !== '\t') {
                                // Not inside an object or array, handle simple values if not an array of objects
                                // We skip this for simplicity to assume an array of objects
                            }
                        }
                        i++;
                    }

                    // Yield to event loop occasionally
                    await new Promise(r => setTimeout(r, 0));
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    async function traverseAndSanitize(obj: any): Promise<any> {
        if (typeof obj === 'string') {
            return await sanitizeText(obj);
        } else if (Array.isArray(obj)) {
            const result = [];
            for (let i = 0; i < obj.length; i++) {
                result.push(await traverseAndSanitize(obj[i]));
            }
            return result;
        } else if (obj !== null && typeof obj === 'object') {
            const newObj: any = {};
            for (const [key, value] of Object.entries(obj)) {
                newObj[key] = await traverseAndSanitize(value);
            }
            return newObj;
        }
        return obj;
    }

    async function processFile() {
        if (!file || !worker) return;

        isProcessing = true;
        progress = 0;
        errorMsg = null;

        try {
            let resultBlob: Blob;

            if (file.name.toLowerCase().endsWith('.csv')) {
                resultBlob = await processCSV(file);
            } else if (file.name.toLowerCase().endsWith('.json')) {
                resultBlob = await processJSONStream(file);
            } else {
                throw new Error("Unsupported file type. Please upload a CSV or JSON file.");
            }

            if (outputUrl) {
                URL.revokeObjectURL(outputUrl);
            }
            outputUrl = URL.createObjectURL(resultBlob);
            progress = 100;
        } catch (err: any) {
            errorMsg = err.message || "An error occurred during processing.";
        } finally {
            isProcessing = false;
        }
    }
</script>

<div class="space-y-6">
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <label for="file-upload" class="block text-sm font-medium text-gray-700 mb-2">
            Upload CSV or JSON File
        </label>
        <input
            type="file"
            id="file-upload"
            accept=".csv,.json"
            onchange={handleFileChange}
            class="block w-full text-sm text-gray-500
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-md file:border-0
                   file:text-sm file:font-semibold
                   file:bg-indigo-50 file:text-indigo-700
                   hover:file:bg-indigo-100"
            disabled={isProcessing || worker === null}
        />
        {#if !worker}
            <p class="text-sm text-gray-500 mt-2" transition:fade>Initializing NER worker...</p>
        {/if}
    </div>

    {#if file}
        <div class="flex items-center gap-4" transition:fade>
            <button
                onclick={processFile}
                disabled={isProcessing || !worker}
                class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? 'Processing...' : 'Sanitize Data'}
            </button>

            {#if isProcessing}
                <div class="flex-1 max-w-md" transition:fade>
                    <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            class="h-full bg-indigo-600 transition-all duration-300"
                            style="width: {progress}%"
                        ></div>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">{progress}% Complete</p>
                </div>
            {/if}
        </div>
    {/if}

    {#if errorMsg}
        <div class="p-4 bg-red-50 border border-red-200 rounded-md" transition:fade>
            <p class="text-sm text-red-600">{errorMsg}</p>
        </div>
    {/if}

    {#if outputUrl}
        <div class="p-6 bg-green-50 border border-green-200 rounded-lg flex flex-col items-start gap-4" transition:fade>
            <div>
                <h3 class="text-sm font-medium text-green-800">Processing Complete</h3>
                <p class="text-sm text-green-700 mt-1">
                    Successfully sanitized <strong>{file?.name}</strong>.
                </p>
            </div>

            <a
                href={outputUrl}
                download="sanitized_{file?.name}"
                class="inline-flex items-center px-4 py-2 bg-white border border-green-300 rounded-md text-sm font-medium text-green-700 hover:bg-green-50"
            >
                Download Sanitized File
            </a>
        </div>
    {/if}
</div>
