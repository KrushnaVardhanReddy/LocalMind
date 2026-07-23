import { expose } from 'comlink';
import { pipeline, env, type FeatureExtractionPipeline, type Tensor } from '@xenova/transformers';
import type { EmbeddingsWorkerContract } from '../contracts/embeddings_worker_contract';
import { isAIEnabled, setAIEnabled } from './db.utils';

// Configure transformers.js environment for local execution
env.allowLocalModels = false; // We use remote CDN by default for now (or local if configured)
// We need to use local paths if we strictly want 100% offline but we will leave default for xenova remote to fetch the model
env.useBrowserCache = true;

class EmbeddingsService implements EmbeddingsWorkerContract {
    private embedder: FeatureExtractionPipeline | null = null;
    private aiEnabled: boolean = false;

    async isAIEnabled(): Promise<boolean> {
        return await isAIEnabled();
    }

    async enableAI(): Promise<void> {
        await setAIEnabled(true);
        await this.init(); // Pre-load the model
    }

    async disableAI(): Promise<void> {
        await setAIEnabled(false);
        this.embedder = null;
    }
    async init(): Promise<void> {
        if (!(await this.isAIEnabled())) {
            throw new Error("AI is disabled. Please enable AI capabilities in settings.");
        }

        if (this.embedder) return;
        // The spec specifically mentions 'Xenova/all-MiniLM-L6-v2'
        this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
            // Options if needed, but defaults are usually fine for this model
        });
    }

    private normalize(vector: number[]): number[] {
        const sumSq = vector.reduce((sum, val) => sum + val * val, 0);
        const norm = Math.sqrt(sumSq);
        if (norm === 0) return vector;
        return vector.map(val => val / norm);
    }

    async embed(text: string): Promise<number[]> {
        if (!this.embedder) {
            throw new Error("Embedder not initialized. Call init() first.");
        }

        // Generate embeddings
        const output: Tensor = await this.embedder(text, { pooling: 'mean', normalize: true });

        // Output.data is a Float32Array, convert to regular array
        const vector = Array.from(output.data as Float32Array);

        // L2 normalize just in case the pipeline's normalize: true didn't do it perfectly
        return this.normalize(vector);
    }

    async embedBatch(chunks: string[]): Promise<number[][]> {
        if (!this.embedder) {
            throw new Error("Embedder not initialized. Call init() first.");
        }

        const batchSize = 32;
        const results: number[][] = [];

        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);

            // Process the batch
            // The pipeline supports array input for batch processing
            const output: Tensor = await this.embedder(batch, { pooling: 'mean', normalize: true });

            // Output tensor shape is [batch_size, sequence_length]
            // where sequence_length is 384 for all-MiniLM-L6-v2
            const data = output.data as Float32Array;
            const dim = 384;

            for (let j = 0; j < batch.length; j++) {
                const start = j * dim;
                const end = start + dim;
                const vector = Array.from(data.slice(start, end));
                results.push(this.normalize(vector));
            }
        }

        return results;
    }

    async computeSimilarity(queryVector: number[], chunkBlobs: Uint8Array[]): Promise<number[]> {
        return chunkBlobs.map(blob => {
            // Reinterpret the Uint8Array buffer as a Float32Array without copying
            const floatArray = new Float32Array(blob.buffer, blob.byteOffset, blob.byteLength / 4);

            // Cosine similarity of normalized vectors is just the dot product
            let sum = 0;
            for (let i = 0; i < queryVector.length; i++) {
                sum += queryVector[i] * floatArray[i];
            }
            return sum;
        });
    }
}

// Export the class for testing, but expose the instance for comlink
export { EmbeddingsService };
expose(new EmbeddingsService());
