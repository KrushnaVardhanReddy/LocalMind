import { expose } from 'comlink';

export interface LLMWorkerContract {
    setApiKey(key: string, provider: 'openai' | 'anthropic'): void;
    analyzeData(prompt: string, dataSample: string): Promise<string>;
}

export class LLMService implements LLMWorkerContract {
    private apiKey: string = '';
    private provider: 'openai' | 'anthropic' = 'openai';

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
}

expose(new LLMService());
