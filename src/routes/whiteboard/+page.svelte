<script lang="ts">
  import { onMount } from 'svelte';
  import { WorkerManager } from '$lib/workers/WorkerManager';
  import type { WaSQLiteWorkerContract } from '$lib/contracts/wa_sqlite_contract';
  import ExcalidrawWrapper from '$lib/components/plugins/excalidraw/ui/ExcalidrawWrapper.svelte';
  import { workspaceStore } from '$lib/stores/workspace.store.svelte';

  interface Scene {
    id: string;
    name: string;
  }

  let scenes: Scene[] = $state([]);
  let activeSceneId: string | null = $state(null);
  let activeSceneData: any = $state(null);
  let isReady: boolean = $state(false);

  // Constants
  const WORKSPACE_ID = 'global-workspace';

  onMount(async () => {
    // Set active workspace
    workspaceStore.setActiveWorkspace({
      id: 'whiteboard',
      type: 'whiteboard',
      title: 'Whiteboard'
    });

    await fetchScenes();
    isReady = true;
  });

  async function fetchScenes() {
    const sqlite = (await WorkerManager.getSQLite()) as WaSQLiteWorkerContract;
    const scenesList = await sqlite.listWhiteboardScenes(WORKSPACE_ID);
    scenes = scenesList || [];
  }

  async function createNewBoard() {
    const id = crypto.randomUUID();
    const sqlite = (await WorkerManager.getSQLite()) as WaSQLiteWorkerContract;

    await sqlite.saveWhiteboardScene(id, WORKSPACE_ID, `New Board ${scenes.length + 1}`, JSON.stringify({ elements: [], appState: {} }));

    await fetchScenes();
    await loadScene(id);
  }

  async function loadScene(id: string) {
    const sqlite = (await WorkerManager.getSQLite()) as WaSQLiteWorkerContract;
    const scene = await sqlite.getWhiteboardScene(id);

    // Changing activeSceneId triggers a re-render of the wrapper via #key
    activeSceneId = id;
    if (scene && scene.scene_data) {
        activeSceneData = JSON.parse(scene.scene_data);
    } else {
        activeSceneData = { elements: [], appState: {} };
    }
  }

  async function deleteScene(id: string) {
    if (!confirm('Are you sure you want to delete this board?')) return;
    const sqlite = (await WorkerManager.getSQLite()) as WaSQLiteWorkerContract;

    await sqlite.deleteWhiteboardScene(id);

    if (activeSceneId === id) {
      activeSceneId = null;
      activeSceneData = null;
    }
    await fetchScenes();
  }

  const onSceneChange = async (elements: readonly any[], appState: any) => {
    if (!activeSceneId) return;
    const sqlite = (await WorkerManager.getSQLite()) as WaSQLiteWorkerContract;

    const current = await sqlite.getWhiteboardScene(activeSceneId);
    if (current) {
        await sqlite.saveWhiteboardScene(activeSceneId, WORKSPACE_ID, current.name, JSON.stringify({ elements, appState }));
    }
  };

  async function renameScene(id: string, currentName: string) {
      const newName = prompt("Rename board:", currentName);
      if (!newName || newName === currentName) return;

      const sqlite = (await WorkerManager.getSQLite()) as WaSQLiteWorkerContract;
      const current = await sqlite.getWhiteboardScene(id);
      if (current) {
          await sqlite.saveWhiteboardScene(id, WORKSPACE_ID, newName, current.scene_data);
      }

      await fetchScenes();
  }
</script>

<div class="flex h-full w-full bg-white dark:bg-gray-900">
  <!-- Sidebar -->
  <div class="w-64 bg-slate-50 dark:bg-gray-800 border-r border-slate-200 dark:border-gray-700 flex flex-col flex-none">
    <div class="p-4 border-b border-slate-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-slate-800 dark:text-gray-200">My Boards</h2>
      <button
        class="mt-3 w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 transition disabled:opacity-50"
        onclick={createNewBoard}
      >
        + New Board
      </button>
    </div>

    <div class="flex-1 overflow-y-auto">
      {#each scenes as scene}
        <div class="flex justify-between items-center p-3 border-b border-slate-100 dark:border-gray-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-gray-700 {activeSceneId === scene.id ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''}"
             role="button"
             tabindex="0"
             onclick={() => loadScene(scene.id)}
             onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') loadScene(scene.id); }}>
          <span class="truncate flex-1 font-medium text-slate-700 dark:text-gray-300" title={scene.name}>{scene.name}</span>
          <div class="flex space-x-2 ml-2">
             <button class="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition" aria-label="Rename" onclick={(e) => { e.stopPropagation(); renameScene(scene.id, scene.name); }}>✎</button>
             <button class="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition" aria-label="Delete" onclick={(e) => { e.stopPropagation(); deleteScene(scene.id); }}>🗑</button>
          </div>
        </div>
      {/each}
      {#if scenes.length === 0 && isReady}
        <div class="p-6 text-sm text-slate-500 dark:text-gray-400 text-center">No boards yet. Create one to start sketching.</div>
      {/if}
    </div>
  </div>

  <!-- Main Content -->
  <div class="flex-1 h-full relative">
    {#if !isReady}
       <div class="flex items-center justify-center h-full text-slate-500 dark:text-gray-400">Initializing workspace...</div>
    {:else if activeSceneId}
       {#key activeSceneId}
         <ExcalidrawWrapper
            initialData={activeSceneData}
            onChange={onSceneChange}
         />
       {/key}
    {:else}
       <div class="flex items-center justify-center h-full text-slate-500 dark:text-gray-400 text-lg">Select or create a board from the sidebar to start drawing.</div>
    {/if}
  </div>
</div>
