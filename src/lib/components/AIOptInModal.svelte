<script lang="ts">
    export let onEnable: () => void;
    export let onCancel: () => void;
    export let aiDownloadProgress: boolean = false;
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <h2 class="text-xl font-bold mb-4">Enable Local AI?</h2>
        <p class="mb-4 text-sm text-gray-700">
            LocalMind uses AI to analyze your data. To protect your privacy and conserve your device's memory and battery, AI is disabled by default.
            Enabling AI will download a local model (approx 1.5GB) to your browser. Your data will never leave your machine.
        </p>
        <div class="flex justify-end gap-2">
            <button on:click={onCancel} class="px-4 py-2 border rounded hover:bg-gray-100" disabled={aiDownloadProgress}>Cancel</button>
            <button
                on:click={onEnable}
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                disabled={aiDownloadProgress}
            >
                {#if aiDownloadProgress}
                    <span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Downloading Models...
                {:else}
                    Enable AI
                {/if}
            </button>
        </div>
    </div>
</div>
