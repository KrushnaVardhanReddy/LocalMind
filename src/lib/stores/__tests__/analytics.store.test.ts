import { describe, it, expect } from 'vitest';
import { uploadedTables } from '../analytics.store';
import { get } from 'svelte/store';

describe('Analytics Store', () => {
    it('should initialize with an empty array', () => {
        expect(get(uploadedTables)).toEqual([]);
    });

    it('should allow adding tables', () => {
        uploadedTables.set(['table1']);
        expect(get(uploadedTables)).toEqual(['table1']);
    });
});
