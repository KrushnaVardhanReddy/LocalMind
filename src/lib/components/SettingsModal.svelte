<script lang="ts">
    import { onMount } from 'svelte';

    let { onclose }: { onclose: () => void } = $props();

    let apiKey = $state('');
    let provider: 'openai' | 'anthropic' = $state('openai');

    onMount(() => {
        const storedKey = localStorage.getItem('OPENAI_API_KEY');
        const storedProvider = localStorage.getItem('LLM_PROVIDER') as 'openai' | 'anthropic';
        if (storedKey) apiKey = storedKey;
        if (storedProvider) provider = storedProvider;
    });

    function saveSettings() {
        localStorage.setItem('OPENAI_API_KEY', apiKey);
        localStorage.setItem('LLM_PROVIDER', provider);
        onclose();
    }
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <h2 class="text-xl font-bold mb-4">AI Settings</h2>

        <div class="mb-4">
            <label for="provider-select" class="block text-sm font-medium mb-1">Provider</label>
            <select id="provider-select" bind:value={provider} class="w-full border rounded p-2">
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
            </select>
        </div>

        <div class="mb-4">
            <label for="api-key-input" class="block text-sm font-medium mb-1">API Key</label>
            <input id="api-key-input" type="password" bind:value={apiKey} class="w-full border rounded p-2" placeholder="sk-..." />
            <p class="text-xs text-gray-500 mt-1">Your key is stored locally in your browser.</p>
        </div>

        <div class="flex justify-end gap-2">
            <button onclick={onclose} class="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
            <button onclick={saveSettings} class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
        </div>
    </div>
</div>
