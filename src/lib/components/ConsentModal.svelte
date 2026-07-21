<script lang="ts">
    let {
        schema,
        sampleRows,
        onconsent,
        oncancel
    }: {
        schema: Record<string, string>;
        sampleRows: any[];
        onconsent: () => void;
        oncancel: () => void;
    } = $props();

</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white p-6 rounded shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <h2 class="text-xl font-bold mb-4 text-red-600">Privacy Notice & Consent</h2>

        <p class="mb-4 text-sm text-gray-700">
            LocalMind wants to send the following schema and 5 rows to your configured AI provider. Do you consent?
        </p>

        <div class="mb-4">
            <h3 class="font-semibold text-sm mb-1">Schema to be sent:</h3>
            <pre class="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(schema, null, 2)}</pre>
        </div>

        <div class="mb-6">
            <h3 class="font-semibold text-sm mb-1">Sample data (max 5 rows) to be sent:</h3>
            <pre class="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(sampleRows, null, 2)}</pre>
        </div>

        <div class="flex justify-end gap-2">
            <button onclick={oncancel} class="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
            <button onclick={onconsent} class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">I Consent, Send to AI</button>
        </div>
    </div>
</div>
