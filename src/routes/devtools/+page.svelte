<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { workspaceStore } from '$lib/stores/workspace.store.svelte';

    onMount(() => {
        workspaceStore.setActiveWorkspace({
            id: 'devtools',
            type: 'devtools',
            title: 'DevTools'
        });
        goto('/', { replaceState: true });
    });
</script>
