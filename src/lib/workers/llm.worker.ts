import { expose } from 'comlink';
import { isAIEnabled, setAIEnabled } from './db.utils';

export interface LLMWorkerContract {
    isAIEnabled(): Promise<boolean>;
    enableAI(): Promise<void>;
    disableAI(): Promise<void>;
    setApiKey(key: string, provider: 'openai' | 'anthropic'): void;
    analyzeData(prompt: string, dataSample: string): Promise<string>;
    generateChartConfig(prompt: string, schema: Record<string, string>): Promise<any>;
    detectJoins(schemas: Record<string, string>[]): Promise<string[]>;
}

export class LLMService implements LLMWorkerContract {
    private apiKey: string = '';
    private provider: 'openai' | 'anthropic' = 'openai';

    async isAIEnabled(): Promise<boolean> {
        return await isAIEnabled();
    }

    async enableAI(): Promise<void> {
        await setAIEnabled(true);
    }

    async disableAI(): Promise<void> {
        await setAIEnabled(false);
    }

    setApiKey(key: string, provider: 'openai' | 'anthropic'): void {
        this.apiKey = key;
        this.provider = provider;
    }

    async analyzeData(prompt: string, dataSample: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('API key is not set');
        }

        const systemContent = 'You are a data analysis assistant. You will be provided with a prompt, schema, and sample data. Please analyze the data and provide insights in Markdown format.';
        const userContent = `Prompt: ${prompt}\n\nData Sample:\n${dataSample}`;

        if (this.provider === 'openai') {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: systemContent },
                        { role: 'user', content: userContent }
                    ]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } else if (this.provider === 'anthropic') {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerously-allow-browser': 'true'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20240620',
                    max_tokens: 1024,
                    system: systemContent,
                    messages: [
                        { role: 'user', content: userContent }
                    ]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data.content[0].text;
        }

        throw new Error('Unsupported provider');
    }

    async generateChartConfig(prompt: string, schema: Record<string, string>): Promise<any> {
        if (!this.apiKey) {
            throw new Error('API key is not set');
        }

        const schemaStr = JSON.stringify(schema, null, 2);
        const systemContent = `You are an expert ECharts and DuckDB developer.
Based on the user's prompt and the provided schema for a table named 'table', generate a JSON object with two keys:
1. "sql": A valid DuckDB SQL query string to aggregate or filter the data as requested. It must query from 'table'.
2. "option": A valid ECharts configuration object. Do not include 'dataset' or 'series.data' directly with values in 'option'; assume the frontend will inject the DuckDB query results using ECharts dataset { source: ... } format and the series will reference it via encode/dimensions, OR just provide standard axes and series types and the frontend will map the results. The frontend expects 'dataset: { source: rowData }' to be injected by the app.
Output ONLY valid JSON. No markdown code blocks, just raw JSON text.`;

        const userContent = `Schema:\n${schemaStr}\n\nUser Request: ${prompt}`;

        let rawText = '';

        if (this.provider === 'openai') {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [ { role: 'system', content: systemContent }, { role: 'user', content: userContent } ]
                })
            });
            if (!response.ok) throw new Error(`OpenAI API error: ${response.status} - ${await response.text()}`);
            const data = await response.json();
            rawText = data.choices[0].message.content;
        } else if (this.provider === 'anthropic') {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerously-allow-browser': 'true' },
                body: JSON.stringify({ model: 'claude-3-5-sonnet-20240620', max_tokens: 1024, system: systemContent, messages: [ { role: 'user', content: userContent } ] })
            });
            if (!response.ok) throw new Error(`Anthropic API error: ${response.status} - ${await response.text()}`);
            const data = await response.json();
            rawText = data.content[0].text;
        } else {
            throw new Error('Unsupported provider');
        }

        let cleanText = rawText.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith('```')) {
            cleanText = cleanText.substring(0, cleanText.length - 3);
        }

        return JSON.parse(cleanText.trim());
    }

    async detectJoins(schemas: Record<string, string>[]): Promise<string[]> {
        if (!this.apiKey) {
            throw new Error('API key is not set');
        }

        const schemasStr = JSON.stringify(schemas, null, 2);
        const systemContent = `You are a database expert.
You will be provided with a JSON array of table schemas. Each object in the array represents a table. The first element is table_1, the second is table_2, etc. Or you can just use the indices provided if we pass object like: { table_name: { schema } }.
Actually, to be unambiguous, the input will be an array of objects where each object is { "tableName": "name", "schema": { ... } }.
Your task is to analyze the columns and return a JSON array of suggested SQL JOIN clauses (just the JOIN part, e.g., "table_1 ON table_1.id = table_2.table_1_id").
Only return a JSON array of strings. Do not include markdown formatting or explanations.`;

        // The method signature is detectJoins(schemas: Record<string, string>[]), meaning we just get an array of schemas. We can assume the tables are uploadedTables[0], uploadedTables[1], etc.
        // Let's pass the schema mapping directly.
        // We will modify the input in the worker for clarity, but the prompt should handle it.

        const userContent = `Schemas:\n${schemasStr}\n\nProvide the suggested join clauses as a JSON array of strings.`;

        let rawText = '';

        if (this.provider === 'openai') {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [ { role: 'system', content: systemContent }, { role: 'user', content: userContent } ]
                })
            });
            if (!response.ok) throw new Error(`OpenAI API error: ${response.status} - ${await response.text()}`);
            const data = await response.json();
            rawText = data.choices[0].message.content;
        } else if (this.provider === 'anthropic') {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerously-allow-browser': 'true' },
                body: JSON.stringify({ model: 'claude-3-5-sonnet-20240620', max_tokens: 1024, system: systemContent, messages: [ { role: 'user', content: userContent } ] })
            });
            if (!response.ok) throw new Error(`Anthropic API error: ${response.status} - ${await response.text()}`);
            const data = await response.json();
            rawText = data.content[0].text;
        } else {
            throw new Error('Unsupported provider');
        }

        let cleanText = rawText.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith('```')) {
            cleanText = cleanText.substring(0, cleanText.length - 3);
        }

        return JSON.parse(cleanText.trim());
    }
}

expose(new LLMService());
