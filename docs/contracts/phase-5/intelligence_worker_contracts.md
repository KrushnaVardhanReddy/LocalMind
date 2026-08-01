# Contract: Phase 5 — Intelligence Worker Interfaces

## 1. WebLLM Worker Contract (Extended for Vision)

```typescript
// docs/contracts/phase-5/webllm_worker_contract.ts

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string | (TextContent | ImageContent)[];
}

export interface TextContent {
    type: 'text';
    text: string;
}

export interface ImageContent {
    type: 'image_url';
    image_url: {
        url: string; // Base64 Data URL for the dropped image
    };
}

export interface WebLLMWorkerContract {
    /**
     * Loads a text or vision-language model into WebGPU memory.
     */
    loadModel(modelId: string, onProgress?: (progress: number, text: string) => void): Promise<void>;

    /**
     * Executes a streaming chat completion. Supports multimodal message content.
     */
    chat(messages: ChatMessage[], systemPrompt?: string): AsyncGenerator<string>;

    /**
     * Executes a single prompt completion without streaming.
     */
    complete(prompt: string, maxTokens?: number): Promise<string>;

    getLoadedModel(): Promise<string | null>;
    unloadModel(): Promise<void>;
}
```
