import { describe, it, expect } from 'vitest';
import { parseOpenAPI } from '../openapi-parser';

describe('parseOpenAPI', () => {
    it('should correctly parse a simple OpenAPI JSON string', async () => {
        const spec = {
            openapi: '3.0.0',
            info: { title: 'Test API', version: '1.0.0' },
            paths: {
                '/pets': {
                    get: {
                        operationId: 'getPets',
                        responses: {
                            '200': {
                                description: 'A list of pets',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'array',
                                            items: { type: 'string' }
                                        },
                                        example: ['dog', 'cat']
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        const endpoints = await parseOpenAPI(JSON.stringify(spec));
        expect(endpoints.length).toBe(1);
        expect(endpoints[0].method).toBe('get');
        expect(endpoints[0].path).toBe('/pets');
        expect(endpoints[0].statusCode).toBe(200);
        expect(endpoints[0].exampleResponse).toEqual(['dog', 'cat']);
    });
});
