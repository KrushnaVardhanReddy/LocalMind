import { expose } from 'comlink';
import { CreateMLCEngine, type MLCEngine, type InitProgressReport } from '@mlc-ai/web-llm';
import type { WebLLMWorkerContract, ChatMessage } from '../../../docs/contracts/phase-5/webllm_worker_contract';

export class WebLLMService implements WebLLMWorkerContract {
    private engine: MLCEngine | null = null;
    private currentModelId: string | null = null;

    async loadModel(modelId: string, onProgress?: (progress: number, text: string) => void): Promise<void> {
        if (this.engine) {
            await this.unloadModel();
        }

        const initProgressCallback = (report: InitProgressReport) => {
            if (onProgress) {
                // report.progress is between 0 and 1
                onProgress(report.progress, report.text);
            }
        };

        this.engine = await CreateMLCEngine(modelId, { initProgressCallback });
        this.currentModelId = modelId;
    }

    async chat(messages: ChatMessage[], systemPrompt?: string, onChunk?: (chunk: string) => void): Promise<void> {
        if (!this.engine) {
            throw new Error('Model is not loaded');
        }

        const msgs = systemPrompt
            ? [{ role: 'system' as const, content: systemPrompt }, ...messages.map(m => ({ role: m.role, content: m.content }))]
            : messages.map(m => ({ role: m.role, content: m.content }));

        const completion = await this.engine.chat.completions.create({
            messages: msgs,
            stream: true,
        });

        for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta && onChunk) {
                onChunk(delta);
            }
        }
    }

    async complete(prompt: string, maxTokens?: number): Promise<string> {
        if (!this.engine) {
            throw new Error('Model is not loaded');
        }

        const response = await this.engine.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
        });

        return response.choices[0]?.message?.content || '';
    }

    async getLoadedModel(): Promise<string | null> {
        return this.currentModelId;
    }

    async unloadModel(): Promise<void> {
        if (this.engine) {
            await this.engine.unload();
            this.engine = null;
            this.currentModelId = null;
        }
    }
}

expose(new WebLLMService());
