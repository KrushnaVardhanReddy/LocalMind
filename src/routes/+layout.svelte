<script lang="ts">
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';
    import { onMount } from 'svelte';
    import { APP_VERSION, CHANGELOG } from '$lib/config/app-version.js';
    import { validateCrossOriginIsolation } from '$lib/utils/env-check';
    import { useRegisterSW } from 'virtual:pwa-register/svelte';
    import StatusBar from '$lib/components/StatusBar.svelte';
    import WorkspaceNav from '$lib/components/workspace/WorkspaceNav.svelte';
    import FileExplorer from '$lib/components/explorer/FileExplorer.svelte';
    import WorkerErrorToast from '$lib/components/WorkerErrorToast.svelte';
    import DynamicInspector from '$lib/components/inspector/DynamicInspector.svelte';
    import AnalyticsWorkspace from '$lib/components/workspace/panels/AnalyticsWorkspace.svelte';
    import DevToolsWorkspace from '$lib/components/workspace/panels/DevToolsWorkspace.svelte';
    import { checkWebGPUSupport } from '$lib/utils/webgpu-check';
    import { workspaceStore } from '$lib/stores/workspace.store.svelte';
    import { CommandRegistry } from '$lib/services/CommandRegistry';
    import { browser } from '$app/environment';
    import { afterNavigate } from '$app/navigation';

    if (browser) {
        import('ninja-keys');
    }

    let { children } = $props();

    afterNavigate(({ to }) => {
        if (to?.url.pathname !== '/' && to?.url.pathname !== '/analytics' && to?.url.pathname !== '/devtools') {
            workspaceStore.activeWorkspace = null;
        }
    });

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

        workspaceStore.registerCommand('open-demo-inspector', 'Open Demo Inspector', () => {
            workspaceStore.openInspector('DemoPanel', { title: 'Demo Inspector', message: 'Hello from Command Palette!' });
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
        <aside class="w-64 flex-none border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-y-auto flex flex-col">
            <div class="p-4 flex-none text-sm font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">Explorer</div>
            <div class="flex-1 overflow-y-auto">
                <FileExplorer />
            </div>
        </aside>

        <!-- Center Canvas -->
        <main class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 relative">
            <svelte:boundary onerror={() => hasError = true}>
                {#if workspaceStore.activeWorkspace?.type === 'analytics'}
                    <AnalyticsWorkspace />
                {:else if workspaceStore.activeWorkspace?.type === 'devtools'}
                    <DevToolsWorkspace />
                {:else}
                    {@render children()}
                {/if}
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
        <DynamicInspector />
    </div>

    <!-- Status Bar -->
    <footer class="flex-none">
        <StatusBar />
    </footer>
</div>

<WorkerErrorToast />
