<script lang="ts">
    import { WorkerManager } from '$lib/workers/WorkerManager';

    let result: any = $state(null);

    async function runQuery() {
        // Automatically lazy-loads and initializes if it's the first time
        const db = await WorkerManager.getDuckDB();
        result = await db.query("SELECT * FROM table");
        console.log('Query result:', result);
    }
</script>

<main class="p-8">
    <h1 class="text-2xl font-bold mb-4">LocalMind Worker Test</h1>

    <button
        onclick={runQuery}
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
    >
        Run Stub Query
    </button>

    {#if result}
        <div class="mt-4 p-4 bg-gray-100 rounded">
            <h2 class="font-semibold">Result:</h2>
            <pre class="text-sm mt-2">{JSON.stringify(result, null, 2)}</pre>
        </div>
    {/if}
</main>
