<script lang="ts">
    import CanvasEditor from '$lib/components/plugins/annotate/CanvasEditor.svelte';
    import { Upload } from 'lucide-svelte';

    let selectedFile: File | null = $state(null);
    let fileInput: HTMLInputElement;

    function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            selectedFile = input.files[0];
        }
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            selectedFile = event.dataTransfer.files[0];
        }
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
    }
</script>

<div class="flex h-full w-full flex-col bg-gray-50 dark:bg-gray-900">
    <div class="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Annotate Workspace</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Offline image markup and redaction.</p>
    </div>

    <div class="flex-1 overflow-hidden">
        {#if selectedFile}
            <div class="h-full w-full relative">
                 <button
                    class="absolute top-2 right-2 z-10 rounded-md bg-gray-800/50 px-3 py-1 text-sm font-medium text-white hover:bg-gray-800 backdrop-blur-sm"
                    onclick={() => (selectedFile = null)}
                >
                    Close Image
                </button>
                <CanvasEditor imageFile={selectedFile} />
            </div>
        {:else}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="flex h-full w-full items-center justify-center p-8"
                ondrop={handleDrop}
                ondragover={handleDragOver}
            >
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    class="flex w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750"
                    onclick={() => fileInput.click()}
                >
                    <Upload class="mb-4 h-12 w-12 text-gray-400" />
                    <p class="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                        Drop an image here
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        or click to select a file (PNG, JPG, WebP)
                    </p>
                </div>
            </div>
        {/if}
    </div>

    <input
        type="file"
        accept="image/png, image/jpeg, image/webp"
        class="hidden"
        bind:this={fileInput}
        onchange={handleFileChange}
    />
</div>
