<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { validateCrossOriginIsolation } from '$lib/utils/env-check';
	import { useRegisterSW } from 'virtual:pwa-register/svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';

	let { children } = $props();

	const { needRefresh, updateServiceWorker } = useRegisterSW({
		onRegistered(swr: ServiceWorkerRegistration | undefined) {
			console.log('SW registered: ', swr);
		},
		onRegisterError(error: unknown) {
			console.log('SW registration error', error);
		}
	});

	onMount(() => {
		validateCrossOriginIsolation();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

{#if $needRefresh}
	<div class="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded shadow-lg flex items-center gap-4 z-50">
		<span class="text-sm">A new version is available.</span>
		<button
			class="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm font-semibold transition"
			onclick={() => updateServiceWorker(true)}
		>
			Reload
		</button>
		<button
			class="text-gray-400 hover:text-white text-sm transition"
			onclick={() => ($needRefresh = false)}
		>
			Dismiss
		</button>
	</div>
{/if}

{@render children()}

<StatusBar />
