import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';
test.describe('Phase 2 - Docs Workspace - OCR', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/docs');
    });
    test('should extract text from an uploaded image (PNG) and toggle original/enhanced views', async ({ page }) => {
        test.skip(!process.env.RUN_WASM_TESTS, 'Requires WASM/GPU — set RUN_WASM_TESTS=1');
        const extractTab = page.getByRole('button', { name: /extract/i });
        await extractTab.click();
        const filePath = resolve(import.meta.dirname, '../fixtures/docs/sample_invoice.png');
        const fileContent = readFileSync(filePath);
        const base64File = fileContent.toString('base64');
        const mimeType = 'image/png';
        const fileName = 'sample_invoice.png';
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
        await expect(page.getByText('OCR Complete')).toBeVisible({ timeout: 60000 });
        await expect(page.getByText('Extracted Text')).toBeVisible();
        const extractedText = await page.locator('pre').textContent();
        expect(extractedText).toContain('sample document for testing OCR');
        // Assert confidence is rendered
        await expect(page.getByText(/Overall Confidence: \d+%/)).toBeVisible();
        const originalBtn = page.getByRole('button', { name: 'Original' });
        const enhancedBtn = page.getByRole('button', { name: 'Enhanced' });
        await expect(originalBtn).toBeVisible();
        await expect(enhancedBtn).toBeVisible();
        await originalBtn.click();
        await page.waitForTimeout(500); // Wait for processing state change
        await expect(page.getByText('OCR Complete')).toBeVisible({ timeout: 30000 });
        await enhancedBtn.click();
        await page.waitForTimeout(500);
        await expect(page.getByText('OCR Complete')).toBeVisible({ timeout: 30000 });
    });
    test('should extract text from an uploaded PDF', async ({ page }) => {
        test.skip(!process.env.RUN_WASM_TESTS, 'Requires WASM/GPU — set RUN_WASM_TESTS=1');
        const extractTab = page.getByRole('button', { name: /extract/i });
        await extractTab.click();
        const filePath = resolve(import.meta.dirname, '../fixtures/docs/sample_invoice.pdf');
        const fileContent = readFileSync(filePath);
        const base64File = fileContent.toString('base64');
        const mimeType = 'application/pdf';
        const fileName = 'sample_invoice.pdf';
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
        await expect(page.getByText('PDF Page 1 OCR Complete')).toBeVisible({ timeout: 60000 });
        await expect(page.getByText('Extracted Text')).toBeVisible();
        const extractedText = await page.locator('pre').textContent();
        expect(extractedText).toContain('sample document for testing OCR');
        // Assert confidence is rendered
        await expect(page.getByText(/Overall Confidence: \d+%/)).toBeVisible();
    });
});
