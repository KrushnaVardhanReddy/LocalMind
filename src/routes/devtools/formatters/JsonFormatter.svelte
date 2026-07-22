<script lang="ts">
  import { onMount } from 'svelte';
  import hljs from 'highlight.js/lib/core';
  import json from 'highlight.js/lib/languages/json';
  import 'highlight.js/styles/github-dark.css';
  import DOMPurify from 'dompurify';
  import Ajv from 'ajv';

  hljs.registerLanguage('json', json);
  const ajv = new Ajv({ allErrors: true });

  let inputRaw = '';
  let schemaRaw = '';
  let formattedHtml = '';
  let validationError = '';
  let isMinified = false;
  let hasValidJson = false;

  let debounceTimer: ReturnType<typeof setTimeout>;

  function processJson() {
    validationError = '';
    formattedHtml = '';
    hasValidJson = false;

    if (!inputRaw.trim()) return;

    try {
      const parsed = JSON.parse(inputRaw);
      hasValidJson = true;

      // Formatting
      const formattedText = isMinified ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
      const highlighted = hljs.highlight(formattedText, { language: 'json' }).value;
      formattedHtml = DOMPurify.sanitize(highlighted);

      // Schema Validation
      if (schemaRaw.trim()) {
        try {
          const schema = JSON.parse(schemaRaw);
          const validate = ajv.compile(schema);
          const valid = validate(parsed);

          if (!valid && validate.errors) {
             validationError = validate.errors.map(err => `${err.instancePath || 'root'}: ${err.message}`).join('\n');
          }
        } catch (schemaErr: any) {
          validationError = `Invalid JSON Schema: ${schemaErr.message}`;
        }
      }

    } catch (err: any) {
      validationError = `Invalid JSON: ${err.message}`;
    }
  }

  function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      processJson();
    }, 100);
  }

  function format() {
    isMinified = false;
    processJson();

    // update the input with formatted version if valid
    if (hasValidJson && !validationError.startsWith('Invalid JSON Schema')) {
         try {
            inputRaw = JSON.stringify(JSON.parse(inputRaw), null, 2);
         } catch(e) {}
    }
  }

  function minify() {
    isMinified = true;
    processJson();

    if (hasValidJson && !validationError.startsWith('Invalid JSON Schema')) {
         try {
            inputRaw = JSON.stringify(JSON.parse(inputRaw));
         } catch(e) {}
    }
  }

  function clearAll() {
    inputRaw = '';
    schemaRaw = '';
    processJson();
  }

  async function copyToClipboard() {
    if (hasValidJson) {
      const parsed = JSON.parse(inputRaw);
      const textToCopy = isMinified ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
      try {
        await navigator.clipboard.writeText(textToCopy);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'Enter') {
      format();
    }
  }

</script>

<div class="flex h-full w-full">
  <!-- Left Panel: Inputs -->
  <div class="w-1/2 flex flex-col border-r border-slate-700 p-4">
    <div class="flex justify-between items-center mb-2">
      <h3 class="font-semibold text-slate-300">Input JSON</h3>
      <div class="space-x-2">
        <button on:click={format} class="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white">Format</button>
        <button on:click={minify} class="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white">Minify</button>
        <button on:click={clearAll} class="px-3 py-1 bg-red-900 hover:bg-red-800 rounded text-sm text-red-200">Clear</button>
      </div>
    </div>
    <textarea
      bind:value={inputRaw}
      on:input={handleInput}
      on:keydown={handleKeydown}
      class="flex-1 bg-slate-950 text-slate-300 p-3 rounded font-mono text-sm border {validationError && !hasValidJson ? 'border-red-500' : 'border-slate-700'} focus:outline-none focus:border-blue-500 resize-none mb-4"
      placeholder="Paste JSON here... (Ctrl+Enter to format)"
    ></textarea>

    <h3 class="font-semibold text-slate-300 mb-2">JSON Schema (Optional)</h3>
    <textarea
      bind:value={schemaRaw}
      on:input={handleInput}
      class="h-32 bg-slate-950 text-slate-300 p-3 rounded font-mono text-sm border border-slate-700 focus:outline-none focus:border-blue-500 resize-none"
      placeholder="Paste JSON Schema here..."
    ></textarea>
  </div>

  <!-- Right Panel: Output & Validation -->
  <div class="w-1/2 flex flex-col p-4 bg-slate-950">
     <div class="flex justify-between items-center mb-2">
      <h3 class="font-semibold text-slate-300">Output</h3>
      <button on:click={copyToClipboard} disabled={!hasValidJson} class="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded text-sm text-white flex items-center">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        Copy
      </button>
    </div>

    {#if validationError}
      <div class="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-400 rounded text-sm font-mono whitespace-pre-wrap overflow-auto max-h-32">
        {validationError}
      </div>
    {/if}

    <div class="flex-1 overflow-auto bg-slate-900 rounded border border-slate-800 p-4">
      {#if formattedHtml}
        <pre class="m-0 text-sm font-mono leading-relaxed"><code class="hljs language-json">{@html formattedHtml}</code></pre>
      {:else}
        <div class="h-full flex items-center justify-center text-slate-600 italic">
          Formatted JSON will appear here...
        </div>
      {/if}
    </div>
  </div>
</div>
