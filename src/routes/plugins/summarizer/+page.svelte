<script lang="ts">
    import SummarizerPipeline from '$lib/components/plugins/summarizer/SummarizerPipeline.svelte';
    import Dropzone from '$lib/components/plugins/summarizer/ui/Dropzone.svelte';

    let selectedFile: File | null = $state(null);

    function handleDrop(file: File) {
        if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
            selectedFile = file;
        } else {
            alert("Please upload an audio or video file.");
        }
    }
</script>

<div class="flex h-full w-full flex-col bg-gray-50 dark:bg-gray-900">
    <div class="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Meeting Summarizer</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Offline transcription and summarization of audio/video.</p>
    </div>

    <div class="flex-1 overflow-hidden p-6">
        {#if selectedFile}
            <div class="h-full w-full max-w-5xl mx-auto">
                <SummarizerPipeline mediaFile={selectedFile} onReset={() => (selectedFile = null)} />
            </div>
        {:else}
            <div class="flex h-full w-full items-center justify-center p-8">
                <div class="w-full max-w-md">
                    <Dropzone
                        accept="audio/*, video/*"
                        onDrop={handleDrop}
                        title="Drop media file here"
                        subtitle="or click to select an audio or video file"
                    />
                </div>
            </div>
        {/if}
    </div>
</div>
