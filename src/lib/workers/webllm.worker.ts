import { expose } from 'comlink';
import { CreateMLCEngine, type MLCEngine, type InitProgressCallback } from '@mlc-ai/web-llm';
import type { ChatMessage, WebLLMWorkerContract } from '../contracts/phase-5/webllm_worker_contract';

export class WebLLMService implements WebLLMWorkerContract {
    private engine: MLCEngine | null = null;
    private currentModelId: string | null = null;

    async loadModel(modelId: string, onProgress?: (progress: number, text: string) => void): Promise<void> {
        let initProgressCallback: InitProgressCallback | undefined;

        if (onProgress) {
            initProgressCallback = (report) => {
                onProgress(report.progress, report.text);
            };
        }

        this.engine = await CreateMLCEngine(modelId, { initProgressCallback });
        this.currentModelId = modelId;
    }

    async chat(messages: ChatMessage[], systemPrompt?: string, onToken?: (token: string) => void): Promise<void> {
        if (!this.engine) {
            throw new Error('Model not loaded. Please call loadModel() first.');
        }

        const messagesToUse = [...messages];
        if (systemPrompt && messagesToUse.length > 0 && messagesToUse[0].role !== 'system') {
            messagesToUse.unshift({ role: 'system', content: systemPrompt });
        } else if (systemPrompt && messagesToUse.length > 0 && messagesToUse[0].role === 'system') {
            messagesToUse[0].content = systemPrompt;
        } else if (systemPrompt) {
            messagesToUse.push({ role: 'system', content: systemPrompt });
        }

        const asyncChunkGenerator = await this.engine.chat.completions.create({
            messages: messagesToUse as any,
            stream: true,
        });

        for await (const chunk of asyncChunkGenerator) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                if (onToken) {
                    onToken(content);
                }
            }
        }
    }

    async complete(prompt: string, maxTokens?: number): Promise<string> {
        if (!this.engine) {
            throw new Error('Model not loaded. Please call loadModel() first.');
        }

        const reply = await this.engine.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens
        });

        return reply.choices[0].message.content || '';
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
