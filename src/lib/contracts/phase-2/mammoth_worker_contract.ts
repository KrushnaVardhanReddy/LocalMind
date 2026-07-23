export interface MammothWorkerContract {
    extractText(docxBuffer: ArrayBuffer): Promise<string>;
}
