import { describe, it, expect, vi } from 'vitest';
import { generateHandlers } from '../handler-generator';
import type { ParsedEndpoint } from '../../utils/openapi-parser';

vi.mock('../../workers/WorkerManager', () => ({
    WorkerManager: {
        getDataGen: vi.fn().mockResolvedValue({
            generateFromJsonSchema: vi.fn().mockResolvedValue([{ mock: 'data' }])
        })
    }
}));

describe('generateHandlers', () => {
    it('should generate an array of msw handlers for enabled endpoints', () => {
        const endpoints: ParsedEndpoint[] = [
            { method: 'get', path: '/api/test', statusCode: 200 }
        ];

        const handlers = generateHandlers([{ endpoint: endpoints[0], enabled: true }]);
        expect(handlers.length).toBe(1);
    });

    it('should skip disabled endpoints', () => {
        const endpoints: ParsedEndpoint[] = [
            { method: 'get', path: '/api/test', statusCode: 200 }
        ];

        const handlers = generateHandlers([{ endpoint: endpoints[0], enabled: false }]);
        expect(handlers.length).toBe(0);
    });

    it('should convert path params to msw format', () => {
        const endpoints: ParsedEndpoint[] = [
            { method: 'get', path: '/api/users/{id}', statusCode: 200 }
        ];

        const handlers = generateHandlers([{ endpoint: endpoints[0], enabled: true }]);
        expect(handlers.length).toBe(1);
        expect((handlers[0] as any).info.path).toBe('/api/users/:id');
    });
});
