<script lang="ts">
  import { SvelteFlow, Controls, Background, BackgroundVariant, SvelteFlowProvider, type Node, type Edge, useSvelteFlow } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import { NODE_DEFINITIONS, type NodeType } from '$lib/pipeline/nodes';
  import { PipelineEngine, type PipelineExecutionResult } from '$lib/pipeline/engine';
  import { WorkerManager } from '$lib/workers/WorkerManager';

  const engine = new PipelineEngine();

  // Nodes & Edges state
  let nodes = $state<Node[]>([]);
  let edges = $state<Edge[]>([]);

  let executionResult = $state<PipelineExecutionResult | null>(null);
  let isExecuting = $state(false);

  // Inspector
  let selectedNode = $state<Node | null>(null);

  // Example starter pipelines
  const starterPipelines = [
    {
      name: 'API Response Debugger',
      nodes: [
        { id: '1', type: 'input', data: { label: 'Input' }, position: { x: 50, y: 50 } },
        { id: '2', type: 'base64_decode', data: { label: 'Base64 Decode' }, position: { x: 250, y: 50 } },
        { id: '3', type: 'json_format', data: { label: 'Format JSON' }, position: { x: 450, y: 50 } },
        { id: '4', type: 'output', data: { label: 'Output' }, position: { x: 650, y: 50 } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
        { id: 'e3-4', source: '3', target: '4' }
      ]
    },
    {
      name: 'Log Line Parser',
      nodes: [
        { id: '1', type: 'input', data: { label: 'Input' }, position: { x: 50, y: 50 } },
        { id: '2', type: 'regex_extract', data: { label: 'Regex Extract', config: { regexPattern: 'ERROR: (.*)' } }, position: { x: 300, y: 50 } },
        { id: '3', type: 'output', data: { label: 'Output' }, position: { x: 550, y: 50 } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' }
      ]
    },
    {
      name: 'JWT Analyzer',
      nodes: [
         { id: '1', type: 'input', data: { label: 'Input' }, position: { x: 50, y: 50 } },
         { id: '2', type: 'jwt_decode', data: { label: 'JWT Decode' }, position: { x: 300, y: 50 } },
         { id: '3', type: 'output', data: { label: 'Output' }, position: { x: 550, y: 50 } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' }
      ]
    }
  ];

  // SQLite saving/loading
  let savedPipelines = $state<any[]>([]);

  async function loadSavedPipelines() {
     try {
       const sqlite = await WorkerManager.getSQLite();
       savedPipelines = await sqlite.listPipelines();
     } catch (e) {
       console.error("Failed to load saved pipelines", e);
     }
  }

  async function savePipeline(name: string) {
     try {
       const sqlite = await WorkerManager.getSQLite();
       await sqlite.savePipeline(name, JSON.stringify(nodes), JSON.stringify(edges));
       await loadSavedPipelines();
     } catch (e) {
       console.error("Failed to save pipeline", e);
     }
  }

  $effect(() => {
    loadSavedPipelines();
  });

  // Flow handlers
  function onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();

    const typeStr = event.dataTransfer?.getData('application/svelteflow');
    if (!typeStr) return;

    const type = typeStr as NodeType;
    const def = NODE_DEFINITIONS[type];

    // Get position - rough estimate without screenToFlowPosition available immediately
    const position = {
       x: event.clientX - 300, // offset sidebar
       y: event.clientY - 100
    };

    const newNode: Node = {
      id: crypto.randomUUID(),
      type,
      position,
      data: { label: def.label, config: {} }
    };

    nodes = [...nodes, newNode];
  }

  function onNodeClick(event: any) {
     selectedNode = event.node;
  }

  function onPaneClick() {
     selectedNode = null;
  }

  function updateNodeConfig(config: any) {
    if (!selectedNode) return;

    nodes = nodes.map(n => {
      if (n.id === selectedNode!.id) {
         return {
           ...n,
           data: {
             ...n.data,
             config: { ...((n.data.config as any) || {}), ...config }
           }
         };
      }
      return n;
    });

    // update local reference so inspector stays synced
    selectedNode = nodes.find(n => n.id === selectedNode!.id) || null;
  }

  function updateInputNodeData(inputData: string) {
    if (!selectedNode || selectedNode.type !== 'input') return;

    nodes = nodes.map(n => {
      if (n.id === selectedNode!.id) {
         return {
           ...n,
           data: {
             ...n.data,
             inputData
           }
         };
      }
      return n;
    });

    selectedNode = nodes.find(n => n.id === selectedNode!.id) || null;
  }

  async function runPipeline() {
     isExecuting = true;
     executionResult = null;

     // Find input node
     const inputNode = nodes.find(n => n.type === 'input');
     const inputData = (inputNode?.data?.inputData as string) || '';

     try {
       executionResult = await engine.execute(nodes, edges, inputData);
     } catch (e: any) {
       executionResult = {
         success: false,
         output: '',
         error: e.message,
         nodeExecutionLog: []
       };
     } finally {
       isExecuting = false;
     }
  }

  function loadExample(example: any) {
    nodes = example.nodes.map((n: any) => ({ ...n, id: crypto.randomUUID() }));
    // We need to remap edge IDs based on the new node IDs to be robust, but for hardcoded examples this works if IDs match
    nodes = example.nodes;
    edges = example.edges;
  }

  function onDragStart(event: DragEvent, nodeType: string) {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData('application/svelteflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }

</script>

<div class="flex h-full w-full bg-slate-900 text-slate-200">

  <!-- Sidebar Palette -->
  <div class="w-64 border-r border-slate-700 p-4 overflow-y-auto flex flex-col bg-slate-800">
     <h2 class="font-bold text-lg mb-4 text-white">Node Palette</h2>

     <div class="space-y-4">
       {#each Object.keys(NODE_DEFINITIONS) as key}
         {@const def = NODE_DEFINITIONS[key as NodeType]}
         <div
           class="p-2 border border-slate-600 rounded bg-slate-700 cursor-grab hover:bg-slate-600 hover:border-blue-400 transition-colors"
           draggable={true}
           ondragstart={(e) => onDragStart(e, def.type)}
         >
            <div class="font-semibold text-sm">{def.label}</div>
            <div class="text-xs text-slate-400">{def.category}</div>
         </div>
       {/each}
     </div>

     <hr class="border-slate-700 my-6" />

     <h2 class="font-bold text-lg mb-4 text-white">Starter Pipelines</h2>
     <div class="space-y-2">
       {#each starterPipelines as pipeline}
         <button class="w-full text-left p-2 border border-slate-600 rounded bg-slate-700 hover:bg-slate-600 transition-colors text-sm" onclick={() => loadExample(pipeline)}>
           {pipeline.name}
         </button>
       {/each}
     </div>

     {#if savedPipelines.length > 0}
       <hr class="border-slate-700 my-6" />
       <h2 class="font-bold text-lg mb-4 text-white">Saved Pipelines</h2>
       <div class="space-y-2">
         {#each savedPipelines as pipeline}
           <button class="w-full text-left p-2 border border-slate-600 rounded bg-slate-700 hover:bg-slate-600 transition-colors text-sm" onclick={() => {
             nodes = JSON.parse(pipeline.nodes);
             edges = JSON.parse(pipeline.edges);
           }}>
             {pipeline.name}
           </button>
         {/each}
       </div>
     {/if}
  </div>

  <!-- Main Area -->
  <div class="flex-1 flex flex-col">
     <!-- Canvas Toolbar -->
     <div class="h-14 border-b border-slate-700 flex items-center px-4 justify-between bg-slate-800">
       <div class="font-semibold">Pipeline Builder</div>
       <div class="space-x-2 flex">
          <button class="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors" onclick={() => savePipeline(`Pipeline ${Date.now()}`)}>
            Save Pipeline
          </button>
          <button
             class="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white font-medium flex items-center transition-colors disabled:opacity-50"
             onclick={runPipeline}
             disabled={isExecuting}
          >
            {#if isExecuting}
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Running...
            {:else}
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Run Pipeline
            {/if}
          </button>
       </div>
     </div>

     <!-- Canvas -->
     <div class="flex-1 relative" role="region" aria-label="Pipeline Canvas" ondragover={onDragOver} ondrop={onDrop}>
        <SvelteFlowProvider>
          <SvelteFlow
            bind:nodes={nodes}
            bind:edges={edges}
            onnodeclick={onNodeClick}
            onpaneclick={onPaneClick}
            fitView
            class="bg-slate-950"
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} bgColor="#020617" />
          </SvelteFlow>
        </SvelteFlowProvider>

        <!-- Inspector Panel Overlay -->
        {#if selectedNode}
          <div class="absolute top-4 right-4 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl flex flex-col overflow-hidden">
             <div class="p-3 border-b border-slate-600 flex justify-between items-center bg-slate-700">
               <h3 class="font-bold text-white">{selectedNode.data.label} (Inspector)</h3>
               <button onclick={() => selectedNode = null} class="text-slate-400 hover:text-white">&times;</button>
             </div>
             <div class="p-4 flex-1 overflow-y-auto">
               <p class="text-xs text-slate-400 mb-4">{NODE_DEFINITIONS[selectedNode.type as NodeType]?.description}</p>

               {#if selectedNode.type === 'input'}
                 <div class="mb-4">
                   <label class="block text-sm font-medium mb-1">Input Data</label>
                   <textarea
                     class="w-full h-32 bg-slate-900 border border-slate-600 rounded p-2 text-sm font-mono text-slate-300"
                     value={(selectedNode.data.inputData as string) || ''}
                     oninput={(e) => updateInputNodeData(e.currentTarget.value)}
                     placeholder="Enter raw text here..."
                   ></textarea>
                 </div>
               {/if}

               {#if selectedNode.type === 'regex_extract'}
                 <div class="mb-4">
                   <label class="block text-sm font-medium mb-1">Regex Pattern</label>
                   <input
                     type="text"
                     class="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm font-mono text-slate-300"
                     value={((selectedNode.data.config as any)?.regexPattern as string) || ''}
                     oninput={(e) => updateNodeConfig({ regexPattern: e.currentTarget.value })}
                     placeholder="e.g. \d+"
                   />
                 </div>
               {/if}

               <!-- Add more node-specific config fields here -->

               <button
                 class="mt-4 w-full px-3 py-1 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 rounded transition-colors text-sm"
                 onclick={() => {
                   nodes = nodes.filter(n => n.id !== selectedNode!.id);
                   edges = edges.filter(e => e.source !== selectedNode!.id && e.target !== selectedNode!.id);
                   selectedNode = null;
                 }}
               >
                 Delete Node
               </button>
             </div>
          </div>
        {/if}
     </div>

     <!-- Terminal Panel -->
     <div class="h-64 border-t border-slate-700 bg-slate-950 flex flex-col">
       <div class="px-4 py-2 border-b border-slate-800 flex justify-between items-center bg-slate-900">
         <h3 class="font-bold text-sm text-slate-300 uppercase tracking-wider">Terminal Output</h3>
         {#if executionResult}
           <span class="text-xs font-semibold px-2 py-0.5 rounded {executionResult.success ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}">
             {executionResult.success ? 'SUCCESS' : 'FAILED'}
           </span>
         {/if}
       </div>
       <div class="flex-1 p-4 overflow-y-auto font-mono text-sm">
         {#if !executionResult}
            <div class="text-slate-600 italic">No output yet. Click 'Run Pipeline' to execute.</div>
         {:else}
            {#if executionResult.error}
              <div class="text-red-400 mb-4 whitespace-pre-wrap">Error: {executionResult.error}</div>
            {/if}

            <div class="text-slate-500 mb-4 text-xs">
              <strong>Execution Log:</strong><br/>
              {#each executionResult.nodeExecutionLog as log}
                <div>
                   [{log.success ? 'OK' : 'FAIL'}] {log.nodeType} ({log.durationMs.toFixed(2)}ms) {log.error ? `- ${log.error}` : ''}
                </div>
              {/each}
            </div>

            <div class="text-slate-300 whitespace-pre-wrap break-all">
               {#if typeof executionResult.output === 'string'}
                 {executionResult.output}
               {:else}
                 [Binary Output: {executionResult.output.length} bytes]
               {/if}
            </div>
         {/if}
       </div>
     </div>
  </div>

</div>
