import { writable } from 'svelte/store';

// Shared state for Analytics workspace
export const uploadedTables = writable<string[]>([]);
