type WorkerMessage<T = any> = {
  id: string;
  action: 'INIT' | 'LOAD_FILE' | 'EXECUTE_QUERY' | 'CANCEL_QUERY';
  payload: T;
};

type WorkerResponse<T = any> = {
  id: string;
  status: 'SUCCESS' | 'ERROR';
  data?: T;
  error?: string;
};

export class QueryEngine {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, { resolve: (data: any) => void; reject: (error: any) => void }>();

  constructor() {
    if (typeof window !== 'undefined') {
        // Initialize the worker only on the client side
        this.worker = new Worker(new URL('../workers/duckdb.worker.ts', import.meta.url), {
          type: 'module'
        });

        this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
          const { id, status, data, error } = e.data;
          const handlers = this.pendingRequests.get(id);

          if (handlers) {
            this.pendingRequests.delete(id);
            if (status === 'SUCCESS') {
              handlers.resolve(data);
            } else {
              handlers.reject(new Error(error || 'Worker error'));
            }
          }
        };
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private postMessage<T>(action: WorkerMessage['action'], payload: any): Promise<T> {
    if (!this.worker) {
      return Promise.reject(new Error('Worker is not initialized'));
    }

    return new Promise((resolve, reject) => {
      const id = this.generateId();
      this.pendingRequests.set(id, { resolve, reject });

      const message: WorkerMessage = {
        id,
        action,
        payload
      };

      this.worker!.postMessage(message);
    });
  }

  async init(): Promise<{ ready: boolean }> {
    return this.postMessage('INIT', {});
  }

  async executeQuery(query: string): Promise<{ rows: any[]; durationMs: number }> {
    return this.postMessage('EXECUTE_QUERY', { query });
  }

  async loadFile(tableName: string, fileFormat: 'CSV' | 'JSON' | 'PARQUET' | 'UNKNOWN', file: File): Promise<{ rowCount: number, schema: any[] }> {
    return this.postMessage('LOAD_FILE', { tableName, fileFormat, file });
  }
}

// Export a singleton instance
export const queryEngine = new QueryEngine();
