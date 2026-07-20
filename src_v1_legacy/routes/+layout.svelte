<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<nav class="bg-gray-800 text-white p-4">
  <div class="container mx-auto flex gap-4">
    <a href="/" class="hover:text-blue-300 font-semibold">Data Workspace</a>
    <a href="/documents" class="hover:text-blue-300 font-semibold">Document Workspace</a>
  </div>
</nav>

{@render children()}
