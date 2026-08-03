import { expose } from 'comlink';
import { loadPyodide } from 'pyodide';

let pyodide: any = null;
let currentPlotCallback: ((plot: string) => void) | null = null;

export class PyodideWorker {
    async init(stdoutCallback?: (msg: string) => void, stderrCallback?: (msg: string) => void, plotCallback?: (plot: string) => void) {
        if (!pyodide) {
            pyodide = await loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/'
            });
            await pyodide.loadPackage(['numpy', 'pandas', 'matplotlib']);
        }

        pyodide.setStdout({ batched: (msg: string) => stdoutCallback?.(msg) });
        pyodide.setStderr({ batched: (msg: string) => stderrCallback?.(msg) });
        currentPlotCallback = plotCallback || null;
    }

    async runPythonAsync(code: string) {
        if (!pyodide) {
            throw new Error('Pyodide is not initialized');
        }

        // Expose a JS callback to python to handle plots
        pyodide.globals.set('js_plot_callback', (plotData: string) => {
            if (currentPlotCallback) {
                currentPlotCallback(plotData);
            }
        });

        // We hijack matplotlib's show function to return the figure as a base64 string
        const codeWrapper = `
import matplotlib.pyplot as plt
import io
import base64
import js

def custom_show():
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    plt.close('all')

    # Call the JS callback exposed in globals
    js_plot_callback(img_str)

plt.show = custom_show

${code}
`;

        try {
            const result = await pyodide.runPythonAsync(codeWrapper);
            return result;
        } catch (error) {
            console.error('Python execution error:', error);
            throw error;
        }
    }
}

expose(new PyodideWorker());
