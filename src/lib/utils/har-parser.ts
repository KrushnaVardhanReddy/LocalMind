export interface HarEntry {
    url: string;
    method: string;
    status: number;
    startedDateTime: string;
    timings: any;
    requestHeaders: any[];
    responseBodySize: number;
}

export interface SecurityIssue {
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    url: string;
}

export async function parseHarFile(file: File): Promise<{ entries: HarEntry[], securityIssues: SecurityIssue[], summary: any }> {
    const text = await file.text();
    const har = JSON.parse(text);

    if (!har.log || !har.log.entries) {
        throw new Error("Invalid HAR file format");
    }

    const entries: HarEntry[] = [];
    let totalTransferSize = 0;

    let minTime = Number.MAX_SAFE_INTEGER;
    let maxTime = 0;

    for (const entry of har.log.entries) {
        const startedTime = new Date(entry.startedDateTime).getTime();
        const entryTime = entry.time || 0;

        minTime = Math.min(minTime, startedTime);
        maxTime = Math.max(maxTime, startedTime + entryTime);

        const parsedEntry: HarEntry = {
            url: entry.request?.url || '',
            method: entry.request?.method || '',
            status: entry.response?.status || 0,
            startedDateTime: entry.startedDateTime,
            timings: entry.timings || {},
            requestHeaders: entry.request?.headers || [],
            responseBodySize: entry.response?.bodySize || 0
        };

        if (entry.response && entry.response.bodySize > 0) {
            totalTransferSize += entry.response.bodySize;
        }

        entries.push(parsedEntry);
    }

    const summary = {
        totalRequests: entries.length,
        totalTransferSize,
        pageLoadTime: maxTime > minTime ? maxTime - minTime : 0
    };

    const securityIssues = scanForSecurityIssues(entries);

    return { entries, securityIssues, summary };
}

export function scanForSecurityIssues(entries: HarEntry[]): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    for (const entry of entries) {
        if (!entry.requestHeaders) continue;

        for (const header of entry.requestHeaders) {
            const name = (header.name || '').toLowerCase();
            const value = header.value || '';

            if (name === 'authorization' && value.toLowerCase().startsWith('bearer ')) {
                issues.push({
                    severity: 'HIGH',
                    message: 'Auth Token Exposed in HAR',
                    url: entry.url
                });
            }

            if (name === 'cookie') {
                issues.push({
                    severity: 'MEDIUM',
                    message: 'Session Cookie Exposed in HAR',
                    url: entry.url
                });
            }

            if (name === 'x-api-key') {
                issues.push({
                    severity: 'HIGH',
                    message: 'API Key Exposed in HAR',
                    url: entry.url
                });
            }
        }
    }

    return issues;
}
