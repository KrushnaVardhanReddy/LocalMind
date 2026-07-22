import { wrap } from 'comlink';
import type { CustomPluginContract } from './contract';
import { WorkerManager } from '../workers/WorkerManager';

export async function createPluginWorker(pluginId: string): Promise<CustomPluginContract> {
    const sqlite = await WorkerManager.getSQLite();
    const plugins = await sqlite.listPlugins();
    const pluginRecord = plugins.find((p: any) => p.id === pluginId);

    if (!pluginRecord) {
        throw new Error(`Plugin ${pluginId} not found`);
    }

    const opfsRoot = await navigator.storage.getDirectory();
    const pluginsDir = await opfsRoot.getDirectoryHandle('plugins');
    const pluginDir = await pluginsDir.getDirectoryHandle(pluginId);
    const wasmFileHandle = await pluginDir.getFileHandle('plugin.wasm');
    const wasmFile = await wasmFileHandle.getFile();
    const wasmBuffer = await wasmFile.arrayBuffer();

    const worker = new Worker(new URL('../workers/plugin-sandbox.worker.ts', import.meta.url), { type: 'module' });
    const proxy = wrap<any>(worker);

    const manifest = JSON.parse(pluginRecord.manifest);
    await proxy.initWasm(wasmBuffer, manifest);

    // Register in WorkerManager
    WorkerManager.registerPluginWorker(pluginId, worker, proxy);

    return proxy as unknown as CustomPluginContract;
}