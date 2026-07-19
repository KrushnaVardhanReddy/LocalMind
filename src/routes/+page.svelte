<script lang="ts">
  import { queryEngine } from '$lib/services/QueryEngine';
  import FilePicker from '$lib/components/FilePicker.svelte';
  import { activeTableSchema } from '$lib/stores/schemaStore';

  let status = 'Not Initialized';
  let queryResult: any = null;
  let errorMsg: string | null = null;
  let isUploading = false;

  async function initEngine() {
    try {
      status = 'Initializing...';
      const result = await queryEngine.init();
      if (result.ready) {
        status = 'Ready';
      }
    } catch (e: any) {
      status = 'Error';
      errorMsg = e.message;
    }
  }

  async function runTestQuery() {
    try {
      errorMsg = null;
      queryResult = null;
      const result = await queryEngine.executeQuery('SELECT 42 as answer');
      queryResult = result.rows;
    } catch (e: any) {
      errorMsg = e.message;
    }
  }

  async function handleFileSelected(event: CustomEvent<{ file: File }>) {
    const file = event.detail.file;
    errorMsg = null;
    isUploading = true;

    // Auto-init if not ready
    if (status !== 'Ready') {
        await initEngine();
    }

    try {
      // Derive format from extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      let fileFormat: 'CSV' | 'JSON' | 'PARQUET' | 'UNKNOWN' = 'UNKNOWN';
      if (extension === 'csv') fileFormat = 'CSV';
      else if (extension === 'json') fileFormat = 'JSON';
      else if (extension === 'parquet') fileFormat = 'PARQUET';

      // Sanitize table name (replace non-alphanumeric with underscore)
      const tableName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

      const result = await queryEngine.loadFile(tableName, fileFormat, file);

      activeTableSchema.set({
        tableName,
        rowCount: result.rowCount,
        columns: result.schema
      });

    } catch (e: any) {
      errorMsg = `Failed to load file: ${e.message}`;
    } finally {
      isUploading = false;
    }
  }
</script>

<main class="p-8">
  <h1 class="text-2xl font-bold mb-4">DuckDB WASM Test</h1>

  <div class="mb-4">
    <span class="font-semibold">Engine Status:</span> {status}
  </div>

  <div class="space-x-4 mb-8">
    <button
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      on:click={initEngine}
    >
      Initialize Engine
    </button>

    <button
      class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded opacity-50 cursor-not-allowed"
      on:click={runTestQuery}
      disabled={status !== 'Ready'}
      class:opacity-100={status === 'Ready'}
      class:opacity-50={status !== 'Ready'}
    >
      Run Test Query
    </button>
  </div>

  <div class="mb-8 max-w-2xl">
    <h2 class="text-xl font-semibold mb-2">Upload Data</h2>
    {#if isUploading}
      <div class="p-8 text-center text-gray-500 animate-pulse border-2 border-dashed rounded-lg">
        Loading file into DuckDB...
      </div>
    {:else}
      <FilePicker on:fileSelected={handleFileSelected} />
    {/if}
  </div>

  {#if $activeTableSchema}
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-2">Active Dataset: {$activeTableSchema.tableName}</h2>
      <p class="text-gray-600 mb-4">Total Rows: {$activeTableSchema.rowCount.toLocaleString()}</p>

      <div class="overflow-x-auto">
        <table class="min-w-full bg-white border border-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nullable</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {#each $activeTableSchema.columns as col}
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{col.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {col.type}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{!col.notnull ? 'Yes' : 'No'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

  {#if errorMsg}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {errorMsg}
    </div>
  {/if}

  {#if queryResult}
    <div>
      <h2 class="text-xl font-semibold mb-2">Query Result:</h2>
      <pre class="bg-gray-100 p-4 rounded">{JSON.stringify(queryResult, null, 2)}</pre>
    </div>
  {/if}
</main>
