<script lang="ts">
    import { onMount } from "svelte";
    import { workspaceStore } from "$lib/stores/workspace.store.svelte";
    import NetworkVisualizer from "$lib/components/analytics/NetworkVisualizer.svelte";

    onMount(() => {
        workspaceStore.setActiveWorkspace({
            id: "network",
            type: "custom",
            title: "Network Graph"
        });
    });
</script>

<svelte:head>
  <title>LocalMind Network Graph</title>
</svelte:head>

<div class="h-full w-full bg-white dark:bg-gray-900 p-6 overflow-y-auto">
    <NetworkVisualizer />
</div>
