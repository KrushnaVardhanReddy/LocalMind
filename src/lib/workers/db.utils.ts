export function getAISettingsDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('localmind_ai_settings', 1);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings');
            }
        };
        request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
        request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
}

export async function isAIEnabled(): Promise<boolean> {
    const db = await getAISettingsDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        const request = store.get('ai_enabled');
        request.onsuccess = () => resolve(request.result === true);
        request.onerror = () => reject(request.error);
    });
}

export async function setAIEnabled(enabled: boolean): Promise<void> {
    const db = await getAISettingsDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        const request = store.put(enabled, 'ai_enabled');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
