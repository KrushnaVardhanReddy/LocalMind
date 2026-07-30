<script lang="ts">
  import type { PivotTemplate } from '$lib/templates/template.types';
  import { builtInTemplates } from '$lib/templates/built-in';
  import { WorkerManager } from '$lib/workers/WorkerManager';
  import type { WaSQLiteWorkerContract } from '$lib/contracts/wa_sqlite_contract';

  let { columns, onSelectTemplate, onClose } = $props<{
    columns: string[];
    onSelectTemplate: (template: PivotTemplate) => void;
    onClose: () => void;
  }>();

  // Custom templates logic
  let customTemplates = $state<PivotTemplate[]>([]);
  // We'll load custom templates from wa-sqlite logic here (or via a store/worker)
  // For now, let's keep it simple with local storage or a dummy fetch if we don't have wa-sqlite ready inline yet.

  let allTemplates = $derived([...builtInTemplates, ...customTemplates]);

  // Template matching logic
  function calculateMatchScore(template: PivotTemplate, actualColumns: string[]): number {
    const lowerActual = actualColumns.map(c => c.toLowerCase());
    let matchCount = 0;

    for (const req of template.requiredColumns) {
      if (lowerActual.includes(req.toLowerCase())) {
        matchCount++;
      }
    }

    return matchCount / template.requiredColumns.length;
  }

  let scoredTemplates = $derived(
    allTemplates.map(t => ({
      ...t,
      score: calculateMatchScore(t, columns)
    })).sort((a, b) => b.score - a.score)
  );

  let suggestedTemplates = $derived(scoredTemplates.filter(t => t.score >= 0.5));
  let otherTemplates = $derived(scoredTemplates.filter(t => t.score < 0.5));

  // Category grouping can also be added.

  $effect(() => {
    loadCustomTemplates();
  });

  async function loadCustomTemplates() {
    try {
      const sqlite = await WorkerManager.getSQLite() as WaSQLiteWorkerContract;
      const records = await sqlite.listCustomTemplates();
      customTemplates = records.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        icon: r.icon,
        category: r.category as any,
        requiredColumns: JSON.parse(r.required_columns),
        optionalColumns: r.optional_columns ? JSON.parse(r.optional_columns) : [],
        pivotConfig: JSON.parse(r.pivot_config)
      }));
    } catch (e) {
      console.error("Failed to load custom templates", e);
    }
  }

</script>

<!-- Template Gallery Modal -->
<div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
  <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onclick={onClose}></div>

    <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

    <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
      <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
        <div class="sm:flex sm:items-start">
          <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
            <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
              Template Gallery
            </h3>
            <div class="mt-4">

              {#if suggestedTemplates.length > 0}
                <div class="mb-6">
                  <h4 class="text-md font-semibold text-indigo-700 mb-2">Suggested Templates</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {#each suggestedTemplates as template}
                      <div class="border rounded-lg p-4 bg-indigo-50 flex flex-col justify-between">
                        <div>
                          <div class="text-2xl mb-2">{template.icon}</div>
                          <h5 class="font-bold text-gray-900">{template.name}</h5>
                          <p class="text-sm text-gray-600 mt-1">{template.description}</p>
                          <div class="mt-2 text-xs text-gray-500">Match Score: {Math.round(template.score * 100)}%</div>
                        </div>
                        <button onclick={() => onSelectTemplate(template)} class="mt-4 w-full bg-indigo-600 text-white rounded py-2 text-sm hover:bg-indigo-700">Use Template</button>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}

              <div>
                <h4 class="text-md font-semibold text-gray-700 mb-2">All Templates</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {#each otherTemplates as template}
                    <div class="border rounded-lg p-4 flex flex-col justify-between">
                      <div>
                        <div class="text-2xl mb-2">{template.icon}</div>
                        <h5 class="font-bold text-gray-900">{template.name}</h5>
                        <p class="text-sm text-gray-600 mt-1">{template.description}</p>
                      </div>
                      <button onclick={() => onSelectTemplate(template)} class="mt-4 w-full bg-gray-100 text-gray-800 rounded py-2 text-sm hover:bg-gray-200">Use Template</button>
                    </div>
                  {/each}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
        <button type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onclick={onClose}>
          Close
        </button>
      </div>
    </div>
  </div>
</div>
