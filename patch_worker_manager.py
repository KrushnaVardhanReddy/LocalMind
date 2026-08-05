import sys

filename = "src/lib/workers/WorkerManager.ts"
with open(filename, "r") as f:
    content = f.read()

# Add initRegexPromise
content = content.replace("private static initPyodidePromise: Promise<any> | null = null;", "private static initPyodidePromise: Promise<any> | null = null;\n    private static initRegexPromise: Promise<any> | null = null;")

# Add to terminate
content = content.replace("case 'pyodide': this.initPyodidePromise = null; break;", "case 'pyodide': this.initPyodidePromise = null; break;\n            case 'regex': this.initRegexPromise = null; break;")

# Add getRegex method
new_method = """
    public static async getRegex() {
        if (this.proxies.has('regex')) {
            return this.proxies.get('regex');
        }

        if (!this.initRegexPromise) {
            this.initRegexPromise = (async () => {
                const worker = new Worker(new URL('./regex.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('regex', worker);
                this.attachErrorListeners(worker, 'regex');

                const proxy = wrap<any>(worker);
                this.proxies.set('regex', proxy);
                return proxy;
            })();
        }

        return this.initRegexPromise;
    }
"""

content = content.replace("public static async getPyodideWorker() {", new_method + "\n    public static async getPyodideWorker() {")

with open(filename, "w") as f:
    f.write(content)
