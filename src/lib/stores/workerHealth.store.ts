import { writable } from 'svelte/store';

export interface WorkerCrashEvent {
    id: string;
    workerName: string;
    error: string;
    timestamp: number;
    type: 'crash' | 'oom';
}

export const workerCrashes = writable<WorkerCrashEvent[]>([]);

export function addCrashEvent(event: Omit<WorkerCrashEvent, 'id' | 'timestamp'>) {
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    const fullEvent: WorkerCrashEvent = { ...event, id, timestamp };

    workerCrashes.update(crashes => {
        const newCrashes = [...crashes, fullEvent];
        if (newCrashes.length > 10) {
            newCrashes.shift();
        }
        return newCrashes;
    });

    setTimeout(() => {
        workerCrashes.update(crashes => crashes.filter(c => c.id !== id));
    }, 10000);
}
