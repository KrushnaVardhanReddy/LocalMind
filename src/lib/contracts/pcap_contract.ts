export interface PCAPWorkerContract {
    loadPCAP(file: File): Promise<{ file: File, hasCredentials: boolean }>;
}
