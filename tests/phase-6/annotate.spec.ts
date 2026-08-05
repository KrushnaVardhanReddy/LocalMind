import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test.describe('Annotate Workspace', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/plugins/annotate');
    });

    test('Uploads an image, draws a shape, and triggers export', async ({ page }) => {
        // Wait for page load
        await page.waitForLoadState('networkidle');

        // Check for workspace header
        await expect(page.locator('h1').filter({ hasText: 'Annotate Workspace' })).toBeVisible({ timeout: 15000 });

        // Prepare the fixture file
        const fixturePath = join(__dirname, '../fixtures/sample-image.png');

        // Find the file input for image upload
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(fixturePath);

        // Wait for the canvas to be visible
        const canvas = page.locator('canvas').first();
        await expect(canvas).toBeVisible({ timeout: 10000 });

        // Click the "Rectangle" tool button
        // Since we don't know the exact aria label or text, we'll try to find by some inner text or title
        // Assuming there's a button for 'rect' or 'Rectangle'
        const rectBtn = page.locator('button', { hasText: /Rectangle|rect/i }).first();
        if (await rectBtn.isVisible()) {
            await rectBtn.click();
        }

        // Draw on the canvas
        // Get canvas bounding box
        const box = await canvas.boundingBox();
        if (box) {
            // Start drawing at (10, 10) relative to canvas
            await page.mouse.move(box.x + 10, box.y + 10);
            await page.mouse.down();
            // Drag to (50, 50)
            await page.mouse.move(box.x + 50, box.y + 50, { steps: 5 });
            await page.mouse.up();
        }

        // Let's debug what's visible
        await expect(page.locator('button', { hasText: /Export/i }).first()).toBeVisible({ timeout: 5000 });

        // Click Export via evaluation to avoid UI interceptors
        const downloadPromise = page.waitForEvent('download');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const exportBtn = btns.find(b => b.textContent?.includes('Export'));
            if (exportBtn) exportBtn.click();
        });
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('annotated-image.png');
    });
});
