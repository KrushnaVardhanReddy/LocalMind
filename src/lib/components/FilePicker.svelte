<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let fileInput: HTMLInputElement;
  let errorMsg: string | null = null;
  let isDragging = false;

  const supportedTypes = [
    { description: 'CSV Files', accept: { 'text/csv': ['.csv'] } },
    { description: 'JSON Files', accept: { 'application/json': ['.json'] } },
    { description: 'Parquet Files', accept: { 'application/octet-stream': ['.parquet'] } }
  ];

  async function handleFileSelect() {
    errorMsg = null;
    try {
      if ('showOpenFilePicker' in window) {
        const [fileHandle] = await (window as any).showOpenFilePicker({
          types: supportedTypes,
          excludeAcceptAllOption: false,
          multiple: false
        });
        const file = await fileHandle.getFile();
        dispatch('fileSelected', { file });
      } else {
        // Fallback to standard input
        fileInput.click();
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        errorMsg = `Error selecting file: ${error.message}`;
      }
    }
  }

  function handleInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      dispatch('fileSelected', { file });
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      dispatch('fileSelected', { file });
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }
</script>

<div
  class="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors {isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}"
  on:click={handleFileSelect}
  on:drop={handleDrop}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  role="button"
  tabindex="0"
  on:keydown={(e) => e.key === 'Enter' && handleFileSelect()}
>
  <div class="flex flex-col items-center space-y-2">
    <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
    </svg>
    <p class="text-lg text-gray-700 font-medium">Click to select a file</p>
    <p class="text-sm text-gray-500">or drag and drop here</p>
    <p class="text-xs text-gray-400 mt-2">Supports .csv, .json, .parquet</p>
  </div>
</div>

<!-- Fallback input (hidden) -->
<input
  type="file"
  bind:this={fileInput}
  on:change={handleInputChange}
  class="hidden"
  accept=".csv,.json,.parquet"
/>

{#if errorMsg}
  <div class="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
    {errorMsg}
  </div>
{/if}
