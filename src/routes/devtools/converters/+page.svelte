<script lang="ts">
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import type { ConvertFormat } from '$lib/workers/converter.worker';

    let sourceFormat = $state<ConvertFormat>('json');
    let targetFormat = $state<ConvertFormat>('yaml');
    let inputText = $state('');
    let outputText = $state('');
    let isProcessing = $state(false);
    let errorMessage = $state('');
    let showProgress = $state(false); // To satisfy large file processing (basic visual)

    // Derived states
    let formatOptions: ConvertFormat[] = ['json', 'yaml', 'xml'];
    let targetFormatOptions = $derived(formatOptions.filter(f => f !== sourceFormat));

    // Ensure targetFormat is always valid
    $effect(() => {
        if (targetFormat === sourceFormat) {
            targetFormat = targetFormatOptions[0];
        }
    });

    const handleSwap = () => {
        const temp = sourceFormat;
        sourceFormat = targetFormat;
        targetFormat = temp;

        // Swap inputs and outputs if output exists and no error
        if (outputText && !errorMessage) {
            const tempText = inputText;
            inputText = outputText;
            outputText = ''; // Clear to prevent confusion
        }
    };

    const handleConvert = async () => {
        if (!inputText.trim()) {
            errorMessage = 'Input cannot be empty.';
            return;
        }

        errorMessage = '';
        outputText = '';
        isProcessing = true;

        // Basic heuristic for showing a progress visual since we can't easily track chunk progress in standard json/yaml conversion
        // In a real large file scenario we'd stream it, but js-yaml/fast-xml-parser mainly work on strings.
        // The spec asks for a progress bar for files > 1MB during conversion.
        if (inputText.length > 1024 * 1024) {
             showProgress = true;
        }

        try {
            const converter = await WorkerManager.getConverter();

            let result;
            if (sourceFormat === 'json' && targetFormat === 'yaml') {
                result = await converter.jsonToYaml(inputText);
            } else if (sourceFormat === 'yaml' && targetFormat === 'json') {
                result = await converter.yamlToJson(inputText);
            } else if (sourceFormat === 'json' && targetFormat === 'xml') {
                result = await converter.jsonToXml(inputText);
            } else if (sourceFormat === 'xml' && targetFormat === 'json') {
                result = await converter.xmlToJson(inputText);
            } else if (sourceFormat === 'yaml' && targetFormat === 'xml') {
                // yaml -> json -> xml
                const intermediate = await converter.yamlToJson(inputText);
                if (!intermediate.success) {
                    result = intermediate;
                } else {
                    result = await converter.jsonToXml(intermediate.data);
                }
            } else if (sourceFormat === 'xml' && targetFormat === 'yaml') {
                 // xml -> json -> yaml
                const intermediate = await converter.xmlToJson(inputText);
                if (!intermediate.success) {
                    result = intermediate;
                } else {
                    result = await converter.jsonToYaml(intermediate.data);
                }
            } else {
                errorMessage = `Conversion from ${sourceFormat} to ${targetFormat} is not supported.`;
                isProcessing = false;
                showProgress = false;
                return;
            }

            if (result && result.success) {
                outputText = result.data;
            } else {
                errorMessage = result.error || 'An unknown error occurred during conversion.';
            }
        } catch (error: any) {
            errorMessage = `Worker error: ${error.message}`;
        } finally {
            isProcessing = false;
            showProgress = false;
        }
    };

    const handleDownload = () => {
        if (!outputText) return;
        const blob = new Blob([outputText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        let ext = targetFormat;
        if (targetFormat === 'yaml') ext = 'yaml'; // or yml

        a.download = `converted.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleFileDrop = async (e: DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer?.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                inputText = event.target.result as string;
                // Auto-detect format based on extension
                if (file.name.endsWith('.json')) sourceFormat = 'json';
                else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) sourceFormat = 'yaml';
                else if (file.name.endsWith('.xml')) sourceFormat = 'xml';
            }
        };
        reader.readAsText(file);
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
    };

</script>

<div class="container mx-auto p-4 space-y-6">
    <header>
        <h1 class="text-2xl font-bold text-gray-900">Data Format Converters</h1>
        <p class="text-gray-600">Convert between JSON, YAML, and XML entirely offline.</p>
    </header>

    <div class="bg-white rounded-lg shadow p-6 space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1" for="source-format">Source</label>
                    <select id="source-format" bind:value={sourceFormat} class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
                        {#each formatOptions as format}
                            <option value={format}>{format.toUpperCase()}</option>
                        {/each}
                    </select>
                </div>

                <button
                    class="mt-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    title="Swap formats"
                    onclick={handleSwap}>
                    <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                </button>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1" for="target-format">Target</label>
                    <select id="target-format" bind:value={targetFormat} class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
                        {#each targetFormatOptions as format}
                            <option value={format}>{format.toUpperCase()}</option>
                        {/each}
                    </select>
                </div>
            </div>

            <div class="flex gap-2">
                 <button
                    class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    onclick={handleConvert}
                    disabled={isProcessing}
                >
                    {isProcessing ? 'Converting...' : 'Convert'}
                </button>

                <button
                    class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
                    onclick={handleDownload}
                    disabled={!outputText}
                >
                    Download Output
                </button>
            </div>
        </div>

        <!-- Progress Bar (Visible for large files) -->
        {#if showProgress}
             <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4 overflow-hidden">
                <div class="bg-indigo-600 h-2.5 rounded-full animate-pulse" style="width: 100%"></div>
            </div>
        {/if}

        {#if errorMessage}
            <div class="p-4 bg-red-50 text-red-700 rounded-md">
                {errorMessage}
            </div>
        {/if}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex flex-col h-[500px]">
                <label class="block text-sm font-medium text-gray-700 mb-2" for="input-text">Input ({sourceFormat.toUpperCase()})</label>
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <textarea
                    id="input-text"
                    bind:value={inputText}
                    ondragover={handleDragOver}
                    ondrop={handleFileDrop}
                    class="flex-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 font-mono text-sm border resize-none"
                    placeholder="Paste your {sourceFormat.toUpperCase()} here or drag and drop a file..."
                ></textarea>
            </div>

            <div class="flex flex-col h-[500px]">
                <label class="block text-sm font-medium text-gray-700 mb-2" for="output-text">Output ({targetFormat.toUpperCase()})</label>
                <textarea
                    id="output-text"
                    readonly
                    value={outputText}
                    class="flex-1 w-full rounded-md border-gray-300 shadow-sm bg-gray-50 p-3 font-mono text-sm border resize-none"
                    placeholder="Output will appear here..."
                ></textarea>
            </div>
        </div>
    </div>
</div>
