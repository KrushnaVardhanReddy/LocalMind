<script lang="ts">
    import { UploadCloud } from 'lucide-svelte';

    interface Props {
        onFileSelected: (file: File) => void;
    }

    let { onFileSelected }: Props = $props();
    let isDragging = $state(false);
    let fileInput: HTMLInputElement;

    function handleDragEnter(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
    }

    function handleDragLeave(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        isDragging = false;
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        isDragging = false;

        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    }

    function handleFileChange(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            handleFile(target.files[0]);
        }
    }

    function handleFile(file: File) {
        const validExtensions = ['.pdf', '.txt', '.md', '.csv'];
        const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

        if (isValid) {
            onFileSelected(file);
        } else {
            alert('Invalid file type. Please upload a PDF, TXT, MD, or CSV file.');
        }
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    class="flex flex-col items-center justify-center w-full h-full p-6 border-2 border-dashed rounded-xl transition-colors cursor-pointer {isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md'}"
    ondragenter={handleDragEnter}
    ondragleave={handleDragLeave}
    ondragover={handleDragOver}
    ondrop={handleDrop}
    onclick={() => fileInput.click()}
>
    <div class="flex flex-col items-center justify-center space-y-4 text-center">
        <UploadCloud class="w-12 h-12 text-zinc-400 dark:text-zinc-500" />
        <div class="space-y-1">
            <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Click to upload or drag and drop
            </p>
            <p class="text-xs text-zinc-500 dark:text-zinc-400">
                PDF, TXT, MD, CSV
            </p>
        </div>
    </div>

    <input
        type="file"
        class="hidden"
        bind:this={fileInput}
        accept=".pdf,.txt,.md,.csv"
        onchange={handleFileChange}
    />
</div>
