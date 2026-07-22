<script lang="ts">
  import { onMount } from 'svelte';
  import hljs from 'highlight.js/lib/core';
  import json from 'highlight.js/lib/languages/json';
  import DOMPurify from 'dompurify';

  hljs.registerLanguage('json', json);

  let inputRaw = '';
  let headerHtml = '';
  let payloadHtml = '';
  let errorMsg = '';
  let expiryMsg = '';
  let isExpired = false;

  function base64UrlDecode(str: string) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

  function processJwt() {
    headerHtml = '';
    payloadHtml = '';
    errorMsg = '';
    expiryMsg = '';
    isExpired = false;

    const token = inputRaw.trim();
    if (!token) return;

    const parts = token.split('.');
    if (parts.length !== 3) {
      errorMsg = 'Invalid JWT format. Expected 3 parts separated by dots.';
      return;
    }

    try {
      const headerStr = base64UrlDecode(parts[0]);
      const headerObj = JSON.parse(headerStr);
      const formattedHeader = JSON.stringify(headerObj, null, 2);
      headerHtml = DOMPurify.sanitize(hljs.highlight(formattedHeader, { language: 'json' }).value);

      const payloadStr = base64UrlDecode(parts[1]);
      const payloadObj = JSON.parse(payloadStr);
      const formattedPayload = JSON.stringify(payloadObj, null, 2);
      payloadHtml = DOMPurify.sanitize(hljs.highlight(formattedPayload, { language: 'json' }).value);

      if (payloadObj.exp) {
        const expDate = new Date(payloadObj.exp * 1000);
        const now = new Date();
        const diffMs = now.getTime() - expDate.getTime();

        isExpired = diffMs > 0;

        if (isExpired) {
           const mins = Math.floor(diffMs / 60000);
           expiryMsg = `Expired ${mins} minutes ago (${expDate.toLocaleString()})`;
        } else {
           expiryMsg = `Expires at ${expDate.toLocaleString()}`;
        }
      }

    } catch (e: any) {
      errorMsg = `Failed to parse JWT: ${e.message}`;
    }
  }

  function handleInput() {
    processJwt();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'Enter') {
      processJwt();
    }
  }

</script>

<div class="flex flex-col h-full w-full p-4 overflow-auto">

  <div class="mb-4">
    <h3 class="font-semibold text-slate-300 mb-2">Raw JWT</h3>
    <textarea
      bind:value={inputRaw}
      on:input={handleInput}
      on:keydown={handleKeydown}
      class="w-full h-24 bg-slate-950 text-slate-300 p-3 rounded font-mono text-sm border {errorMsg ? 'border-red-500' : 'border-slate-700'} focus:outline-none focus:border-blue-500 resize-none break-all"
      placeholder="Paste JWT here... (Ctrl+Enter to process)"
    ></textarea>
  </div>

  {#if errorMsg}
    <div class="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-400 rounded text-sm">
      {errorMsg}
    </div>
  {/if}

  {#if headerHtml || payloadHtml}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">

      <!-- Decoded Info -->
      <div class="flex flex-col space-y-4">
        <div class="flex-1 flex flex-col">
          <h3 class="font-semibold text-slate-300 mb-2">Header</h3>
          <div class="flex-1 bg-slate-950 rounded border border-slate-800 p-4 overflow-auto">
            <pre class="m-0 text-sm font-mono"><code class="hljs language-json">{@html headerHtml}</code></pre>
          </div>
        </div>

        <div class="flex-1 flex flex-col">
          <h3 class="font-semibold text-slate-300 mb-2 flex justify-between items-center">
            Payload
            {#if expiryMsg}
              <span class="text-xs px-2 py-1 rounded font-normal {isExpired ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}">
                {expiryMsg}
              </span>
            {/if}
          </h3>
          <div class="flex-1 bg-slate-950 rounded border border-slate-800 p-4 overflow-auto">
             <pre class="m-0 text-sm font-mono"><code class="hljs language-json">{@html payloadHtml}</code></pre>
          </div>
        </div>
      </div>

      <!-- Signature Status -->
      <div class="flex flex-col">
        <h3 class="font-semibold text-slate-300 mb-2">Signature Status</h3>
        <div class="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded text-yellow-200 text-sm">
          <div class="flex items-start">
            <svg class="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <div>
              <p class="font-semibold mb-1">Cannot verify signature (no secret/key provided)</p>
              <p class="text-yellow-400/80">LocalMind parses and decodes the token structure locally, but cannot cryptographically verify if the signature is valid without the issuing server's private key or shared secret.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  {/if}

</div>
