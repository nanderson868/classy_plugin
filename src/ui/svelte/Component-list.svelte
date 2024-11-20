<!-- <script lang="ts">
  import { onMount } from 'svelte';

  let pages = [];
  let error = '';

  onMount(async () => {
    try {
      const api = app.plugins.plugins.dataview.api; // Adjust based on actual API access
      if (api) {
        pages = api.pages().map(p => p.file.path); // Simplify; adapt as needed
      }
    } catch (e) {
      error = e.message;
    }
  });
</script>

{#if error}
  <p class="error">Error: {error}</p>
{:else}
  <div>
    <h2>Pages:</h2>
    <ul>
      {#each pages as page}
        <li>{page}</li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  .error {
    color: red;
  }
</style> -->
