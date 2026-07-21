export interface LLMWorkerContract {
    setApiKey(key: string, provider: 'openai' | 'anthropic'): void;
    analyzeData(prompt: string, dataSample: string): Promise<string>;
}
