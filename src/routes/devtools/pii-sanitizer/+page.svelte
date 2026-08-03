<script lang="ts">
    import PiiSanitizerRunner from '$lib/components/devtools/PiiSanitizerRunner.svelte';
</script>

<div class="h-full w-full flex flex-col p-6 bg-white overflow-hidden">
    <div class="mb-4">
        <h1 class="text-2xl font-semibold text-gray-900">PII Data Sanitizer</h1>
        <p class="text-gray-500 text-sm mt-1">
            Offline PII redaction for CSV and JSON files using local Named Entity Recognition.
        </p>
    </div>

    <div class="flex-1 overflow-auto">
        <PiiSanitizerRunner />
    </div>
</div>
