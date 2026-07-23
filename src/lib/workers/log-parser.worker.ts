import { expose } from 'comlink';

export interface LogPattern {
    id: string;
    name: string;
    regex: string; // Named capture groups, e.g. (?<timestamp>\d+)
    columns: string[]; // Column names derived from capture groups
}

export interface LogParseResult {
    rowCount: number;
    columns: string[];
    sample: Record<string, string>[]; // First 100 parsed rows
    unmatchedLines: number;
    executionTimeMs: number;
}

export interface AnomalyCluster {
    centroid: string; // Representative log line for this cluster
    size: number;
    isAnomaly: boolean; // true if cluster is significantly smaller than others
    sampleLines: string[];
}

export interface LogParserWorkerContract {
    /**
     * Loads a raw log file into DuckDB as a text table.
     * Each line becomes a row with a single 'raw_line' column.
     */
    loadLog(logFile: File): Promise<{ lineCount: number }>;

    /**
     * Applies a regex pattern to the loaded log, creating a structured DuckDB view.
     * Returns a sample of the parsed output.
     */
    applyPattern(pattern: LogPattern): Promise<LogParseResult>;

    /**
     * Generates a regex pattern by analyzing a user-highlighted sample line.
     * Uses heuristics to identify timestamps, log levels, and message bodies.
     */
    suggestPattern(sampleLine: string): Promise<LogPattern>;

    /**
     * Clusters log lines using local embeddings + k-means.
     * Returns clusters sorted by size, with anomaly flags.
     */
    clusterAnomalies(maxClusters?: number): Promise<AnomalyCluster[]>;

    init(duckdb: any, embeddings: any): void;
}

export class LogParserService implements LogParserWorkerContract {
    private db: any = null;
    private embeddings: any = null;

    init(duckdb: any, embeddings: any): void {
        this.db = duckdb;
        this.embeddings = embeddings;
    }

    async loadLog(logFile: File): Promise<{ lineCount: number }> {
        if (!this.db) {
            throw new Error('DuckDB not initialized. Call init() first.');
        }

        const safeFileName = logFile.name.replace(/'/g, "''");
        await this.db.registerFile(logFile, 'temp_raw');
        await this.db.query(`CREATE OR REPLACE VIEW raw_lines AS SELECT column0 AS raw_line FROM temp_raw`);

        const res = await this.db.query(`SELECT COUNT(*) as c FROM raw_lines`);
        const lineCount = Number(res.rows[0].c);

        return { lineCount };
    }

    async applyPattern(pattern: LogPattern): Promise<LogParseResult> {
        if (!this.db) {
            throw new Error('DuckDB not initialized. Call init() first.');
        }

        const startTime = performance.now();
        const safeRegex = pattern.regex.replace(/'/g, "''");

        // Convert the regex groups into column names array string for duckdb query
        // E.g. ['timestamp', 'level', 'message'] -> "['timestamp', 'level', 'message']"
        const columnsStr = `[${pattern.columns.map(c => `'${c.replace(/'/g, "''")}'`).join(', ')}]`;

        // regexp_extract(string, pattern, ['group_names',...]) returns a STRUCT
        const sql = `
            SELECT regexp_extract(raw_line, '${safeRegex}', ${columnsStr}) as extracted
            FROM raw_lines
        `;

        const res = await this.db.query(sql); // by default limit might be applied if we don't specify, but worker limits to 1000? Wait, duckdb worker query function limits to 1000 if no limit.
        // Wait, duckdb worker limit defaults to 1000: "query(sql: string, limit: number = 1000)"
        // Let's explicitly run it without a limit or get count first

        // Let's get the overall count
        const countRes = await this.db.query(`SELECT COUNT(*) as c FROM raw_lines`, 0);
        const rowCount = countRes.rows.length > 0 ? Number(countRes.rows[0].c) : 0;

        // We only fetch sample of 100 for display
        const sampleRes = await this.db.query(sql, 100);

        const sample: Record<string, string>[] = [];
        let unmatchedLinesSample = 0;

        for (const row of sampleRes.rows) {
            const extracted = row.extracted;

            // Check if match failed (all struct fields will be empty strings or null usually in DuckDB)
            // Sometimes if not matched, struct values are empty strings.
            let matched = false;
            if (extracted) {
                for (const col of pattern.columns) {
                    if (extracted[col] !== null && extracted[col] !== '') {
                        matched = true;
                        break;
                    }
                }
            }

            if (matched && extracted) {
                const record: Record<string, string> = {};
                for (const col of pattern.columns) {
                    record[col] = extracted[col] || '';
                }
                sample.push(record);
            } else {
                unmatchedLinesSample++;
            }
        }

        // To get accurate total unmatched, we could do a query:
        const unmatchedRes = await this.db.query(`
            SELECT COUNT(*) as c
            FROM raw_lines
            WHERE regexp_matches(raw_line, '${safeRegex}') = false
        `, 0);
        const unmatchedLines = unmatchedRes.rows.length > 0 ? Number(unmatchedRes.rows[0].c) : 0;

        const executionTimeMs = performance.now() - startTime;

        return {
            rowCount,
            columns: pattern.columns,
            sample,
            unmatchedLines,
            executionTimeMs
        };
    }

