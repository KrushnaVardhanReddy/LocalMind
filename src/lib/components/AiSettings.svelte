<script lang="ts">
  import { aiSettings } from '$lib/stores/aiSettingsStore';

  let isOpen = false;

  function toggleModal() {
    isOpen = !isOpen;
  }
</script>

<div>
  <button
    on:click={toggleModal}
    class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow flex items-center gap-2"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287-.947c.886.54 2.042.061 2.287-.947 1.56-.379 1.56-2.6 0-2.978a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
    </svg>
    AI Settings
  </button>
</div>

{#if isOpen}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
    <div class="relative p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">AI Configuration</h3>

        <div class="mb-4">
          <label class="flex items-center space-x-3">
            <input
              type="checkbox"
              bind:checked={$aiSettings.aiEnabled}
              class="form-checkbox h-5 w-5 text-blue-600"
            />
            <span class="text-gray-700 font-medium">Enable AI Features</span>
          </label>
          <p class="text-sm text-gray-500 mt-1">When disabled, all AI elements are hidden.</p>
        </div>

        {#if $aiSettings.aiEnabled}
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="apiKey">API Key</label>
              <input
                id="apiKey"
                type="password"
                bind:value={$aiSettings.apiKey}
                placeholder="sk-..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="endpoint">Endpoint URL</label>
              <input
                id="endpoint"
                type="text"
                bind:value={$aiSettings.endpoint}
                placeholder="https://api.openai.com/v1"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="model">Model</label>
              <input
                id="model"
                type="text"
                bind:value={$aiSettings.model}
                placeholder="gpt-4o-mini"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        {/if}

        <div class="items-center px-4 py-3 mt-4 text-right">
          <button
            on:click={toggleModal}
            class="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
