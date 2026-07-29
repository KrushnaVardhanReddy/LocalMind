<script lang="ts">
  import { onMount } from 'svelte';
  import { WorkerManager } from '$lib/workers/WorkerManager';
  import ReactHost from '$lib/components/ReactHost.svelte';

  let scenes: any[] = $state([]);
  let activeSceneId: string | null = $state(null);
  let activeSceneData: any = $state(null);
  let isReady: boolean = $state(false);
  // Default to a global workspace id for whiteboard
  const WORKSPACE_ID = 'global-workspace';

  onMount(async () => {
    const sqlite = await WorkerManager.getSQLite();
    await fetchScenes();
    isReady = true;
  });

  async function fetchScenes() {
    const sqlite = await WorkerManager.getSQLite();
    scenes = await sqlite.listWhiteboardScenes(WORKSPACE_ID);
  }

  async function createNewBoard() {
    const id = crypto.randomUUID();
    const sqlite = await WorkerManager.getSQLite();
    await sqlite.saveWhiteboardScene(id, WORKSPACE_ID, `New Board ${scenes.length + 1}`, JSON.stringify({ elements: [], appState: {} }));
    await fetchScenes();
    await loadScene(id);
  }

  async function loadScene(id: string) {
    const sqlite = await WorkerManager.getSQLite();
    const scene = await sqlite.getWhiteboardScene(id);
    if (scene) {
      activeSceneId = scene.id;
      // ExcalidrawWrapper expects elements/appState
      activeSceneData = JSON.parse(scene.scene_data);
    }
  }

  async function deleteScene(id: string) {
    const sqlite = await WorkerManager.getSQLite();
    await sqlite.deleteWhiteboardScene(id);
    if (activeSceneId === id) {
      activeSceneId = null;
      activeSceneData = null;
    }
    await fetchScenes();
  }

  const onSceneChange = async (elements: any[], appState: any) => {
    if (!activeSceneId) return;
    const sqlite = await WorkerManager.getSQLite();
    // Re-fetch current scene to get name, or we can just update scene_data
    const current = await sqlite.getWhiteboardScene(activeSceneId);
    if (current) {
       await sqlite.saveWhiteboardScene(activeSceneId, WORKSPACE_ID, current.name, JSON.stringify({ elements, appState: {} }));
       // Don't refetch scenes here to avoid losing focus
    }
  };

  async function renameScene(id: string, currentName: string) {
      const newName = prompt("Rename board:", currentName);
      if (!newName || newName === currentName) return;
      const sqlite = await WorkerManager.getSQLite();
      const current = await sqlite.getWhiteboardScene(id);
      if (current) {
          await sqlite.saveWhiteboardScene(id, WORKSPACE_ID, newName, current.scene_data);
          await fetchScenes();
      }
  }

</script>

<div class="flex h-screen w-full">
  <!-- Sidebar -->
  <div class="w-64 bg-slate-100 border-r border-slate-300 flex flex-col">
    <div class="p-4 border-b border-slate-300">
      <h2 class="text-lg font-semibold text-slate-800">My Boards</h2>
      <button
        class="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        onclick={createNewBoard}

      >
        + New Board
      </button>
    </div>

    <div class="flex-1 overflow-y-auto">
      {#each scenes as scene}
        <div class="flex justify-between items-center p-3 border-b border-slate-200 cursor-pointer hover:bg-slate-200 {activeSceneId === scene.id ? 'bg-blue-100' : ''}"
             role="button"
             tabindex="0"
             onclick={() => loadScene(scene.id)}
             onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') loadScene(scene.id); }}>
          <span class="truncate flex-1 font-medium text-slate-700" title={scene.name}>{scene.name}</span>
          <div class="flex space-x-1 ml-2">
             <button class="text-xs text-slate-500 hover:text-blue-600" onclick={(e) => { e.stopPropagation(); renameScene(scene.id, scene.name); }}>✎</button>
             <button class="text-xs text-slate-500 hover:text-red-600" onclick={(e) => { e.stopPropagation(); deleteScene(scene.id); }}>🗑</button>
          </div>
        </div>
      {/each}
      {#if scenes.length === 0 && isReady}
        <div class="p-4 text-sm text-slate-500 text-center">No boards yet.</div>
      {/if}
    </div>
  </div>

  <!-- Main Content -->
  <div class="flex-1 h-full bg-white relative">
    {#if !isReady}
       <div class="flex items-center justify-center h-full text-slate-500">Initializing...</div>
    {:else if activeSceneId && activeSceneData}
       {#key activeSceneId + "-" + Math.random()}
         <ReactHost
            component={null}
            props={{
               initialData: activeSceneData,
               onChange: onSceneChange
            }}
         />
       {/key}
    {:else}
       <div class="flex items-center justify-center h-full text-slate-500">Select or create a board to start drawing.</div>
    {/if}
  </div>
</div>