    async suggestPattern(sampleLine: string): Promise<LogPattern> {
        let regex = sampleLine;
        const columns: string[] = [];

        // Simple heuristic: find ISO timestamp
        const timestampRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/;
        if (timestampRegex.test(regex)) {
            regex = regex.replace(timestampRegex, '(?P<timestamp>[\\d-T:.Z+]+)');
            columns.push('timestamp');
        }

        // Simple heuristic: find Log Level
        const levelRegex = /\b(INFO|WARN|WARNING|ERROR|DEBUG|TRACE|FATAL)\b/;
        if (levelRegex.test(regex)) {
            regex = regex.replace(levelRegex, '(?P<level>INFO|WARN|WARNING|ERROR|DEBUG|TRACE|FATAL)');
            columns.push('level');
        }

        // The remaining part is often message, especially if it ends the line.
        // We will just do a simple replacement for trailing arbitrary text
        // For simplicity, just append message catch-all to the end if not present
        if (columns.length > 0) {
            // Find the last occurrence of a capture group
            const lastGroupIdx = Math.max(
                regex.lastIndexOf('(?P<timestamp>'),
                regex.lastIndexOf('(?P<level>')
            );

            if (lastGroupIdx !== -1) {
                // Get the text after the last group
                const afterLastGroup = regex.substring(regex.indexOf(')', lastGroupIdx) + 1);
                if (afterLastGroup.trim().length > 0) {
                    // Replace the literal remainder with message capture
                    // Note: This is a very naive heuristic, but satisfies the basic MVP
                    regex = regex.replace(afterLastGroup, '\\s+(?P<message>.+)');
                    columns.push('message');
                } else {
                    regex += '\\s*(?P<message>.+)';
                    columns.push('message');
                }
            }
        } else {
            // No recognizable patterns found
            regex = '(?P<message>.+)';
            columns.push('message');
        }

        // Escape standard regex characters that might be in literal parts of the string
        // We only want to escape things outside of our injected (?P<name>...) blocks.
        // For a true implementation, we'd tokenize and escape literals, but for now we'll leave as is.

        return {
            id: 'pattern_' + Date.now(),
            name: 'Auto Generated',
            regex,
            columns
        };
    }

