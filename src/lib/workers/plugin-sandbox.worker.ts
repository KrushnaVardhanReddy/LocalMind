import { expose } from 'comlink';
import type { CustomPluginContract, PluginManifest } from '../plugin-runtime/contract';

class PluginSandbox implements CustomPluginContract {
    private wasmInstance: WebAssembly.Instance | null = null;
    private memory: WebAssembly.Memory | null = null;
    private metadata: PluginManifest | null = null;

    async initWasm(wasmBuffer: ArrayBuffer, manifest: PluginManifest): Promise<void> {
        this.metadata = manifest;
        const module = await WebAssembly.compile(wasmBuffer);
        this.wasmInstance = await WebAssembly.instantiate(module, {
            env: {
                // Stub basic env if needed
            }
        });

        const exports = this.wasmInstance.exports as any;
        if (!exports.alloc || !exports.dealloc || !exports.process || !exports.memory) {
            throw new Error('WASM module missing required exports (alloc, dealloc, process, memory)');
        }

        this.memory = exports.memory;
    }

    async init(): Promise<void> {
        // Additional initialization if required
    }

    async process(inputBuffer: ArrayBuffer): Promise<ArrayBuffer> {
        if (!this.wasmInstance || !this.memory) {
            throw new Error('Plugin not initialized');
        }

        const exports = this.wasmInstance.exports as any;
        const inputBytes = new Uint8Array(inputBuffer);
        const len = inputBytes.length;

        // Allocate memory for input
        const inputPtr = exports.alloc(len);

        // Copy input to WASM memory
        const wasmMemArray = new Uint8Array(this.memory.buffer);
        wasmMemArray.set(inputBytes, inputPtr);

        const resultPtr = exports.process(inputPtr, len);

        const outLen = len; // We assume length is unchanged
        const outBuffer = this.memory.buffer.slice(resultPtr, resultPtr + outLen);

        // Free memory (if it's not the same pointer or if we want to free the original)
        exports.dealloc(inputPtr);
        if (resultPtr !== inputPtr) {
            exports.dealloc(resultPtr);
        }

        return outBuffer;
    }

    async getMetadata(): Promise<PluginManifest> {
        if (!this.metadata) {
            throw new Error('Plugin not initialized');
        }
        return this.metadata;
    }
}

expose(new PluginSandbox());