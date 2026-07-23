<script lang="ts">
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import type { VisualDiffWorkerContract, VisualDiffResult } from '$lib/workers/visual-diff.worker';

    let expectedImageSrc: string | null = $state(null);
    let actualImageSrc: string | null = $state(null);
    let diffImageSrc: string | null = $state(null);

    let expectedArrayBuffer: ArrayBuffer | null = $state(null);
    let actualArrayBuffer: ArrayBuffer | null = $state(null);
    let result: VisualDiffResult | null = $state(null);
    let threshold: number = $state(0.1);

    let loading: boolean = $state(false);

    const handleFileDrop = async (e: DragEvent, type: 'expected' | 'actual') => {
        e.preventDefault();
        const file = e.dataTransfer?.files[0];
        if (file) {
            await loadFile(file, type);
        }
    };

    const loadFile = async (file: File, type: 'expected' | 'actual') => {
        // Convert to PNG if needed, for now assuming PNGs
        // In real app we might need to draw non-PNGs to canvas first
        let finalFile = file;
        if (!file.name.toLowerCase().endsWith('.png')) {
            finalFile = await convertToPng(file);
        }

        const arrayBuffer = await finalFile.arrayBuffer();
        const url = URL.createObjectURL(finalFile);

        if (type === 'expected') {
            if (expectedImageSrc) URL.revokeObjectURL(expectedImageSrc);
            expectedImageSrc = url;
            expectedArrayBuffer = arrayBuffer;
        } else {
            if (actualImageSrc) URL.revokeObjectURL(actualImageSrc);
            actualImageSrc = url;
            actualArrayBuffer = arrayBuffer;
        }
    };

    const convertToPng = async (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Canvas context null'));
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name + '.png', { type: 'image/png' }));
                    } else {
                        reject(new Error('Canvas toBlob failed'));
                    }
                }, 'image/png');
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    };

    const compare = async (t: number) => {
        if (!expectedArrayBuffer || !actualArrayBuffer) return;

        loading = true;
        try {
            const visualDiff: VisualDiffWorkerContract = await WorkerManager.getVisualDiff();
            result = await visualDiff.compare(expectedArrayBuffer, actualArrayBuffer, t);

            if (diffImageSrc) URL.revokeObjectURL(diffImageSrc);
            const blob = new Blob([result.diffImageBuffer], { type: 'image/png' });
            diffImageSrc = URL.createObjectURL(blob);
        } catch (e) {
            console.error('Visual Diff error', e);
        } finally {
            loading = false;
        }
    };

    $effect(() => {
        if (expectedArrayBuffer && actualArrayBuffer) {
            compare(threshold);
        }
    });

</script>

<div class="container mx-auto p-4 flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Visual Regression Diffing</h1>

    <div class="flex gap-4">
        <!-- Expected Dropzone -->
        <div
            role="button"
            tabindex="0"
            class="flex-1 h-64 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center bg-gray-50 relative"
            ondragover={(e) => e.preventDefault()}
            ondrop={(e) => handleFileDrop(e, 'expected')}
        >
            {#if expectedImageSrc}
                <img src={expectedImageSrc} alt="Expected" class="max-h-full max-w-full object-contain" />
            {:else}
                <p class="text-gray-500">Drop Expected Screenshot Here</p>
            {/if}
            <!-- svelte-ignore a11y_missing_attribute -->
            <input aria-label="Drop Expected Screenshot Here" type="file" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onchange={(e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) loadFile(file, 'expected'); }} />
        </div>

        <!-- Actual Dropzone -->
        <div
            role="button"
            tabindex="0"
            class="flex-1 h-64 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center bg-gray-50 relative"
            ondragover={(e) => e.preventDefault()}
            ondrop={(e) => handleFileDrop(e, 'actual')}
        >
            {#if actualImageSrc}
                <img src={actualImageSrc} alt="Actual" class="max-h-full max-w-full object-contain" />
            {:else}
                <p class="text-gray-500">Drop Actual Screenshot Here</p>
            {/if}
            <!-- svelte-ignore a11y_missing_attribute -->
            <input aria-label="Drop Actual Screenshot Here" type="file" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onchange={(e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) loadFile(file, 'actual'); }} />
        </div>
    </div>

    <div class="flex items-center gap-4">
        <label for="threshold" class="font-medium text-sm">Sensitivity (Threshold): {threshold}</label>
        <input
            type="range"
            id="threshold"
            min="0"
            max="0.5"
            step="0.01"
            bind:value={threshold}
            class="w-64"
        />
        <button
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            onclick={() => compare(threshold)}
            disabled={!expectedArrayBuffer || !actualArrayBuffer || loading}
        >
            {loading ? 'Comparing...' : 'Compare'}
        </button>
    </div>

    {#if result}
        <div class="bg-white p-4 rounded shadow">
            <h2 class="text-lg font-semibold mb-2">Results</h2>
            <div class="mb-4">
                <p class="text-sm">
                    <strong>{result.diffPixelCount}</strong> pixels changed ({result.percentageChanged.toFixed(2)}% of image)
                </p>
                {#if result.boundingBox}
                    <p class="text-sm">
                        Bounding Box: x={result.boundingBox.x}, y={result.boundingBox.y}, width={result.boundingBox.width}, height={result.boundingBox.height}
                    </p>
                {/if}
            </div>

            <div class="grid grid-cols-3 gap-4">
                <div>
                    <h3 class="font-medium mb-1 text-center">Expected Image</h3>
                    <div class="border rounded p-1 bg-gray-100 flex items-center justify-center min-h-[200px]">
                        {#if expectedImageSrc}
                            <img src={expectedImageSrc} alt="Expected" class="max-w-full h-auto" />
                        {/if}
                    </div>
                </div>
                <div>
                    <h3 class="font-medium mb-1 text-center">Actual Image</h3>
                    <div class="border rounded p-1 bg-gray-100 flex items-center justify-center relative min-h-[200px]">
                        {#if actualImageSrc}
                            <img src={actualImageSrc} alt="Actual" class="max-w-full h-auto" />
                            {#if result.boundingBox}
                                <div class="absolute inset-0 pointer-events-none">
                                    <svg viewBox="0 0 {result.diffWidth} {result.diffHeight}" class="w-full h-full object-contain">
                                        <rect
                                            x={result.boundingBox.x}
                                            y={result.boundingBox.y}
                                            width={result.boundingBox.width}
                                            height={result.boundingBox.height}
                                            fill="none"
                                            stroke="red"
                                            stroke-width="2"
                                        />
                                    </svg>
                                </div>
                            {/if}
                        {/if}
                    </div>
                </div>
                <div>
                    <h3 class="font-medium mb-1 text-center">Diff Heatmap</h3>
                    <div class="border rounded p-1 bg-gray-100 flex items-center justify-center min-h-[200px]">
                        {#if diffImageSrc}
                            <img src={diffImageSrc} alt="Diff" class="max-w-full h-auto" />
                        {/if}
                    </div>
                </div>
            </div>

            <div class="mt-4 flex justify-end">
                {#if diffImageSrc}
                    <a
                        href={diffImageSrc}
                        download="diff-heatmap.png"
                        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Download Diff Image
                    </a>
                {/if}
            </div>
        </div>
    {/if}
</div>
