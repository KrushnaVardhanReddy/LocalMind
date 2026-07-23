import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Phase 3: Video Clipper E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Check if we need to create a workspace
    const newWsInput = page.getByPlaceholder('New Workspace Name');
    if (await newWsInput.isVisible().catch(() => false)) {
        await newWsInput.fill('Test WS');
        await page.getByRole('button', { name: 'New Workspace' }).click();
        await page.waitForTimeout(1000);
    }
  });

  test('Video clipper exports a trimmed clip', async ({ page }) => {
    test.setTimeout(180000);
    const fixturePath = path.resolve(__dirname, '../fixtures/media/sample_video.mp4');

    await page.goto('/media');

    const initMsg = page.getByText('Initializing FFmpeg WASM...');
    if (await initMsg.isVisible().catch(() => false)) {
        await initMsg.waitFor({ state: 'hidden', timeout: 60000 });
    }

    await page.waitForTimeout(1000);

    // Playwright natively handles setInputFiles for hidden file inputs
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(fixturePath);

    // In the media page, we need to click the 'Trim' tab
    const trimTab = page.locator('button').filter({ hasText: /^Trim$/i }).first();
    await expect(trimTab).toBeVisible({ timeout: 15000 });
    await trimTab.click();

    // Verify Trim Settings section is open
    await expect(page.getByText('Trim Settings')).toBeVisible({ timeout: 10000 });

    const trimBtn = page.locator('button').filter({ hasText: /^Trim$/ }).last();
    await expect(trimBtn).toBeEnabled({ timeout: 15000 });

    // We should wait for a bit to make sure it's fully ready to output. Sometimes FFmpeg isn't loaded completely
    // Click Trim and wait for the "Download" link to appear
    await trimBtn.click();
    
    const downloadLink = page.locator('a', { hasText: 'Download' }).last();
    await expect(downloadLink).toBeVisible({ timeout: 60000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await downloadLink.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename().endsWith('.mp4')).toBe(true);
  });

});
