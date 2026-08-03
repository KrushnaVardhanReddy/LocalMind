<script lang="ts">
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import Card from './ui/Card.svelte';
    import Button from './ui/Button.svelte';

    let isProcessing = $state(false);
    let progress = $state(0);
    let statusText = $state('');
    let extractedData = $state<string | null>(null);
    let error = $state<string | null>(null);

    async function handleFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        await processFile(file);

        // Reset input so the same file can be selected again
        input.value = '';
    }

    async function handleDrop(event: DragEvent) {
        event.preventDefault();
        if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) return;

        const file = event.dataTransfer.files[0];
        await processFile(file);
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
    }

    async function processFile(file: File) {
        isProcessing = true;
        progress = 0;
        statusText = 'Initializing OCR...';
        extractedData = null;
        error = null;

        try {
            const buffer = await file.arrayBuffer();
            const tesseract = await WorkerManager.getTesseract();

            // Set up progress handler, but note that comlink proxies might need special handling
            // Since we can't easily set a callback property directly over Comlink without proxying the callback,
            // we will just rely on the initialization. The actual contract expects init().
            await tesseract.init(['eng']);

            statusText = 'Running OCR on document...';
            let ocrText = '';

            if (file.type === 'application/pdf') {
                const results = await tesseract.recognizePDF(buffer);
                ocrText = results.map((r: any) => r.text).join('\n');
            } else {
                const result = await tesseract.recognizeImage(buffer, file.type);
                ocrText = result.text;
            }

            if (!ocrText.trim()) {
                throw new Error("No text could be extracted from the document.");
            }

            statusText = 'Extracting data with WebLLM...';
            const llm = await WorkerManager.getWebLLM();

            // Check if model is loaded. If not, try loading a small one.
            const loadedModel = await llm.getLoadedModel();
            if (!loadedModel) {
                 statusText = 'Loading WebLLM Model (this may take a while)...';
                 // Use a small, fast model suitable for this task
                 await llm.loadModel('Llama-3-8B-Instruct-q4f32_1-MLC');
            }

            const prompt = `Extract key values (like Total Amount, Tax, Date, Vendor Name, Tax Deductible items if any) from the following receipt/tax document text. Return the result strictly as a JSON object, with no markdown formatting or extra text.\n\nText:\n${ocrText}`;

            const result = await llm.complete(prompt);

            // Try to parse the result as JSON to ensure it's valid, but display the raw string if parsing fails
            try {
                // Remove potential markdown code blocks if the LLM adds them despite instructions
                let cleanedResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
                JSON.parse(cleanedResult); // Just check if valid
                extractedData = cleanedResult;
            } catch (e) {
                extractedData = result; // fallback to raw string
            }

            statusText = 'Processing complete.';
        } catch (err: any) {
            console.error("Error processing document:", err);
            error = err.message || "An error occurred during processing.";
        } finally {
            isProcessing = false;
        }
    }
</script>

<Card title="Receipt & Tax Document Scanner">
    <div class="flex flex-col gap-4">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
            class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors duration-200 cursor-pointer flex flex-col items-center justify-center gap-2"
            ondrop={handleDrop}
            ondragover={handleDragOver}
            onclick={() => document.getElementById('receipt-upload')?.click()}
        >
            <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p class="text-gray-600 font-medium">Click to upload or drag and drop</p>
            <p class="text-sm text-gray-500">PDF, PNG, JPG, JPEG</p>
            <input
                type="file"
                id="receipt-upload"
                class="hidden"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                onchange={handleFileSelect}
            />
        </div>

        {#if isProcessing}
            <div class="bg-blue-50 text-blue-700 p-4 rounded-md">
                <div class="flex items-center gap-3">
                    <svg class="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="font-medium">{statusText}</span>
                </div>
            </div>
        {/if}

        {#if error}
            <div class="bg-red-50 text-red-700 p-4 rounded-md font-medium border border-red-200">
                {error}
            </div>
        {/if}

        {#if extractedData && !isProcessing}
            <div class="mt-4">
                <h4 class="text-md font-medium text-gray-800 mb-2">Extracted Data</h4>
                <div class="bg-gray-50 p-4 rounded-md border border-gray-200 overflow-x-auto">
                    <pre class="text-sm text-gray-700 whitespace-pre-wrap">{extractedData}</pre>
                </div>
            </div>
        {/if}
    </div>
</Card>