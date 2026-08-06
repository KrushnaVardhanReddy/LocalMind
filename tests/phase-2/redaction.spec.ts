import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';
test.describe('Phase 2 - Docs Workspace - Redaction', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/docs');
    });
    test('should scan for PII and allow redaction', async ({ page }) => {
        test.skip(!process.env.RUN_WASM_TESTS, 'Requires WASM/GPU — set RUN_WASM_TESTS=1');
        const extractTab = page.getByRole('button', { name: /extract/i });
        await extractTab.click();
        const filePath = resolve(import.meta.dirname, '../fixtures/docs/resume_pii.pdf');
        const fileContent = readFileSync(filePath);
        const base64File = fileContent.toString('base64');
        const mimeType = 'application/pdf';
        const fileName = 'resume_pii.pdf';
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
        const scanBtn = page.getByRole('button', { name: 'Scan for PII' });
        await scanBtn.click();
        // Check if PII entities are shown
        await expect(page.getByText('John Doe').nth(1)).toBeVisible({ timeout: 30000 });
        await expect(page.getByText('000-00-0000')).toBeVisible();
        const redactBtn = page.getByRole('button', { name: 'Apply Redactions' });
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('Redactions are permanent');
            await dialog.accept();
        });
        // Create a download listener to catch the download event
        const downloadPromise = page.waitForEvent('download');
        await redactBtn.click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('resume_pii_redacted.pdf');
    });
});
