import { http, HttpResponse, delay } from 'msw';
import type { ParsedEndpoint } from '../utils/openapi-parser';
import { WorkerManager } from '../workers/WorkerManager';

export interface EndpointConfig {
    endpoint: ParsedEndpoint;
    enabled: boolean;
    statusOverride?: number;
    latencyOverride?: number;
}

export function generateHandlers(configs: EndpointConfig[]) {
    const handlers = [];

    for (const config of configs) {
        if (!config.enabled) continue;

        const { endpoint, statusOverride, latencyOverride } = config;

        // Convert OpenAPI path parameters (e.g. {id}) to MSW format (e.g. :id)
        // Note: OpenAPI paths start with a slash, we might need to prepend base URL if needed,
        // but by default MSW intercepts absolute paths or paths on the same origin.
        const path = endpoint.path.replace(/\{([^}]+)\}/g, ':$1');

        const mswMethod = http[endpoint.method as keyof typeof http];

        if (typeof mswMethod !== 'function') continue;

        const handler = (mswMethod as any)(path, async () => {
            // Simulate latency
            // default: 200ms ± 50ms random jitter
            let latency = 200 + (Math.random() * 100 - 50);
            if (latencyOverride !== undefined) {
                latency = latencyOverride;
            }
            await delay(latency);

            const status = statusOverride !== undefined ? statusOverride : endpoint.statusCode;

            let responseBody = endpoint.exampleResponse;

            if (!responseBody && endpoint.responseSchema) {
                try {
                    const dataGen = await WorkerManager.getDataGen();
                    // Assuming generateFromJsonSchema returns an array of objects
                    const generatedData = await dataGen.generateFromJsonSchema(endpoint.responseSchema, 1);
                    responseBody = generatedData[0];
                } catch (e) {
                    console.error('Failed to generate mock data via DataGen worker', e);
                    responseBody = { error: 'Failed to generate mock data' };
                }
            } else if (!responseBody) {
                responseBody = {}; // Empty body if no schema and no example
            }

            return HttpResponse.json(responseBody, { status });
        });

        handlers.push(handler);
    }

    return handlers;
}
