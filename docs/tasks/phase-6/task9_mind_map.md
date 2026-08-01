# Task 9: Local Mind Map & Brainstorm Canvas

## Objective
A dedicated, node-based mind mapping tool that autosaves to the `.lm` session file. Can be expanded by local LLMs.

## Implementation Steps
1. **UI Engine:** Create `src/routes/plugins/mindmap/+page.svelte` using `SvelteFlow` or similar for node connections.
2. **Interactivity:**
   - Users can create nodes, connect them with edges, and group them.
   - Support rich text inside nodes.
3. **AI Expansion (Optional Integration):** Select a node, click "Brainstorm", and the local LLM generates 3-5 child nodes.
4. **Storage:** Save the JSON graph state to `wa-sqlite`.

## Definition of Done
- Infinite canvas where users can build mind maps.
- Saves and restores seamlessly.
