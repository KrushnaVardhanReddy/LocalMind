<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let { initialData = null, onChange = () => {} } = $props<{
    initialData?: any;
    onChange?: (elements: readonly any[], appState: any) => void;
  }>();

  let container: HTMLDivElement | null = $state(null);
  let root: any = null;
  let observer: MutationObserver | null = null;
  let ExcalidrawReactAppMod: any = null;
  let ReactMod: any = null;
  let isDark = $state(false);

  onMount(async () => {
    if (!container) return;
    ReactMod = await import('react');
    const { createRoot } = await import('react-dom/client');
    const { ExcalidrawReactApp } = await import('./ExcalidrawReactApp');
    ExcalidrawReactAppMod = ExcalidrawReactApp;

    isDark = document.documentElement.classList.contains('dark');

    root = createRoot(container);

    renderReact();

    // Watch for theme changes
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          const newIsDark = document.documentElement.classList.contains('dark');
          if (isDark !== newIsDark) {
            isDark = newIsDark;
            renderReact();
          }
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  });

  const renderReact = () => {
    if (root && ReactMod && ExcalidrawReactAppMod) {
        root.render(ReactMod.createElement(ExcalidrawReactAppMod, {
            initialData,
            onChange,
            isDark
        }));
    }
  };

  // Re-render when initialData changes (e.g. activeSceneId changes)
  $effect(() => {
    if (initialData) {
        renderReact();
    }
  });

  onDestroy(() => {
    if (observer) {
      observer.disconnect();
    }
    if (root) {
      setTimeout(() => root.unmount(), 0);
    }
  });
</script>

<div bind:this={container} class="w-full h-full"></div>
