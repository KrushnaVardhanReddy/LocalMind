<script lang="ts">
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import type { ParseResult, CodeSymbol } from '$lib/workers/treesitter.worker';

    let isDragging = false;
    let loading = false;
    let error: string | null = null;
    let parseResult: ParseResult | null = null;
    let filename = '';

    // Convert flat symbol list into a tree structure
    interface TreeNode {
        symbol: CodeSymbol;
        children: TreeNode[];
        expanded: boolean;
    }

    let symbolTree: TreeNode[] = [];

    function buildSymbolTree(symbols: CodeSymbol[]): TreeNode[] {
        // Sort by start line so methods appear within classes naturally, or just iterate
        const sorted = [...symbols].sort((a, b) => a.startLine - b.startLine);

        const rootNodes: TreeNode[] = [];
        const classes: TreeNode[] = [];

        // First pass: identify classes
        for (const sym of sorted) {
            if (sym.kind === 'class') {
                const node = { symbol: sym, children: [], expanded: true };
                classes.push(node);
                rootNodes.push(node);
            }
        }

        // Second pass: assign methods to classes, others to root
        for (const sym of sorted) {
            if (sym.kind === 'class') continue; // already handled

            if (sym.kind === 'method') {
                // Find parent class by line range
                const parent = classes.find(c => sym.startLine >= c.symbol.startLine && sym.endLine <= c.symbol.endLine);
                if (parent) {
                    parent.children.push({ symbol: sym, children: [], expanded: false });
                } else {
                    // Method without class? Add to root
                    rootNodes.push({ symbol: sym, children: [], expanded: false });
                }
            } else {
                rootNodes.push({ symbol: sym, children: [], expanded: false });
            }
        }

        // Sort root nodes by line
        return rootNodes.sort((a, b) => a.symbol.startLine - b.symbol.startLine);
    }

    async function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
        error = null;

        const file = e.dataTransfer?.files[0];
        if (!file) return;

        filename = file.name;
        loading = true;
        parseResult = null;
        symbolTree = [];

        try {
            const text = await file.text();
            const worker = await WorkerManager.getTreeSitter();
            const result = await worker.parseFile(text, filename);
            parseResult = result;
            symbolTree = buildSymbolTree(result.symbols);
        } catch (err: any) {
            console.error(err);
            if (err.message && err.message.includes('Unsupported file extension')) {
                error = 'Language not supported';
            } else {
                error = err.message || 'Error parsing file';
            }
        } finally {
            loading = false;
        }
    }

    function toggleNode(node: TreeNode) {
        node.expanded = !node.expanded;
        symbolTree = [...symbolTree]; // trigger reactivity
    }

    function downloadJson() {
        if (!parseResult) return;
        const blob = new Blob([JSON.stringify(parseResult.symbols, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.symbols.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function getComplexityColor(complexity: number | undefined) {
        if (!complexity) return 'text-gray-500';
        if (complexity <= 5) return 'text-green-500';
        if (complexity <= 10) return 'text-yellow-500';
        return 'text-red-500';
    }
</script>

<svelte:head>
    <title>Code Analysis - LocalMind</title>
</svelte:head>

<div class="max-w-5xl mx-auto p-6 space-y-6">
    <div>
        <h1 class="text-3xl font-bold text-gray-900">Code Structure Analysis</h1>
        <p class="text-gray-500 mt-2">Drop a source file to extract its structure using local tree-sitter WASM.</p>
    </div>

    <!-- Drop Zone -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class="border-2 border-dashed rounded-lg p-12 text-center transition-colors {isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}"
        on:dragover|preventDefault={() => isDragging = true}
        on:dragleave={() => isDragging = false}
        on:drop={handleDrop}
    >
        {#if loading}
            <div class="flex flex-col items-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p class="text-gray-600">Parsing {filename}...</p>
            </div>
        {:else}
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <p class="mt-4 text-sm text-gray-600">
                Drag and drop a source file (.ts, .js, .py, .go, .java, .rs, .c, .cpp) here
            </p>
        {/if}
    </div>

    {#if error}
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-red-600 font-medium">{error}</p>
        </div>
    {/if}

    {#if parseResult}
        <div class="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div class="p-4 border-b bg-gray-50 flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <h2 class="font-semibold text-lg">{filename}</h2>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 uppercase">
                        {parseResult.language}
                    </span>
                    <span class="text-sm text-gray-500">
                        {parseResult.lineCount} lines • {parseResult.executionTimeMs.toFixed(1)}ms
                    </span>
                </div>
                <button
                    on:click={downloadJson}
                    class="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Download as JSON
                </button>
            </div>

            <div class="p-4">
                {#if symbolTree.length === 0}
                    <p class="text-gray-500 italic">No supported symbols found in this file.</p>
                {:else}
                    <ul class="space-y-1 font-mono text-sm">
                        {#each symbolTree as node}
                            <li>
                                <div class="flex items-center py-1 px-2 hover:bg-gray-50 rounded group">
                                    {#if node.children.length > 0}
                                        <button class="mr-2 text-gray-400 hover:text-gray-600 w-4 h-4 flex items-center justify-center" on:click={() => toggleNode(node)}>
                                            {node.expanded ? '▼' : '▶'}
                                        </button>
                                    {:else}
                                        <div class="w-4 mr-2"></div>
                                    {/if}

                                    <span class="font-semibold text-gray-700 mr-2 flex-1">
                                        {#if node.symbol.kind === 'class'}
                                            <span class="text-purple-600">class</span> {node.symbol.name}
                                        {:else if node.symbol.kind === 'function'}
                                            <span class="text-blue-600">function</span> {node.symbol.name}
                                        {:else if node.symbol.kind === 'import'}
                                            <span class="text-green-600">import</span> {node.symbol.name}
                                        {:else}
                                            {node.symbol.name}
                                        {/if}
                                    </span>

                                    <div class="flex space-x-4 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {#if node.symbol.complexity}
                                            <span class="font-medium {getComplexityColor(node.symbol.complexity)}" title="Cyclomatic Complexity">
                                                C: {node.symbol.complexity}
                                            </span>
                                        {/if}
                                        <span>L{node.symbol.startLine}-{node.symbol.endLine}</span>
                                    </div>
                                </div>

                                {#if node.expanded && node.children.length > 0}
                                    <ul class="ml-6 border-l pl-2 space-y-1 mt-1">
                                        {#each node.children as child}
                                            <li>
                                                <div class="flex items-center py-1 px-2 hover:bg-gray-50 rounded group">
                                                    <span class="text-gray-600 mr-2 flex-1">
                                                        <span class="text-yellow-600">method</span> {child.symbol.name}
                                                    </span>
                                                    <div class="flex space-x-4 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {#if child.symbol.complexity}
                                                            <span class="font-medium {getComplexityColor(child.symbol.complexity)}" title="Cyclomatic Complexity">
                                                                C: {child.symbol.complexity}
                                                            </span>
                                                        {/if}
                                                        <span>L{child.symbol.startLine}-{child.symbol.endLine}</span>
                                                    </div>
                                                </div>
                                            </li>
                                        {/each}
                                    </ul>
                                {/if}
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
        </div>
    {/if}
</div>
