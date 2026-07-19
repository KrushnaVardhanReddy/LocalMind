<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { queryEngine } from '$lib/services/QueryEngine';

  export let tableName: string = '';
  export let columns: { name: string; type: string }[] = [];

  let stats: Record<string, any> = {};
  let loading: boolean = false;
  let error: string | null = null;

  const dispatch = createEventDispatcher();

  $: if (tableName && columns.length > 0) {
    loadStats();
  }

  async function loadStats() {
    loading = true;
    error = null;
    stats = {};
    try {
      // Load stats for each column in parallel
      const statPromises = columns.map(async (col) => {
        try {
          const colStats = await queryEngine.getColumnStats(tableName, col.name);
          return { name: col.name, stats: colStats };
        } catch (e) {
           console.error(`Failed to load stats for ${col.name}:`, e);
           return { name: col.name, stats: null };
        }
      });

      const results = await Promise.all(statPromises);
      const newStats: Record<string, any> = {};
      for (const res of results) {
        if (res.stats) {
          newStats[res.name] = res.stats;
        }
      }
      stats = newStats;
    } catch (err: any) {
      error = err.message || 'Failed to load column statistics';
    } finally {
      loading = false;
    }
  }

  function formatValue(val: any): string {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'number') {
      // Format number to 2 decimal places if it's a float
      return Number.isInteger(val) ? val.toString() : val.toFixed(2);
    }
    return String(val);
  }
</script>

<div class="column-stats-container">
  <h3>Column Statistics Profiling</h3>
  {#if loading}
    <div class="loading">Calculating statistics...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if Object.keys(stats).length === 0}
    <div class="no-stats">No statistics available. Please ensure a table is loaded.</div>
  {:else}
    <div class="stats-grid">
      {#each columns as col}
        <div class="stat-card">
          <div class="stat-header">
            <span class="col-name">{col.name}</span>
            <span class="col-type">{col.type}</span>
          </div>
          {#if stats[col.name]}
             <div class="stat-body">
               <div class="stat-row"><span>Min:</span> <span>{formatValue(stats[col.name].min)}</span></div>
               <div class="stat-row"><span>Max:</span> <span>{formatValue(stats[col.name].max)}</span></div>
               <div class="stat-row"><span>Mean:</span> <span>{formatValue(stats[col.name].mean)}</span></div>
               <div class="stat-row"><span>Nulls:</span> <span>{formatValue(stats[col.name].nullCount)}</span></div>
               <div class="stat-row"><span>Unique:</span> <span>{formatValue(stats[col.name].uniqueValues)}</span></div>
             </div>
          {:else}
             <div class="stat-body error-body">Stats unavailable for this type.</div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .column-stats-container {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
  }

  h3 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 16px;
    color: #333;
  }

  .loading, .error, .no-stats {
    padding: 10px;
    font-size: 14px;
    color: #555;
  }

  .error {
    color: #dc3545;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
  }

  .stat-card {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    overflow: hidden;
  }

  .stat-header {
    background-color: #e9ecef;
    padding: 8px 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #dee2e6;
  }

  .col-name {
    font-weight: 600;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .col-type {
    font-size: 11px;
    color: #6c757d;
    background: #e2e3e5;
    padding: 2px 6px;
    border-radius: 10px;
  }

  .stat-body {
    padding: 10px;
    font-size: 13px;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .stat-row:last-child {
    margin-bottom: 0;
  }

  .stat-row span:first-child {
    color: #6c757d;
  }

  .stat-row span:last-child {
    font-weight: 500;
  }

  .error-body {
    color: #dc3545;
    font-style: italic;
  }
</style>
