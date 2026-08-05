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

      <a href="/devtools/pcap" class="block p-6 bg-slate-800 rounded-lg border border-slate-700 hover:border-blue-500 transition-colors">
        <div class="flex items-center mb-3">
          <svg class="w-8 h-8 text-emerald-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
          <h2 class="text-xl font-semibold text-white">PCAP Network Analyzer</h2>
        </div>
        <p class="text-slate-400 text-sm">Analyze Wireshark packet captures entirely in your browser without uploading sensitive network data anywhere.</p>
      </a>

      <a href="/devtools/api-client" class="block p-6 bg-slate-800 rounded-lg border border-slate-700 hover:border-blue-500 transition-colors">
        <div class="flex items-center mb-3">
          <svg class="w-8 h-8 text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          <h2 class="text-xl font-semibold text-white">API Client</h2>
        </div>
        <p class="text-slate-400 text-sm">Test REST and GraphQL endpoints entirely locally with request history stored in SQLite.</p>
      </a>

      <a href="/devtools/regex-tester" class="block p-6 bg-slate-800 rounded-lg border border-slate-700 hover:border-blue-500 transition-colors">
        <div class="flex items-center mb-3">
          <svg class="w-8 h-8 text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
          </svg>
          <h2 class="text-xl font-semibold text-white">Regex Tester</h2>
        </div>
        <p class="text-slate-400 text-sm">Offline regular expression testing and debugging. Ensure proprietary data never leaves your browser.</p>
      </a>

      <!-- Future devtools links can go here -->
    </div>
  </div>
</div>
