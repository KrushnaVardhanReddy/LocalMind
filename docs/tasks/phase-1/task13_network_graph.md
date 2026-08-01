# Task 13: Network & Graph Visualizer

## Objective
Analyze complex entity relationships (nodes and edges) locally from CSV data using DuckDB and Cytoscape.js/Sigma.js.

## Implementation Steps
1. **Data Parsing:** Allow user to select a source table/CSV and specify `source` and `target` columns.
2. **UI Engine:** Create `src/routes/analytics/network/+page.svelte`.
   - Integrate a graph library (like Cytoscape.js or Sigma.js) to render large networks (10k+ nodes) using WebGL.
3. **Analytics:** Calculate node degrees, clustering coefficients, and run community detection algorithms (e.g., Louvain) in JS/WASM.
4. **Interactivity:** Allow zooming, filtering edges by weight, and inspecting node metadata.

## Definition of Done
- A user can map two columns to nodes/edges and see an interactive force-directed graph.
- The graph handles at least 10,000 nodes smoothly.
