import { writable } from 'svelte/store';

export type WorkerName = 'duckdb' | 'sqlite' | 'llm' | 'tesseract' | 'mupdf' | 'datagen' | 'treesitter' | 'ner' | 'ffmpeg' | 'whisper' | 'opencv' | 'embeddings' | 'mammoth' | 'converter' | 'git' | 'logparser' | 'visualdiff' | 'webllm' | 'geo' | 'crypto' | string;

export interface WorkerCrashEvent {
    worker: WorkerName;
    error: string;
    timestamp: number;
    recoverable: boolean; // false for OOM
}

export const workerCrashes = writable<WorkerCrashEvent[]>([]);
