import { test, expect } from '@playwright/test';
import { resolve } from 'path';

test.describe('Phase 2 - Docs Workspace - PDF Viewer', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/docs/pdf');
    });

    test('should show the default viewer tab and load a PDF', async ({ page }) => {
        const filePath = resolve(import.meta.dirname, '../fixtures/docs/sample_invoice.pdf');

        // Check if Viewer is selected
        const viewerHeading = page.locator('h2', { hasText: 'PDF Viewer' });
        await expect(viewerHeading).toBeVisible();

        await expect(page.getByText('Select a PDF to view.')).toBeVisible();

        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(filePath);

        // Wait for rendering
        await expect(page.getByText('Loading PDF and rendering pages...')).toBeVisible();

        // Assert rendering is complete (metadata visible, at least one page image)
        await expect(page.getByText(/Pages: \d+/)).toBeVisible({ timeout: 15000 });

        const pageImages = page.locator('img[alt^="Page "]');
        await expect(pageImages.first()).toBeVisible();
    });
});
