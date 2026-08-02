TASK: Phase 1 — Task 13: Network & Graph Visualizer

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Analyze complex entity relationships (nodes and edges) locally from CSV data using DuckDB and ECharts (or a specialized library like Cytoscape.js/Sigma.js if ECharts graph layout is insufficient).

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Performance: The graph handles at least 1,000 to 10,000 nodes smoothly.
- No backend processing. Must use WASM/JS for parsing and analytics.

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `src/routes/analytics/network/` (Target directory)
- `src/lib/components/ui/` (Existing UI components)

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
- Data Parsing: Allow user to select a source table/CSV and specify `source` and `target` columns.
- UI Engine: Create `src/routes/analytics/network/+page.svelte`.
- Interactivity: Allow zooming, filtering edges by weight, and inspecting node metadata.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `src/routes/analytics/network/+page.svelte`
2. NEW: `src/lib/components/analytics/NetworkVisualizer.svelte`

Commit: "feat: Phase 1 Task 13 Network Graph"
Target branch: feature/task13-network-graph
