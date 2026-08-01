import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import DocsPage from './+page.svelte';
import { WorkerManager } from '$lib/workers/WorkerManager';

// Mock WorkerManager
vi.mock('$lib/workers/WorkerManager', () => {
    return {
        WorkerManager: {
            getTesseract: vi.fn().mockResolvedValue({
                init: vi.fn(),
                recognizeImage: vi.fn(),
                recognizePDF: vi.fn(),
                onProgress: undefined
            }),
            getOpenCV: vi.fn().mockResolvedValue({
                enhance_and_deskew: vi.fn()
            }),
            getNER: vi.fn().mockResolvedValue({
                init: vi.fn(),
                detectPII: vi.fn()
            }),
            getMuPDF: vi.fn().mockResolvedValue({
                loadPDF: vi.fn(),
                renderPage: vi.fn(),
                applyRedactions: vi.fn()
            }),
            getEmbeddings: vi.fn().mockResolvedValue({
                init: vi.fn(),
                embed: vi.fn(),
                embedBatch: vi.fn(),
                computeSimilarity: vi.fn()
            }),
            getSQLite: vi.fn().mockResolvedValue({
                createWorkspace: vi.fn(),
                insertDocumentChunk: vi.fn(),
                getAllDocumentChunks: vi.fn()
            })
        }
    };
});

describe('Docs Page Layout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the sidebar correctly', () => {
        render(DocsPage);
        const sidebar = screen.getByTestId('docs-sidebar');
        expect(sidebar).toBeTruthy();

        // Check for File List section
        const fileList = screen.getByTestId('sidebar-file-list');
        expect(fileList).toBeTruthy();
        expect(fileList.textContent).toContain('File List');

        // Check for OCR Queue section
        const ocrQueue = screen.getByTestId('sidebar-ocr-queue');
        expect(ocrQueue).toBeTruthy();
        expect(ocrQueue.textContent).toContain('OCR Queue');
    });

    it('renders the main tabbed navigation correctly', () => {
        render(DocsPage);
        const tabsNav = screen.getByTestId('docs-tabs');
        expect(tabsNav).toBeTruthy();

        // Check for expected tabs
        expect(screen.getByTestId('tab-viewer')).toBeTruthy();
        expect(screen.getByTestId('tab-merge-split')).toBeTruthy();
        expect(screen.getByTestId('tab-redact')).toBeTruthy();
        expect(screen.getByTestId('tab-extract')).toBeTruthy();
    });

    it('defaults to the viewer tab and changes content when tabs are clicked', async () => {
        render(DocsPage);

        // Viewer is default
        expect(screen.getByText('Select a document to view')).toBeTruthy();

        // Click Extract tab
        const extractTab = screen.getByTestId('tab-extract');
        await fireEvent.click(extractTab);

        // Check if extract content is visible
        expect(screen.getByText('Docs Engine (OCR)')).toBeTruthy();
        expect(screen.getByText('Drag & Drop Documents Here')).toBeTruthy();

        // Click Merge & Split tab
        const mergeSplitTab = screen.getByTestId('tab-merge-split');
        await fireEvent.click(mergeSplitTab);

        expect(screen.getByText('Merge and Split tool (Coming Soon)')).toBeTruthy();

        // Click Redact tab
        const redactTab = screen.getByTestId('tab-redact');
        await fireEvent.click(redactTab);

        expect(screen.getByText('Redaction tool (Coming Soon)')).toBeTruthy();
    });

    it('initializes workers on mount', async () => {
        render(DocsPage);

        // Wait for microtasks to complete since onMount is async
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(WorkerManager.getTesseract).toHaveBeenCalled();
        expect(WorkerManager.getOpenCV).toHaveBeenCalled();
        expect(WorkerManager.getNER).toHaveBeenCalled();
        expect(WorkerManager.getMuPDF).toHaveBeenCalled();
        expect(WorkerManager.getEmbeddings).toHaveBeenCalled();
        expect(WorkerManager.getSQLite).toHaveBeenCalled();
    });
});
