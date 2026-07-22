<script lang="ts">
  let mode: 'encode' | 'decode' = 'encode';
  let inputRaw = '';
  let outputResult = '';
  let errorMsg = '';
  let isDataUrl = false;
  let decodedMimeType = '';
  let decodedBlobUrl = '';

  let inputLength = 0;
  let outputLength = 0;

  function getRatio() {
    if (inputLength === 0) return '0%';
    const ratio = ((outputLength / inputLength) * 100).toFixed(1);
    return `${ratio}%`;
  }

  function processBase64() {
    errorMsg = '';
    outputResult = '';
    isDataUrl = false;
    decodedMimeType = '';

    if (decodedBlobUrl) {
      URL.revokeObjectURL(decodedBlobUrl);
      decodedBlobUrl = '';
    }

    inputLength = inputRaw.length;

    if (!inputRaw.trim()) {
      outputLength = 0;
      return;
    }

    try {
      if (mode === 'encode') {
        // If inputRaw is a data URL (from drag and drop), just use it directly for output
        if (inputRaw.startsWith('data:')) {
          outputResult = inputRaw;
          outputLength = outputResult.length;
        } else {
          outputResult = btoa(unescape(encodeURIComponent(inputRaw)));
          outputLength = outputResult.length;
        }
      } else {
        // Decode
        let strToDecode = inputRaw.trim();

        // Detect Data URL
        const dataUrlMatch = strToDecode.match(/^data:([^;]+);base64,(.+)$/);
        if (dataUrlMatch) {
          isDataUrl = true;
          decodedMimeType = dataUrlMatch[1];
          strToDecode = dataUrlMatch[2];
        }

        let isBinary = false;
        try {
          const decodedStr = decodeURIComponent(escape(atob(strToDecode)));
          outputResult = decodedStr;
          outputLength = outputResult.length;

          if (/[^\x20-\x7E\t\r\n]/.test(decodedStr)) {
             isBinary = true;
          }
        } catch (e) {
          // If URI decoding fails, it's definitely binary data
          outputResult = "[Binary Data - Please Download]";
          outputLength = 0;
          isBinary = true;
        }

        // If it was a data url or might be binary, prep a download
        if (isDataUrl || isBinary) {
           // It's likely binary data or explicitly a data URL
           const byteString = atob(strToDecode);
           const ab = new ArrayBuffer(byteString.length);
           const ia = new Uint8Array(ab);
           for (let i = 0; i < byteString.length; i++) {
               ia[i] = byteString.charCodeAt(i);
           }
           const blob = new Blob([ab], { type: decodedMimeType || 'application/octet-stream' });
           decodedBlobUrl = URL.createObjectURL(blob);
        }
      }
    } catch (e: any) {
      errorMsg = `Failed to ${mode}: ${e.message}`;
      outputLength = 0;
    }
  }

  function handleInput() {
    processBase64();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'Enter') {
      processBase64();
    }
  }

  function toggleMode(newMode: 'encode' | 'decode') {
    mode = newMode;
    const temp = inputRaw;
    inputRaw = outputResult;
    processBase64();
  }

  // File Drop Handling (Encode Mode)
  let isDragging = false;

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    if (mode === 'encode') isDragging = true;
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;

    if (mode !== 'encode') return;

    const file = e.dataTransfer?.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          inputRaw = event.target.result as string; // Will be a data URL
          processBase64();
        }
      };
      reader.readAsDataURL(file);
    }
  }

</script>

<div class="flex flex-col h-full w-full p-4">

  <div class="flex items-center mb-4 space-x-4">
    <div class="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
      <button
        class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors {mode === 'encode' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}"
        on:click={() => toggleMode('encode')}
      >
        Encode
      </button>
      <button
        class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors {mode === 'decode' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}"
        on:click={() => toggleMode('decode')}
      >
        Decode
      </button>
    </div>

    <div class="text-sm text-slate-400 flex space-x-4">
      <span>Input: {inputLength} chars</span>
      <span>Output: {outputLength} chars</span>
      <span>Ratio: {getRatio()}</span>
    </div>
  </div>

  <div class="flex h-full w-full space-x-4 pb-12">
    <!-- Input Panel -->
    <div
      class="flex-1 flex flex-col relative"
      on:dragover={onDragOver}
      on:dragleave={onDragLeave}
      on:drop={onDrop}
      role="region"
      aria-label="Drag and drop area"
    >
      <h3 class="font-semibold text-slate-300 mb-2">Input {mode === 'encode' ? '(Text or Drop File)' : '(Base64)'}</h3>
      <textarea
        bind:value={inputRaw}
        on:input={handleInput}
        on:keydown={handleKeydown}
        class="flex-1 bg-slate-950 text-slate-300 p-3 rounded font-mono text-sm border {isDragging ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700'} focus:outline-none focus:border-blue-500 resize-none"
        placeholder={mode === 'encode' ? 'Type text or drop a file here to encode... (Ctrl+Enter to process)' : 'Paste Base64 string here... (Ctrl+Enter to process)'}
      ></textarea>

      {#if isDragging}
        <div class="absolute inset-0 top-8 bg-blue-900/50 border-2 border-dashed border-blue-400 rounded flex items-center justify-center pointer-events-none">
          <p class="text-blue-200 font-semibold text-lg">Drop file to encode to Data URL</p>
        </div>
      {/if}
    </div>

    <!-- Output Panel -->
    <div class="flex-1 flex flex-col">
       <div class="flex justify-between items-center mb-2">
        <h3 class="font-semibold text-slate-300">Output {isDataUrl ? `(${decodedMimeType})` : ''}</h3>

        {#if decodedBlobUrl}
          <a href={decodedBlobUrl} download="decoded_file" class="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Download File
          </a>
        {/if}
      </div>

      {#if errorMsg}
        <div class="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-400 rounded text-sm">
          {errorMsg}
        </div>
      {/if}

      <div class="flex-1 bg-slate-900 rounded border border-slate-800 p-4 relative overflow-hidden flex flex-col">
        {#if isDataUrl && decodedMimeType.startsWith('image/')}
           <!-- Render image if it's an image data URL in Decode mode -->
           <div class="flex-1 overflow-auto flex items-center justify-center bg-slate-950 rounded">
             <img src={inputRaw} alt="Decoded" class="max-w-full max-h-full object-contain" />
           </div>
        {:else if isDataUrl && mode === 'encode'}
            <textarea readonly class="flex-1 bg-transparent text-slate-300 font-mono text-sm resize-none focus:outline-none w-full h-full" value={outputResult}></textarea>
        {:else}
          <textarea readonly class="flex-1 bg-transparent text-slate-300 font-mono text-sm resize-none focus:outline-none w-full h-full" value={outputResult}></textarea>
        {/if}
      </div>
    </div>
  </div>

</div>
