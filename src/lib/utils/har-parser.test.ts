import { describe, it, expect } from 'vitest';
import { parseHarFile, scanForSecurityIssues, type HarEntry } from './har-parser';

describe('HAR Parser', () => {
    it('should parse a valid HAR file', async () => {
        const mockHar = {
            log: {
                entries: [
                    {
                        startedDateTime: "2023-01-01T00:00:00.000Z",
                        time: 100,
                        request: {
                            method: "GET",
                            url: "https://example.com",
                            headers: [
                                { name: "Accept", value: "*/*" }
                            ]
                        },
                        response: {
                            status: 200,
                            bodySize: 1024
                        },
                        timings: {
                            receive: 50
                        }
                    }
                ]
            }
        };

        const file = new File([JSON.stringify(mockHar)], 'test.har', { type: 'application/json' });
        const result = await parseHarFile(file);

        expect(result.entries.length).toBe(1);
        expect(result.entries[0].url).toBe("https://example.com");
        expect(result.entries[0].method).toBe("GET");
        expect(result.entries[0].status).toBe(200);
        expect(result.entries[0].responseBodySize).toBe(1024);

        expect(result.summary.totalRequests).toBe(1);
        expect(result.summary.totalTransferSize).toBe(1024);
        expect(result.summary.pageLoadTime).toBe(100);
    });

    it('should throw an error for invalid HAR file', async () => {
        const file = new File(['{}'], 'test.har', { type: 'application/json' });
        await expect(parseHarFile(file)).rejects.toThrow("Invalid HAR file format");
    });

    it('should detect security issues in headers', () => {
        const entries: HarEntry[] = [
            {
                url: "https://api.example.com",
                method: "GET",
                status: 200,
                startedDateTime: "2023-01-01T00:00:00.000Z",
                timings: {},
                responseBodySize: 0,
                requestHeaders: [
                    { name: "Authorization", value: "Bearer token123" },
                    { name: "Cookie", value: "session_id=abc" },
                    { name: "X-Api-Key", value: "secret" }
                ]
            }
        ];

        const issues = scanForSecurityIssues(entries);
        expect(issues.length).toBe(3);

        expect(issues.find(i => i.message === 'Auth Token Exposed in HAR')).toBeDefined();
        expect(issues.find(i => i.message === 'Session Cookie Exposed in HAR')).toBeDefined();
        expect(issues.find(i => i.message === 'API Key Exposed in HAR')).toBeDefined();
    });
});
