import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';

test.describe('Phase 2 - Docs Workspace - Semantic Search', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/docs');
    });

    test('should index a document and return it in search results', async ({ page }) => {
        test.skip(!process.env.RUN_WASM_TESTS, 'Requires WASM/GPU — set RUN_WASM_TESTS=1');
        const extractTab = page.getByRole('button', { name: /extract/i });
        await extractTab.click();

        const filePath = resolve(import.meta.dirname, '../fixtures/docs/search_target.pdf');
        const fileContent = readFileSync(filePath);
        const base64File = fileContent.toString('base64');
        const mimeType = 'application/pdf';
        const fileName = 'search_target.pdf';

        // Wait for the side panel to be ready and indexing state to finish initialization
        const searchInput = page.getByPlaceholder('Search docs...');
        await expect(searchInput).toBeVisible();

        // Upload document
        await page.evaluate(
            ({ base64, fileName, mimeType }) => {
                const dropzone = document.querySelector('div[role="button"]');
                if (!dropzone) throw new Error('Dropzone not found');

                const byteCharacters = atob(base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const file = new File([byteArray], fileName, { type: mimeType });

                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);

                const event = new DragEvent('drop', {
                    bubbles: true,
                    cancelable: true,
                    dataTransfer: dataTransfer,
                });
                dropzone.dispatchEvent(event);
            },
            { base64: base64File, fileName, mimeType }
        );

        // Wait for OCR and indexing to complete
        await expect(page.getByText('PDF Page 1 OCR Complete')).toBeVisible({ timeout: 60000 });

        // Ensure indexing spinner/status is gone if we have one, otherwise wait a bit for SQLite
        await page.waitForTimeout(2000);

        // Perform search
        await searchInput.fill('machine learning');

        const searchBtn = page.locator('button[aria-label="Search button"]');
        await expect(searchBtn).not.toBeDisabled();
        await searchBtn.click();

        // Check if results are rendered in the panel
        const searchResultsPanel = page.getByTestId('sidebar-search-panel');
        await expect(searchResultsPanel.getByText('search_target.pdf')).toBeVisible({ timeout: 30000 });

        // Assert we see a chunk snippet with the expected match
        await expect(searchResultsPanel.getByText(/machine learning/i).first()).toBeVisible();

        // Assert confidence/score is rendered
        await expect(searchResultsPanel.getByText(/%\s*$/).first()).toBeVisible();
    });
});
