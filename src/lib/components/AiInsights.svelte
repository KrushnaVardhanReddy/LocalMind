<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { aiSettings } from '$lib/stores/aiSettingsStore';
  import { activeTableSchema } from '$lib/stores/schemaStore';
  import { queryEngine } from '$lib/services/QueryEngine';
  import { AiService } from '$lib/services/AiService';

  const dispatch = createEventDispatcher();

  let isGenerating = false;
  let showConsent = false;
  let errorMsg: string | null = null;

  let currentPayload: any = null;
  let currentInsight: string | null = null;

  async function handlePrepareInsights() {
    if (!$activeTableSchema) return;

    errorMsg = null;
    isGenerating = true;

    try {
      // Basic automatic aggregation:
      // 1. Find a categorical column (VARCHAR)
      // 2. Find a numeric column (BIGINT, INTEGER, DOUBLE, DECIMAL)
      const schemaCols = $activeTableSchema.columns;
      const categoricalCol = schemaCols.find(c => c.type.includes('VARCHAR'));
      const numericCol = schemaCols.find(c => ['BIGINT', 'INTEGER', 'DOUBLE', 'DECIMAL', 'FLOAT'].includes(c.type));

      let aggregatedData = [];
      let queryRun = "";

      if (categoricalCol && numericCol) {
        // Group by categorical and sum numeric
        queryRun = `SELECT "${categoricalCol.name}" as category, SUM("${numericCol.name}") as total_value
                    FROM ${$activeTableSchema.tableName}
                    GROUP BY "${categoricalCol.name}"
                    ORDER BY total_value DESC
                    LIMIT 10;`;
        const result = await queryEngine.executeQuery(queryRun);
        aggregatedData = result.rows;
      } else {
        // Fallback: Just grab general row count if no good grouping is found
        queryRun = `SELECT COUNT(*) as total_rows FROM ${$activeTableSchema.tableName};`;
        const result = await queryEngine.executeQuery(queryRun);
        aggregatedData = result.rows;
      }

      // Prepare insights payload per contract
      currentPayload = {
        task: "SUMMARIZE_AGGREGATION",
        context: {
          metrics: {
            total_rows: $activeTableSchema.rowCount
          },
          aggregated_data: aggregatedData
        },
        prompt: "Provide a brief executive summary of these metrics. Focus on the largest categories if any are present."
      };

      showConsent = true;
    } catch (e: any) {
      errorMsg = e.message;
    } finally {
      isGenerating = false;
    }
  }

  async function handleConsentAndGenerate() {
    showConsent = false;
    isGenerating = true;
    errorMsg = null;
    currentInsight = null;

    try {
      const result = await AiService.generateInsights(currentPayload, currentPayload.prompt);
      currentInsight = result.insight;
    } catch (e: any) {
      errorMsg = e.message;
    } finally {
      isGenerating = false;
    }
  }
</script>

{#if $aiSettings.aiEnabled}
  <div class="mt-4 mb-4 bg-green-50 p-4 rounded-lg border border-green-200">
    <div class="flex justify-between items-center mb-2">
      <h3 class="text-sm font-bold text-green-800">📊 AI Data Insights</h3>
      <button
        on:click={handlePrepareInsights}
        disabled={isGenerating}
        class="bg-green-600 hover:bg-green-700 text-white font-medium py-1.5 px-3 rounded text-sm disabled:opacity-50"
      >
        {isGenerating ? 'Analyzing...' : 'Generate Insights'}
      </button>
    </div>

    {#if errorMsg}
      <p class="text-red-600 text-sm mt-2">{errorMsg}</p>
    {/if}

    {#if currentInsight}
      <div class="mt-3 p-3 bg-white rounded border border-green-100 text-gray-800 text-sm leading-relaxed">
        <strong>Executive Summary:</strong> {currentInsight}
      </div>
    {/if}
  </div>
{/if}

{#if showConsent}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
    <div class="relative p-5 border w-[600px] shadow-lg rounded-md bg-white">
      <h3 class="text-lg font-bold text-gray-900 mb-2">Consent Review: AI Insights Payload</h3>
      <p class="text-sm text-gray-600 mb-4">
        The following statistically aggregated payload will be sent to your configured AI provider. No raw data rows are included.
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
