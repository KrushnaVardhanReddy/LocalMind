import { expose } from 'comlink';

export interface RegexMatch {
    match: string;
    start: number;
    end: number;
    groups: Record<string, string>;
    groupIndices: Record<number, string>;
}

export interface RegexResult {
    matches: RegexMatch[];
    error?: string;
    executionTimeMs: number;
}

export class RegexWorker {
    async evaluate(pattern: string, flags: string, testString: string): Promise<RegexResult> {
        const startTime = performance.now();
        try {
            const regex = new RegExp(pattern, flags);
            const matches: RegexMatch[] = [];

            let match;
            if (regex.global) {
                while ((match = regex.exec(testString)) !== null) {
                    matches.push(this.formatMatch(match));
                    if (regex.lastIndex === match.index) {
                        regex.lastIndex++;
                    }
                }
            } else {
                match = regex.exec(testString);
                if (match) {
                    matches.push(this.formatMatch(match));
                }
            }

            const endTime = performance.now();
            return {
                matches,
                executionTimeMs: endTime - startTime
            };
        } catch (e: any) {
            return {
                matches: [],
                error: e.message,
                executionTimeMs: performance.now() - startTime
            };
        }
    }

    private formatMatch(match: RegExpExecArray): RegexMatch {
        const groups: Record<string, string> = {};
        if (match.groups) {
            for (const [key, value] of Object.entries(match.groups)) {
                groups[key] = value;
            }
        }

        const groupIndices: Record<number, string> = {};
        for (let i = 1; i < match.length; i++) {
            groupIndices[i] = match[i];
        }

        return {
            match: match[0],
            start: match.index,
            end: match.index + match[0].length,
            groups,
            groupIndices
        };
    }
}

expose(new RegexWorker());
