<script lang="ts">
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';
    import { onMount } from 'svelte';
    import { APP_VERSION, CHANGELOG } from '$lib/config/app-version.js';
    import { validateCrossOriginIsolation } from '$lib/utils/env-check';
    import { useRegisterSW } from 'virtual:pwa-register/svelte';
    import StatusBar from '$lib/components/StatusBar.svelte';
    import CommandPalette from '$lib/components/CommandPalette.svelte';
    import WorkspaceNav from '$lib/components/workspace/WorkspaceNav.svelte';
    import WorkerErrorToast from '$lib/components/WorkerErrorToast.svelte';

    let { children } = $props();

    const { needRefresh, updateServiceWorker } = useRegisterSW({
        onRegistered(swr: ServiceWorkerRegistration | undefined) {
            console.log('SW registered: ', swr);
        },
        onRegisterError(error: unknown) {
            console.log('SW registration error', error);
        }
    });

    import { checkWebGPUSupport } from '$lib/utils/webgpu-check';

    let webgpuSupported = $state(true);
    let hasError = $state(false);

    onMount(() => {
        validateCrossOriginIsolation();
        webgpuSupported = checkWebGPUSupport().supported;
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
    <link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

{#if $needRefresh}
    <div class="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded shadow-lg flex items-center gap-4 z-50">
        <span class="text-sm">🔄 <strong>LocalMind updated</strong> — {CHANGELOG[APP_VERSION] || 'A new version is available.'}</span>
        <button
            class="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm font-semibold transition"
            onclick={() => updateServiceWorker(true)}
        >
            Reload Now
        </button>
        <button
            class="text-gray-400 hover:text-white text-sm transition"
            onclick={() => ($needRefresh = false)}
        >
            Dismiss
        </button>
    </div>
{/if}

<WorkspaceNav />

<main class="min-h-screen bg-gray-50 pb-12">
    <svelte:boundary onerror={() => hasError = true}>
        {@render children()}
    </svelte:boundary>
    {#if hasError}
        <div class="fixed inset-0 bg-white z-50 flex items-center justify-center p-4">
            <div class="text-center max-w-md">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">Something went wrong</h1>
                <p class="text-gray-600 mb-8">An unexpected error occurred in the application interface.</p>
                <button
                    class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-semibold transition"
                    onclick={() => window.location.reload()}
                >
                    Reload app
                </button>
            </div>
        </div>
    {/if}
</main>

<WorkerErrorToast />
<CommandPalette />
<StatusBar />
