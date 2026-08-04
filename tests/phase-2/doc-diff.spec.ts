import { test, expect } from '@playwright/test';

test.describe('Phase 2 - Docs Workspace - Document Comparison', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/docs/compare');
    });

    test('should show the comparison interface and handle file selection', async ({ page }) => {
        // Check if correct UI is rendered
        await expect(page.getByText('Document Comparison (Redline Diffing)')).toBeVisible();
        await expect(page.getByText('Select Original PDF')).toBeVisible();
        await expect(page.getByText('Select Modified PDF')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Compare Documents' })).toBeDisabled();

        // Mock the File System Access API
        await page.evaluate(() => {
            (window as any).showOpenFilePicker = async () => {
                const blob = new Blob(['Mock PDF Content'], { type: 'application/pdf' });
                const file = new File([blob], 'mock_doc.pdf', { type: 'application/pdf' });
                return [{
                    name: file.name,
                    getFile: async () => file
                }];
            };
        });

        // Click Select Original
        await page.getByText('Select Original PDF').click();
        await expect(page.getByText('mock_doc.pdf').first()).toBeVisible();

        // Click Select Modified
        // We evaluate again to return a different file name if desired, or just use the same
        await page.evaluate(() => {
            (window as any).showOpenFilePicker = async () => {
                const blob = new Blob(['Mock Modified PDF Content'], { type: 'application/pdf' });
                const file = new File([blob], 'mock_doc_modified.pdf', { type: 'application/pdf' });
                return [{
                    name: file.name,
                    getFile: async () => file
                }];
            };
        });

        await page.getByText('Select Modified PDF').click();
        await expect(page.getByText('mock_doc_modified.pdf')).toBeVisible();

        // Check if compare button is now enabled
        const compareBtn = page.getByRole('button', { name: 'Compare Documents' });
        await expect(compareBtn).toBeEnabled();

        // As MuPDF extractText relies on a WASM worker loaded via Comlink,
        // a full E2E run of the actual comparison with mocked PDFs requires a valid PDF buffer.
        // The unit test covers the extraction logic mockup, but here we just check UI interactions up to the comparison click.
    });
});
