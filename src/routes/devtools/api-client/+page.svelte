<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { workspaceStore } from '$lib/stores/workspace.store.svelte';
    import ApiClient from '$lib/components/devtools/api-client/ApiClient.svelte';

    onMount(() => {
        workspaceStore.setActiveWorkspace({
            id: 'api-client',
            type: 'devtools', // Setting this ensures we load the devtools workspace, we need to maybe register this correctly.
            title: 'API Client'
        });
        goto('/', { replaceState: true });
    });
</script>

<ApiClient />
