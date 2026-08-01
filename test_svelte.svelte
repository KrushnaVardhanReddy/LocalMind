<script>
    let activeTab = $state('viewer');
</script>
<button onclick={() => activeTab = 'extract'}>Extract</button>
{#if activeTab === 'extract'}
    <div>Extracted</div>
{/if}
