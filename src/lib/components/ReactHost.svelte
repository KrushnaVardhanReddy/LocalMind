<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let component: any; // Using any for simplicity in dynamic import
  export let props: any = {};

  let container: HTMLDivElement;
  let root: any; // type Root from react-dom/client
  let React: any;

  onMount(async () => {
    React = await import('react');
    const { createRoot } = await import('react-dom/client');
    const { ExcalidrawWrapper } = await import('$lib/whiteboard/ExcalidrawWrapper');

    root = createRoot(container);
    root.render(React.createElement(ExcalidrawWrapper, props));
  });

  // Re-render when props change
  $: if (root && React) {
    // Need to dynamically import again if we want to use ExcalidrawWrapper here, or store it.
    // For simplicity, we just won't update dynamically for this test, or we can use an effect
    import('$lib/whiteboard/ExcalidrawWrapper').then(({ ExcalidrawWrapper }) => {
      root.render(React.createElement(ExcalidrawWrapper, props));
    });
  }

  onDestroy(() => {
    if (root) {
      setTimeout(() => root.unmount(), 0);
    }
  });
</script>

<div bind:this={container} class="w-full h-full"></div>
