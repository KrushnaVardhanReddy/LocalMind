import { writable } from 'svelte/store';

// Shared state for Analytics workspace
export const uploadedTables = writable<string[]>([]);

export const pivotConfigStore = writable<any | null>(null);
export const aiSummaryStore = writable<string | null>(null);
export const missingFilesStore = writable<string[]>([]);
export const toastMessage = writable<{ message: string, type: 'success' | 'error' | 'warning' } | null>(null);
