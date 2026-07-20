<script lang="ts">
  import { onMount } from 'svelte';

  let worker: Worker;
  let selectedFile: File | null = null;
  let previewUrl: string | null = null;

  let status: string = 'Idle';
  let progress: number = 0;
  let extractedText: string | null = null;
  let confidence: number | null = null;
  let errorMsg: string | null = null;

  onMount(() => {
    worker = new Worker(new URL('$lib/workers/tesseract.worker.ts', import.meta.url), {
      type: 'module'
    });

    worker.onmessage = (e) => {
      const { id, success, data, error, progress: wProgress, status: wStatus } = e.data;

      if (!success) {
        status = 'Error';
        errorMsg = error;
        return;
      }

      if (wStatus === 'completed') {
        status = 'Completed';
        progress = 1;
        extractedText = data.text;
        confidence = data.confidence;
      } else {
        status = wStatus;
        if (wProgress !== undefined) {
           progress = wProgress;
        }
      }
    };

    return () => {
      worker.terminate();
    };
  });

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      selectedFile = input.files[0];
      previewUrl = URL.createObjectURL(selectedFile);
      extractedText = null;
      confidence = null;
      errorMsg = null;
      status = 'File selected. Ready to extract.';
      progress = 0;
    }
  }

  function extractText() {
    if (!selectedFile || !worker) return;

    status = 'Initializing...';
    progress = 0;
    extractedText = null;
    errorMsg = null;

    const id = crypto.randomUUID();
    worker.postMessage({
      id,
      action: 'EXTRACT_TEXT_OCR',
      payload: {
        file: selectedFile,
        language: 'eng'
      }
    });
  }

</script>

<main class="p-8">
  <div class="flex justify-between items-center mb-8">
    <h1 class="text-3xl font-bold">Document Workspace</h1>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div class="space-y-4">
      <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
        <label for="file-upload" class="cursor-pointer">
           <div class="text-gray-600">Click to upload an image for OCR</div>
           <input
             id="file-upload"
             type="file"
             accept="image/*"
             class="hidden"
             on:change={handleFileSelect}
           />
        </label>
      </div>

      {#if previewUrl}
        <div class="border rounded p-4 bg-gray-50 flex justify-center">
            <img src={previewUrl} alt="Preview" class="max-h-[500px] object-contain" />
        </div>

        <div class="flex justify-between items-center">
           <button
             class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
             on:click={extractText}
             disabled={status !== 'File selected. Ready to extract.' && status !== 'Completed' && status !== 'Error'}
           >
             Extract Text
           </button>

           <span class="text-sm text-gray-500 font-medium">Status: {status}</span>
        </div>
      {/if}

      {#if status !== 'Idle' && status !== 'File selected. Ready to extract.' && status !== 'Error' && status !== 'Completed'}
         <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style="width: {progress * 100}%"></div>
         </div>
      {/if}

      {#if errorMsg}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {errorMsg}
        </div>
      {/if}
    </div>

    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Extracted Text</h2>
      {#if extractedText}
        <div class="p-4 border rounded-lg bg-white min-h-[300px] whitespace-pre-wrap font-mono text-sm shadow-sm overflow-auto max-h-[700px]">
          {extractedText}
        </div>
        <div class="text-sm text-gray-500 text-right mt-2">
            Confidence: {confidence ? confidence.toFixed(2) : 0}%
        </div>
      {:else}
         <div class="p-4 border border-dashed rounded-lg bg-gray-50 text-gray-400 h-[300px] flex items-center justify-center">
           No text extracted yet
         </div>
      {/if}
    </div>
  </div>

</main>
