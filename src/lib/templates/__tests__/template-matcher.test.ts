import { describe, it, expect } from 'vitest';
import { extractDataFromText } from '../template-matcher';

describe('Template Matcher', () => {
    it('should match an invoice and extract fields', () => {
        const text = `
Acme Corp.
Invoice Number: 12345
Date: 10/24/2023
Amount Due: $1,234.56
        `;
        const result = extractDataFromText(text);

        expect(result.type).toBe('Invoice');
        expect(result.data.vendor_name).toBe('Acme Corp.');
        expect(result.data.date).toBe('10/24/2023');
        expect(result.data.total_amount).toBe('1,234.56');
    });

    it('should match a resume and extract fields', () => {
        const text = `
John Doe
Software Engineer
john.doe@example.com
555-123-4567

Skills: TypeScript, Svelte, DuckDB
        `;
        const result = extractDataFromText(text);

        expect(result.type).toBe('Resume');
        expect(result.data.name).toBe('John Doe');
        expect(result.data.email).toBe('john.doe@example.com');
        expect(result.data.phone).toBe('555-123-4567');
        expect(result.data.skills).toBe('TypeScript, Svelte, DuckDB');
    });

    it('should match a contract and extract fields', () => {
        const text = `
This Agreement is entered into by and between Alice and Bob.
Effective Date: January 1, 2024
Governing Law: The laws of the State of California.
        `;
        const result = extractDataFromText(text);

        expect(result.type).toBe('Contract');
        expect(result.data.parties).toContain('Alice');
        expect(result.data.effective_date).toBe('January 1, 2024');
        expect(result.data.governing_law).toBe('California');
    });

    it('should return Unknown for completely unmatched text', () => {
        const text = 'Just some random notes about a meeting yesterday.';
        const result = extractDataFromText(text);

        expect(result.type).toBe('Unknown');
        expect(result.data.rawTextSample).toBeDefined();
    });
});
