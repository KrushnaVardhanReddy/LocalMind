<script lang="ts">
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';
    import { onMount } from 'svelte';
    import { APP_VERSION, CHANGELOG } from '$lib/config/app-version.js';
    import { validateCrossOriginIsolation } from '$lib/utils/env-check';
    import { useRegisterSW } from 'virtual:pwa-register/svelte';
    import StatusBar from '$lib/components/StatusBar.svelte';
    import WorkspaceNav from '$lib/components/workspace/WorkspaceNav.svelte';
    import WorkerErrorToast from '$lib/components/WorkerErrorToast.svelte';
    import { checkWebGPUSupport } from '$lib/utils/webgpu-check';
    import { workspaceStore } from '$lib/stores/workspace.store.svelte';
    import { CommandRegistry } from '$lib/services/CommandRegistry';
    import { browser } from '$app/environment';

    if (browser) {
        import('ninja-keys');
    }

    let { children } = $props();

    const { needRefresh, updateServiceWorker } = useRegisterSW({
        onRegistered(swr: ServiceWorkerRegistration | undefined) {
            console.log('SW registered: ', swr);
        },
        onRegisterError(error: unknown) {
            console.log('SW registration error', error);
        }
    });

    let webgpuSupported = $state(true);
    let hasError = $state(false);
    let ninjaKeysRef: any = $state(null);

    // Sync commands to ninja-keys
    $effect(() => {
        if (ninjaKeysRef) {
            const staticCommands = CommandRegistry.getBuiltInCommands().map(cmd => ({
                id: cmd.id,
                title: cmd.label,
                section: cmd.category,
                handler: cmd.action,
                hotkey: cmd.shortcut
            }));

            const dynamicCommands = Array.from(workspaceStore.commands.entries()).map(([id, cmd]) => ({
                id,
                title: cmd.name,
                handler: cmd.callback
            }));

            ninjaKeysRef.data = [...staticCommands, ...dynamicCommands];
        }
    });

    onMount(() => {
        validateCrossOriginIsolation();
        webgpuSupported = checkWebGPUSupport().supported;

        // Ensure commands are registered
        workspaceStore.registerCommand('toggle-dark', 'Toggle Dark Mode', () => {
             document.documentElement.classList.toggle('dark');
        });

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (ninjaKeysRef) {
                    ninjaKeysRef.open();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
    <link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

<ninja-keys bind:this={ninjaKeysRef}></ninja-keys>

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

<div class="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
    <!-- Top Navigation -->
    <header class="flex-none">
        <WorkspaceNav />
    </header>

    <!-- 3-Pane Middle Section -->
    <div class="flex flex-1 overflow-hidden">

        <!-- Left Sidebar (Explorer) -->
        <aside class="w-64 flex-none border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-y-auto">
            <div class="p-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Explorer</div>
            <!-- OPFS file tree and workspace navigation would go here -->
        </aside>

        <!-- Center Canvas -->
        <main class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 relative">
            <svelte:boundary onerror={() => hasError = true}>
                {@render children()}
            </svelte:boundary>

            {#if hasError}
                <div class="absolute inset-0 bg-white dark:bg-gray-800 z-50 flex items-center justify-center p-4">
                    <div class="text-center max-w-md">
                        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Something went wrong</h1>
                        <p class="text-gray-600 dark:text-gray-400 mb-8">An unexpected error occurred in the application interface.</p>
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

        <!-- Right Sidebar (Inspector) -->
        {#if workspaceStore.inspectorState.isOpen}
            <aside class="w-72 flex-none border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-y-auto p-4">
                <div class="flex justify-between items-center mb-4">
                    <div class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Inspector</div>
                    <button class="text-gray-400 hover:text-gray-600" onclick={() => workspaceStore.closeInspector()} aria-label="Close Inspector">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div>
                    <h3 class="font-medium text-gray-900 dark:text-gray-100">{workspaceStore.inspectorState.componentName}</h3>
                    <pre class="mt-2 text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">{JSON.stringify(workspaceStore.inspectorState.props, null, 2)}</pre>
                </div>
            </aside>
        {/if}
    </div>

    <!-- Status Bar -->
    <footer class="flex-none">
        <StatusBar />
    </footer>
</div>

<WorkerErrorToast />
