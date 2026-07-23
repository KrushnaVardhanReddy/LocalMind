export interface WebLLMWorkerContract {
    loadModel(modelId: string, onProgress?: (progress: number, text: string) => void): Promise<void>;
    chat(messages: ChatMessage[], systemPrompt?: string, onChunk?: (chunk: string) => void): Promise<void>;
    complete(prompt: string, maxTokens?: number): Promise<string>;
    getLoadedModel(): Promise<string | null>;
    unloadModel(): Promise<void>;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
