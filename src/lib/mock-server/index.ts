import { setupWorker } from 'msw/browser';
import type { RequestHandler } from 'msw';

let workerInstance: ReturnType<typeof setupWorker> | null = null;

export async function startMockServer(handlers: RequestHandler[]) {
    if (workerInstance) {
        workerInstance.resetHandlers(...handlers);
    } else {
        workerInstance = setupWorker(...handlers);
        await workerInstance.start({ onUnhandledRequest: 'bypass' });
    }
    return workerInstance;
}

export function stopMockServer() {
    if (workerInstance) {
        workerInstance.stop();
        workerInstance = null;
    }
}
