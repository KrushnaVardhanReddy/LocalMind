<script lang="ts">
  import { queryEngine } from '$lib/services/QueryEngine';

  let status = 'Not Initialized';
  let queryResult: any = null;
  let errorMsg: string | null = null;

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
      class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      on:click={runTestQuery}
      disabled={status !== 'Ready'}
    >
      Run Test Query
    </button>
  </div>

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
