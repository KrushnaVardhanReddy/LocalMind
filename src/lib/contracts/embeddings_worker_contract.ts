export interface EmbeddingsWorkerContract {
    /**
     * Check if AI models are enabled by the user. By default, this is false for privacy and resource conservation.
     */
    isAIEnabled(): Promise<boolean>;

    /**
     * Explicitly enable AI models. This triggers the download/loading of the model.
     */
    enableAI(): Promise<void>;

    /**
     * Disable AI models and prevent loading.
     */
    disableAI(): Promise<void>;
    /**
     * Downloads and initializes the embedding model (all-MiniLM-L6-v2).
     */
    init(): Promise<void>;

    /**
     * Generates a 384-dimensional embedding vector for a text string.
     */
    embed(text: string): Promise<number[]>;

    /**
     * Batches embedding generation for an array of text chunks.
     */
    embedBatch(chunks: string[]): Promise<number[][]>;

    /**
     * Computes cosine similarity between a query vector and multiple chunk vectors.
     * Returns an array of similarity scores.
     * chunkBlobs are the raw Float32Array bytes from the database.
     */
    computeSimilarity(queryVector: number[], chunkBlobs: Uint8Array[]): Promise<number[]>;
}
