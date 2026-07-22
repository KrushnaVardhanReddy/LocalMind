<script lang="ts">
  import { onMount } from 'svelte';
  import JsonFormatter from './JsonFormatter.svelte';
  import JwtInspector from './JwtInspector.svelte';
  import Base64Encoder from './Base64Encoder.svelte';

  let activeTab: 'json' | 'jwt' | 'base64' = 'json';
</script>

<div class="flex flex-col h-full bg-slate-900 text-slate-200">
  <div class="p-6 border-b border-slate-700 bg-slate-800">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold text-white mb-2">Data Formatters</h1>
        <p class="text-slate-400">Instantly format, validate, and decode offline.</p>
      </div>
      <a href="/devtools" class="text-blue-400 hover:text-blue-300 text-sm flex items-center">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Back to Hub
      </a>
    </div>

    <!-- Tabs -->
    <div class="flex space-x-1 border-b border-slate-700">
      <button
        class="px-4 py-2 text-sm font-medium focus:outline-none {activeTab === 'json' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-t-lg'}"
        on:click={() => activeTab = 'json'}
      >
        JSON Formatter
      </button>
      <button
        class="px-4 py-2 text-sm font-medium focus:outline-none {activeTab === 'jwt' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-t-lg'}"
        on:click={() => activeTab = 'jwt'}
      >
        JWT Inspector
      </button>
      <button
        class="px-4 py-2 text-sm font-medium focus:outline-none {activeTab === 'base64' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-t-lg'}"
        on:click={() => activeTab = 'base64'}
      >
        Base64 Encoder
      </button>
    </div>
  </div>

  <div class="flex-1 overflow-hidden">
    {#if activeTab === 'json'}
      <JsonFormatter />
    {:else if activeTab === 'jwt'}
      <JwtInspector />
    {:else if activeTab === 'base64'}
      <Base64Encoder />
    {/if}
  </div>
</div>
