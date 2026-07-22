import { WorkerManager } from '../workers/WorkerManager';
import type { PluginManifest } from './contract';

export async function validatePlugin(wasmBuffer: ArrayBuffer): Promise<boolean> {
    try {
        const isValid = await WebAssembly.validate(wasmBuffer);
        if (!isValid) return false;

        const module = await WebAssembly.compile(wasmBuffer);
        const exports = WebAssembly.Module.exports(module);

        const hasAlloc = exports.some(e => e.name === 'alloc' && e.kind === 'function');
        const hasDealloc = exports.some(e => e.name === 'dealloc' && e.kind === 'function');
        const hasProcess = exports.some(e => e.name === 'process' && e.kind === 'function');

        return hasAlloc && hasDealloc && hasProcess;
    } catch (e) {
        return false;
    }
}

export async function installPlugin(pluginId: string, wasmBuffer: ArrayBuffer, manifest: PluginManifest): Promise<string> {
    const isValid = await validatePlugin(wasmBuffer);
    if (!isValid) {
        throw new Error('Invalid WASM binary or missing required exports (alloc, dealloc, process)');
    }

    const opfsRoot = await navigator.storage.getDirectory();
    const pluginsDir = await opfsRoot.getDirectoryHandle('plugins', { create: true });
    const pluginDir = await pluginsDir.getDirectoryHandle(pluginId, { create: true });
    const wasmFile = await pluginDir.getFileHandle('plugin.wasm', { create: true });

    const writable = await wasmFile.createWritable();
    await writable.write(wasmBuffer);
    await writable.close();

    const wasmOpfsPath = `plugins/${pluginId}/plugin.wasm`;

    const sqlite = await WorkerManager.getSQLite();
    await sqlite.savePlugin({
        id: pluginId,
        name: manifest.name,
        version: manifest.version,
        author: manifest.author,
        description: manifest.description,
        manifest: JSON.stringify(manifest),
        wasm_opfs_path: wasmOpfsPath,
        enabled: 1
    });

    return pluginId;
}

export async function removePlugin(pluginId: string): Promise<void> {
    const sqlite = await WorkerManager.getSQLite();
    await sqlite.deletePlugin(pluginId);

    try {
        const opfsRoot = await navigator.storage.getDirectory();
        const pluginsDir = await opfsRoot.getDirectoryHandle('plugins', { create: false });
        await pluginsDir.removeEntry(pluginId, { recursive: true });
    } catch (e) {
        console.warn(`Could not remove OPFS directory for plugin ${pluginId}`, e);
    }
}