<script lang="ts">
  // DevTools Hub Page
</script>

<div class="flex flex-col h-full bg-slate-900 text-slate-200">
  <div class="p-6 border-b border-slate-700 bg-slate-800">
    <h1 class="text-2xl font-bold text-white mb-2">DevTools Hub</h1>
    <p class="text-slate-400">Offline developer utilities running entirely in your browser.</p>
  </div>

  <div class="p-6 flex-1 overflow-auto">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <a href="/devtools/formatters" class="block p-6 bg-slate-800 rounded-lg border border-slate-700 hover:border-blue-500 transition-colors">
        <div class="flex items-center mb-3">
          <svg class="w-8 h-8 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
          </svg>
          <h2 class="text-xl font-semibold text-white">Data Formatters</h2>
        </div>
        <p class="text-slate-400 text-sm">JSON formatting and validation, JWT inspection, and Base64 encoding/decoding. All processing happens locally.</p>
      </a>

      <!-- Future devtools links can go here -->
    </div>
  </div>
</div>
