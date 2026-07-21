<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { validateCrossOriginIsolation } from '$lib/utils/env-check';

	let { children } = $props();

	onMount(() => {
		validateCrossOriginIsolation();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
