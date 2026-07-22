import SwaggerParser from '@apidevtools/swagger-parser';

const Parser = SwaggerParser;

export interface ParsedEndpoint {
    method: string;
    path: string;
    operationId?: string;
    summary?: string;
    responseSchema?: any;
    exampleResponse?: any;
    statusCode: number;
}

export async function parseOpenAPI(specContent: string | object): Promise<ParsedEndpoint[]> {
    try {
        let spec: object;
        if (typeof specContent === 'string') {
            spec = JSON.parse(specContent);
        } else {
            spec = specContent;
        }

        const api = await Parser.dereference(spec as any);
        const endpoints: ParsedEndpoint[] = [];

        if (api.paths) {
            for (const [path, methods] of Object.entries(api.paths)) {
                for (const [method, operation] of Object.entries(methods as any)) {
                    // Standard HTTP methods
                    if (!['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method.toLowerCase())) {
                        continue;
                    }

                    const responses = (operation as any).responses;
                    let bestStatusCode = 200;
                    let responseSchema = null;
                    let exampleResponse = null;

                    if (responses) {
                        // Prefer 200 OK, otherwise pick the first 2xx
                        const statusCodes = Object.keys(responses);
                        const successCode = statusCodes.find(code => code.startsWith('2')) || statusCodes[0];
                        if (successCode) {
                            bestStatusCode = parseInt(successCode, 10) || 200;
                            const responseObj = responses[successCode];

                            const content = responseObj.content;
                            if (content && content['application/json']) {
                                responseSchema = content['application/json'].schema;
                                exampleResponse = content['application/json'].example;

                                if (!exampleResponse && responseSchema && responseSchema.example) {
                                    exampleResponse = responseSchema.example;
                                }
                            }
                        }
                    }

                    endpoints.push({
                        method: method.toLowerCase(),
                        path,
                        operationId: (operation as any).operationId,
                        summary: (operation as any).summary,
                        responseSchema,
                        exampleResponse,
                        statusCode: bestStatusCode
                    });
                }
            }
        }

        return endpoints;
    } catch (e) {
        throw new Error(`Failed to parse OpenAPI spec: ${(e as Error).message}`);
    }
}
