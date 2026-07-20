<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { EditorState } from '@codemirror/state';
  import { EditorView, basicSetup } from 'codemirror';
  import { sql } from '@codemirror/lang-sql';
  import { oneDark } from '@codemirror/theme-one-dark';

  export let initialQuery = '';

  const dispatch = createEventDispatcher();

  let editorContainer: HTMLDivElement;
  let view: EditorView;

  onMount(() => {
    const startState = EditorState.create({
      doc: initialQuery,
      extensions: [
        basicSetup,
        sql(),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
             const doc = update.state.doc.toString();
             dispatch('change', { query: doc });
          }
        })
      ]
    });

    view = new EditorView({
      state: startState,
      parent: editorContainer
    });
  });

  onDestroy(() => {
    if (view) {
      view.destroy();
    }
  });

  export function getQuery() {
    return view.state.doc.toString();
  }
</script>

<div class="sql-editor-container">
  <div bind:this={editorContainer} class="editor"></div>
  <button on:click={() => dispatch('execute', { query: getQuery() })}>
    Execute Query
  </button>
</div>

<style>
  .sql-editor-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  .editor {
    border: 1px solid #ccc;
    border-radius: 4px;
    overflow: hidden;
    height: 200px;
  }

  /* Ensure codemirror takes full height of the container */
  :global(.cm-editor) {
    height: 100%;
  }

  button {
    align-self: flex-start;
    padding: 8px 16px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover {
    background-color: #0056b3;
  }
</style>
