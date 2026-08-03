<script lang="ts">
    import { Upload } from 'lucide-svelte';

    interface Props {
        accept?: string;
        onDrop?: (file: File) => void;
        title?: string;
        subtitle?: string;
        class?: string;
    }

    let {
        accept = "*/*",
        onDrop,
        title = "Drop file here",
        subtitle = "or click to select",
        class: className = ''
    }: Props = $props();

    let fileInput: HTMLInputElement;
    let isDragging = $state(false);

    function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            onDrop?.(input.files[0]);
        }
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        isDragging = false;
        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            onDrop?.(event.dataTransfer.files[0]);
        }
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        isDragging = true;
    }

    function handleDragLeave(event: DragEvent) {
        event.preventDefault();
        isDragging = false;
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors {isDragging ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20' : 'border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750'} {className}"
    ondrop={handleDrop}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    onclick={() => fileInput.click()}
>
    <Upload class="mb-4 h-12 w-12 text-gray-400" />
    <p class="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
        {title}
    </p>
    <p class="text-sm text-gray-500 dark:text-gray-400">
        {subtitle}
    </p>
    <input
        type="file"
        {accept}
        class="hidden"
        bind:this={fileInput}
        onchange={handleFileChange}
    />
</div>
