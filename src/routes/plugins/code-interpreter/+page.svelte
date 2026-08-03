<script lang="ts">
    import { onMount } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import CodeEditor from '$lib/components/plugins/code-interpreter/CodeEditor.svelte';
    import OutputConsole from '$lib/components/plugins/code-interpreter/OutputConsole.svelte';
    import { proxy } from 'comlink';

    let worker = $state.raw<any>(null);
    let isReady = $state(false);
    let isRunning = $state(false);

    let code = $state(`import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Generate some sample data
dates = pd.date_range('20230101', periods=100)
df = pd.DataFrame(np.random.randn(100, 4), index=dates, columns=list('ABCD'))

# Calculate cumulative sum
df = df.cumsum()

# Plot the data
plt.figure(figsize=(10, 6))
plt.plot(df.index, df['A'], label='Series A')
plt.plot(df.index, df['B'], label='Series B')
plt.title('Sample Time Series Analysis')
plt.legend()
plt.grid(True)
plt.show()

print(f"Data summary:\\n{df.describe()}")`);

    let stdout = $state<string[]>([]);
    let stderr = $state<string[]>([]);
    let plots = $state<string[]>([]);

    onMount(async () => {
        try {
            worker = await WorkerManager.getPyodideWorker();

            const handleStdout = proxy((msg: string) => {
                stdout = [...stdout, msg];
            });
            const handleStderr = proxy((msg: string) => {
                stderr = [...stderr, msg];
            });
            const handlePlot = proxy((plotData: string) => {
                plots = [...plots, plotData];
            });

            await worker.init(handleStdout, handleStderr, handlePlot);
            isReady = true;
        } catch (error) {
            console.error("Failed to initialize Pyodide:", error);
            stderr = [...stderr, String(error)];
        }
    });

    async function runCode() {
        if (!worker || !isReady) return;

        isRunning = true;
        stdout = [];
        stderr = [];
        plots = [];

        try {
            const result = await worker.runPythonAsync(code);
            if (result !== undefined) {
                // If there's a return value that is not undefined, display it
                stdout = [...stdout, String(result)];
            }
        } catch (error) {
            stderr = [...stderr, String(error)];
        } finally {
            isRunning = false;
        }
    }
</script>

<div class="h-[calc(100vh-4rem)] flex w-full">
    {#if !isReady}
        <div class="flex items-center justify-center w-full h-full bg-slate-900 text-white">
            <div class="flex flex-col items-center gap-4">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p>Downloading and initializing Pyodide (WASM)...</p>
                <p class="text-sm text-slate-400">This may take a minute on the first load to download NumPy, Pandas, and Matplotlib.</p>
            </div>
        </div>
    {:else}
        <div class="flex w-full h-full">
            <div class="w-1/2 min-w-[300px] h-full">
                <CodeEditor bind:code onRun={runCode} {isRunning} />
            </div>
            <div class="w-1/2 min-w-[300px] h-full border-l border-slate-700">
                <OutputConsole {stdout} {stderr} {plots} />
            </div>
        </div>
    {/if}
</div>
