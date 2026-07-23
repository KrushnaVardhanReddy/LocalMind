import { WorkerManager } from './WorkerManager';
import type { TesseractWorkerContract, OCRResult } from './tesseract.worker';
import type { MuPDFWorkerContract } from './mupdf.worker';
import { extractDataFromText } from '../templates/template-matcher';

export type JobStatus = 'queued' | 'processing' | 'done' | 'error';

export interface BulkJob {
    file: File;
    status: JobStatus;
    result?: OCRResult | OCRResult[];
    error?: string;
    extractedData?: any; // To be populated by template system
    type?: string;
}

export class BulkProcessingQueue {
    private queue: BulkJob[] = [];
    private maxConcurrency: number = Math.min(navigator.hardwareConcurrency - 1, 4);
    private activeJobs: number = 0;

    // Optional callbacks to update UI
    public onProgress?: () => void;

    constructor(files: File[], onProgress?: () => void) {
        this.queue = files.map(file => ({ file, status: 'queued' }));
        this.onProgress = onProgress;
    }

    public getQueue(): BulkJob[] {
        return this.queue;
    }

    public async start() {
        this.processNext();
    }

    private async processNext() {
        if (this.activeJobs >= this.maxConcurrency) return;

        const nextJob = this.queue.find(j => j.status === 'queued');
        if (!nextJob) return; // All jobs are processing or done

        this.activeJobs++;
        nextJob.status = 'processing';
        if (this.onProgress) this.onProgress();

        // Spawn more if concurrency allows
        this.processNext();

        try {
            await this.processJob(nextJob);
        } catch (error: any) {
            nextJob.status = 'error';
            nextJob.error = error.message;
        } finally {
            this.activeJobs--;
            if (this.onProgress) this.onProgress();
            this.processNext();
        }
    }

    private async processJob(job: BulkJob) {
        const fileBuffer = await job.file.arrayBuffer();
        const tesseractWorker = await WorkerManager.getTesseract();
        await tesseractWorker.init();

        let text = '';
        if (job.file.name.toLowerCase().endsWith('.pdf')) {
            job.result = await tesseractWorker.recognizePDF(fileBuffer);
            text = (job.result as OCRResult[]).map(r => r.text).join('\n');
        } else {
            job.result = await tesseractWorker.recognizeImage(fileBuffer, job.file.type);
            text = (job.result as OCRResult).text;
        }

        const extracted = extractDataFromText(text);
        job.type = extracted.type;
        job.extractedData = extracted.data;

        job.status = 'done';
    }
}
