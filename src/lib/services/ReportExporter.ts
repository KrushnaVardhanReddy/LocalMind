export interface ExportConfig {
    title: string;
    includePivot: boolean;
    includeChart: boolean;
    includeAiInsight: boolean;
    includeSql: boolean;
    includeRawData: boolean;
    theme: 'light' | 'dark';
}

export interface ExportData {
    pivotResult?: { columns: string[], rows: any[] } | null;
    pivotChartBase64?: string | null;
    chartBase64?: string | null;
    aiInsight?: string | null;
    generatedSql?: string | null;
    rawResult?: { columns: string[], rows: any[] } | null;
}

export class ReportExporter {
    static async generateHtml(config: ExportConfig, data: ExportData): Promise<string> {
        const themeStyles = config.theme === 'dark'
            ? `
                :root {
                    --bg-color: #1a202c;
                    --text-color: #e2e8f0;
                    --border-color: #2d3748;
                    --table-header-bg: #2d3748;
                    --table-row-hover: #2d3748;
                    --accent-color: #9f7aea;
                }
            `
            : `
                :root {
                    --bg-color: #ffffff;
                    --text-color: #1a202c;
                    --border-color: #e2e8f0;
                    --table-header-bg: #f7fafc;
                    --table-row-hover: #f7fafc;
                    --accent-color: #6b46c1;
                }
            `;

        const baseStyles = `
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: var(--bg-color);
                color: var(--text-color);
                line-height: 1.6;
                margin: 0;
                padding: 2rem;
                max-width: 1200px;
                margin-left: auto;
                margin-right: auto;
            }
            h1 {
                border-bottom: 2px solid var(--border-color);
                padding-bottom: 0.5rem;
                margin-bottom: 2rem;
            }
            h2 {
                margin-top: 2rem;
                color: var(--accent-color);
            }
            .section {
                margin-bottom: 3rem;
                background: var(--bg-color);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 1.5rem;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 1rem;
            }
            th, td {
                border: 1px solid var(--border-color);
                padding: 0.75rem;
                text-align: left;
            }
            th {
                background-color: var(--table-header-bg);
                font-weight: 600;
            }
            tr:hover {
                background-color: var(--table-row-hover);
            }
            .footer {
                margin-top: 4rem;
                padding-top: 1rem;
                border-top: 1px solid var(--border-color);
                text-align: center;
                font-size: 0.875rem;
                color: #718096;
            }
            .footer a {
                color: var(--accent-color);
                text-decoration: none;
            }
            .footer a:hover {
                text-decoration: underline;
            }
            img {
                max-width: 100%;
                height: auto;
                display: block;
                margin: 1rem auto;
            }
            pre {
                background-color: var(--table-header-bg);
                padding: 1rem;
                border-radius: 4px;
                overflow-x: auto;
                border: 1px solid var(--border-color);
            }
            code {
                font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
                font-size: 0.875rem;
            }
            blockquote {
                border-left: 4px solid var(--accent-color);
                margin: 0;
                padding: 1rem;
                background-color: var(--table-header-bg);
                border-radius: 0 4px 4px 0;
            }
        `;

        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(config.title)}</title>
    <style>
        ${themeStyles}
        ${baseStyles}
    </style>
</head>
<body>
    <h1>${this.escapeHtml(config.title)}</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
`;

        if (config.includeAiInsight && data.aiInsight) {
            html += `
    <div class="section">
        <h2>AI Insight</h2>
        <blockquote>
            ${data.aiInsight}
        </blockquote>
    </div>`;
        }

        if (config.includeChart && data.chartBase64) {
            html += `
    <div class="section">
        <h2>Chart</h2>
        <img src="${data.chartBase64}" alt="Generated Chart" />
    </div>`;
        }

        if (config.includePivot && data.pivotResult) {
            html += `
    <div class="section">
        <h2>Pivot Table</h2>`;

            if (data.pivotChartBase64) {
                html += `<img src="${data.pivotChartBase64}" alt="Pivot Chart" />`;
            }

            html += `
        <div style="overflow-x: auto;">
            <table>
                <thead>
                    <tr>
                        ${data.pivotResult.columns.map(col => `<th>${this.escapeHtml(col)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.pivotResult.rows.map(row => `
                    <tr>
                        ${data.pivotResult!.columns.map(col => {
                            const val = row[col];
                            return `<td>${val !== null && val !== undefined ? (typeof val === 'number' ? val.toLocaleString(undefined, {maximumFractionDigits: 2}) : this.escapeHtml(String(val))) : 'NULL'}</td>`;
                        }).join('')}
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>`;
        }

        if (config.includeSql && data.generatedSql) {
            html += `
    <div class="section">
        <h2>Generated SQL</h2>
        <pre><code>${this.escapeHtml(data.generatedSql)}</code></pre>
    </div>`;
        }

        if (config.includeRawData && data.rawResult) {
            // Limiting to 100 rows is part of the feature requirement
            const rows = data.rawResult.rows.slice(0, 100);
            html += `
    <div class="section">
        <h2>Raw Data (First ${rows.length} rows)</h2>
        <div style="overflow-x: auto;">
            <table>
                <thead>
                    <tr>
                        ${data.rawResult.columns.map(col => `<th>${this.escapeHtml(col)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                    <tr>
                        ${data.rawResult!.columns.map(col => {
                            const val = row[col];
                            return `<td>${val !== null && val !== undefined ? this.escapeHtml(String(val)) : 'NULL'}</td>`;
                        }).join('')}
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>`;
        }

        html += `
    <div class="footer">
        Generated by <a href="https://localmind.dev" target="_blank" rel="noopener noreferrer">LocalMind</a> — privacy-first local analytics.
    </div>
</body>
</html>`;

        return html;
    }

    private static escapeHtml(unsafe: string): string {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
}
