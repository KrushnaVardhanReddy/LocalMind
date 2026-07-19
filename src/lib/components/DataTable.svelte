<script lang="ts">
  export let data: any[] = [];
  export let columns: string[] = [];
  export let rowsPerPage: number = 10;

  let currentPage = 1;

  $: totalPages = Math.ceil(data.length / rowsPerPage) || 1;
  $: {
    // Reset to page 1 if data changes and current page is out of bounds
    if (currentPage > totalPages) {
      currentPage = 1;
    }
  }

  $: paginatedData = data.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
    }
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
    }
  }
</script>

<div class="data-table-container">
  {#if data.length === 0}
    <div class="no-data">No data available</div>
  {:else}
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            {#each columns as column}
              <th>{column}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each paginatedData as row, i}
            <tr>
              {#each columns as column}
                <td>{row[column]}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <span class="info">
        Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, data.length)} of {data.length} entries
      </span>
      <div class="controls">
        <button on:click={prevPage} disabled={currentPage === 1}>Previous</button>
        <span class="page-info">Page {currentPage} of {totalPages}</span>
        <button on:click={nextPage} disabled={currentPage === totalPages}>Next</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .data-table-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .no-data {
    padding: 20px;
    text-align: center;
    color: #666;
    background-color: #f9f9f9;
    border-radius: 4px;
    border: 1px solid #ddd;
  }

  .table-wrapper {
    overflow-x: auto;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  th, td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid #ddd;
    white-space: nowrap;
  }

  th {
    background-color: #f4f4f4;
    font-weight: 600;
  }

  tr:hover {
    background-color: #f9f9f9;
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
  }

  .info {
    font-size: 14px;
    color: #666;
  }

  .controls {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .page-info {
    font-size: 14px;
  }

  button {
    padding: 6px 12px;
    border: 1px solid #ccc;
    background-color: white;
    border-radius: 4px;
    cursor: pointer;
  }

  button:disabled {
    background-color: #f4f4f4;
    color: #999;
    cursor: not-allowed;
  }

  button:not(:disabled):hover {
    background-color: #e9e9e9;
  }
</style>
