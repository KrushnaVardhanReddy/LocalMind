<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { workspaceStore } from '$lib/stores/workspace.store.svelte';

    onMount(() => {
        workspaceStore.setActiveWorkspace({
            id: 'analytics',
            type: 'analytics',
            title: 'Analytics'
        });
        goto('/', { replaceState: true });
    });
</script>
