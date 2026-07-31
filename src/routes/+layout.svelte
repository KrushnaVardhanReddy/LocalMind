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

<svelte:boundary>
    <main class="min-h-screen bg-gray-50 pb-12">
        {@render children()}
    </main>
    {#snippet failed(error, reset)}
        <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div class="bg-white p-8 rounded-xl shadow-xl max-w-lg w-full text-center">
                <div class="text-red-500 text-5xl mb-4">⚠️</div>
                <h1 class="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                <p class="text-gray-600 mb-6 bg-gray-100 p-4 rounded text-left overflow-auto text-sm font-mono max-h-40">{error}</p>
                <button
                    class="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
                    onclick={reset}
                >
                    Try again
                </button>
            </div>
        </div>
    {/snippet}
</svelte:boundary>

<WorkerErrorToast />

<CommandPalette />
<StatusBar />