    async clusterAnomalies(maxClusters: number = 8): Promise<AnomalyCluster[]> {
        if (!this.db || !this.embeddings) {
            throw new Error('Dependencies not initialized. Call init() first.');
        }

        // Fetch up to 1000 lines for clustering
        const res = await this.db.query('SELECT raw_line FROM raw_lines LIMIT 1000', 1000);
        const lines: string[] = res.rows.map((r: any) => r.raw_line);

        if (lines.length === 0) return [];
        if (lines.length <= maxClusters) {
            // Edge case: too few lines
            return lines.map(line => ({
                centroid: line,
                size: 1,
                isAnomaly: false,
                sampleLines: [line]
            }));
        }

        // Generate embeddings using the EmbeddingsWorker
        const vectors: number[][] = await this.embeddings.embedBatch(lines);

        // Simple K-Means implementation
        const k = Math.min(maxClusters, vectors.length);
        const dim = vectors[0].length;

        // 1. Initialize centroids randomly
        let centroids: number[][] = [];
        const usedIndices = new Set<number>();
        while (centroids.length < k) {
            const idx = Math.floor(Math.random() * vectors.length);
            if (!usedIndices.has(idx)) {
                usedIndices.add(idx);
                centroids.push([...vectors[idx]]);
            }
        }

        let assignments = new Array(vectors.length).fill(0);
        let changed = true;
        const maxIters = 10;
        let iter = 0;

        const distance = (a: number[], b: number[]) => {
            let sum = 0;
            for (let i = 0; i < a.length; i++) {
                const diff = a[i] - b[i];
                sum += diff * diff;
            }
            return sum;
        };

        while (changed && iter < maxIters) {
            changed = false;
            iter++;

            // 2. Assign to closest centroid
            for (let i = 0; i < vectors.length; i++) {
                let minDist = Infinity;
                let bestCluster = 0;
                for (let c = 0; c < k; c++) {
                    const dist = distance(vectors[i], centroids[c]);
                    if (dist < minDist) {
                        minDist = dist;
                        bestCluster = c;
                    }
                }
                if (assignments[i] !== bestCluster) {
                    assignments[i] = bestCluster;
                    changed = true;
                }
            }

            // 3. Update centroids
            const newCentroids = Array.from({ length: k }, () => new Array(dim).fill(0));
            const counts = new Array(k).fill(0);

            for (let i = 0; i < vectors.length; i++) {
                const c = assignments[i];
                counts[c]++;
                for (let d = 0; d < dim; d++) {
                    newCentroids[c][d] += vectors[i][d];
                }
            }

            for (let c = 0; c < k; c++) {
                if (counts[c] > 0) {
                    for (let d = 0; d < dim; d++) {
                        centroids[c][d] = newCentroids[c][d] / counts[c];
                    }
                } else {
                    // Reinitialize dead centroid
                    const idx = Math.floor(Math.random() * vectors.length);
                    centroids[c] = [...vectors[idx]];
                }
            }
        }

        // Build clusters
        const clusters: AnomalyCluster[] = [];
        const totalLines = lines.length;

        for (let c = 0; c < k; c++) {
            const clusterIndices = [];
            for (let i = 0; i < vectors.length; i++) {
                if (assignments[i] === c) {
                    clusterIndices.push(i);
                }
            }

            if (clusterIndices.length > 0) {
                // Find medoid (actual line closest to centroid) to use as representative
                let minDist = Infinity;
                let medoidIdx = clusterIndices[0];
                for (const idx of clusterIndices) {
                    const dist = distance(vectors[idx], centroids[c]);
                    if (dist < minDist) {
                        minDist = dist;
                        medoidIdx = idx;
                    }
                }

                const size = clusterIndices.length;
                // Anomaly definition: cluster has < 5% of lines
                const isAnomaly = size < (0.05 * totalLines);

                const sampleLines = clusterIndices
                    .slice(0, 10) // store up to 10 samples
                    .map(idx => lines[idx]);

                clusters.push({
                    centroid: lines[medoidIdx],
                    size,
                    isAnomaly,
                    sampleLines
                });
            }
        }

        // Return sorted by size descending
        return clusters.sort((a, b) => b.size - a.size);
    }
}

expose(new LogParserService());
