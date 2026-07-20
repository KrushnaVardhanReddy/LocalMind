<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { aiSettings } from '$lib/stores/aiSettingsStore';
  import { activeTableSchema } from '$lib/stores/schemaStore';
  import { AiService } from '$lib/services/AiService';

  const dispatch = createEventDispatcher();

  let userPrompt = '';
  let isGenerating = false;
  let showConsent = false;
  let errorMsg: string | null = null;

  let currentPayload: any = null;

  function handlePrepareGenerate() {
    if (!$activeTableSchema) return;

    errorMsg = null;

    // Prepare schema payload per contract
    currentPayload = {
      task: "TEXT_TO_SQL",
      context: {
        dialect: "duckdb",
        tables: [
          {
            name: $activeTableSchema.tableName,
            schema: $activeTableSchema.columns.map(c => ({ column: c.name, type: c.type })),
            sample_values: {} // Keep empty for privacy, or sample non-PII later
          }
        ]
      },
      prompt: userPrompt
    };

    showConsent = true;
  }

  async function handleConsentAndGenerate() {
    showConsent = false;
    isGenerating = true;
    errorMsg = null;

    try {
      const result = await AiService.generateSql(currentPayload, userPrompt);
      dispatch('generated', { sql: result.sql });
      userPrompt = ''; // clear input
    } catch (e: any) {
      errorMsg = e.message;
    } finally {
      isGenerating = false;
    }
  }
</script>

{#if $aiSettings.aiEnabled}
  <div class="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
    <h3 class="text-sm font-bold text-blue-800 mb-2">✨ AI Text-to-SQL</h3>
    <div class="flex gap-2">
      <input
        type="text"
        bind:value={userPrompt}
        placeholder="e.g. Show me the top 10 rows ordered by revenue..."
        class="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-blue-500"
        on:keydown={(e) => e.key === 'Enter' && userPrompt.trim() && handlePrepareGenerate()}
      />
      <button
        on:click={handlePrepareGenerate}
        disabled={!userPrompt.trim() || isGenerating}
        class="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
      >
        {isGenerating ? 'Generating...' : 'Generate SQL'}
      </button>
    </div>

    {#if errorMsg}
      <p class="text-red-600 text-sm mt-2">{errorMsg}</p>
    {/if}
  </div>
{/if}

{#if showConsent}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
    <div class="relative p-5 border w-[600px] shadow-lg rounded-md bg-white">
      <h3 class="text-lg font-bold text-gray-900 mb-2">Consent Review: AI Payload</h3>
      <p class="text-sm text-gray-600 mb-4">
        The following exact payload will be sent to your configured AI provider. No raw data rows are included.
      </p>

      <div class="bg-gray-100 p-3 rounded text-sm font-mono overflow-auto max-h-64 mb-4 whitespace-pre-wrap">
        {JSON.stringify(currentPayload, null, 2)}
      </div>

      <div class="flex justify-end gap-3">
        <button
          on:click={() => showConsent = false}
          class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          on:click={handleConsentAndGenerate}
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          Approve & Send Request
        </button>
      </div>
    </div>
  </div>
{/if}
