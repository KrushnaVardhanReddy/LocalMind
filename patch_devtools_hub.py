import sys

filename = "src/lib/components/workspace/panels/DevToolsWorkspace.svelte"
with open(filename, "r") as f:
    content = f.read()

if "Regex Tester" not in content:
    new_card = """
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
"""
    content = content.replace("<!-- Future devtools links can go here -->", new_card.strip())
    with open(filename, "w") as f:
        f.write(content)
