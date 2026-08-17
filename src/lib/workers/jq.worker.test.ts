import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JqService } from './jq.worker';
import * as jqModule from 'jq-web';

// Note: jq-web is tricky to mock fully since it uses a WASM backend.
// We'll test JSONPath first.
vi.mock('jq-web', () => {
    return {
        default: Promise.resolve({
            json: vi.fn((json, query) => ['Bob'])
        })
    };
});

describe('JqService', () => {
    let service: JqService;

    beforeEach(() => {
        service = new JqService();
    });

    it('should evaluate JSONPath query', async () => {
        const payload = JSON.stringify({
            users: [
                { name: 'Alice', age: 30 },
                { name: 'Bob', age: 40 }
            ]
        });

        const result = await service.executeQuery('$.users[?(@.age > 30)].name', payload, 'jsonpath');

        expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
        expect(result.error).toBeUndefined();
        expect(JSON.parse(result.output)).toEqual(['Bob']);
    });

    it('should evaluate jq query', async () => {
        const payload = JSON.stringify({
            users: [
                { name: 'Alice', age: 30 },
                { name: 'Bob', age: 40 }
            ]
        });

        const result = await service.executeQuery('.users[] | select(.age > 30) | .name', payload, 'jq');

        const jqInstance = await jqModule.default;
        expect(jqInstance.json).toHaveBeenCalledWith(JSON.parse(payload), '.users[] | select(.age > 30) | .name');
        expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
        expect(result.error).toBeUndefined();
        expect(JSON.parse(result.output)).toEqual(['Bob']);
    });

    it('should handle JSONPath errors gracefully', async () => {
        const result = await service.executeQuery('$.users', 'invalid json', 'jsonpath');
        expect(result.output).toContain('Error');
        expect(result.error).toContain('Error');
    });

    it('should handle jq errors gracefully', async () => {
        const result = await service.executeQuery('.users', 'invalid json', 'jq');
        expect(result.output).toContain('Error');
        expect(result.error).toContain('Error');
    });
});
