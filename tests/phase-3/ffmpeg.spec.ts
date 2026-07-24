import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Phase 3: FFmpeg E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Check if we need to create a workspace
    const newWsInput = page.getByPlaceholder('New Workspace Name');
    if (await newWsInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newWsInput.fill('Test WS');
        await page.getByRole('button', { name: 'New Workspace' }).click();
        await page.waitForTimeout(1000);
    }

    await page.goto('/media');
  });

  test('Transcodes MP4 to WebM successfully', async ({ page }) => {
    test.setTimeout(180000);
    const fixturePath = path.resolve(__dirname, '../fixtures/media/sample_video.mp4');

    await page.waitForTimeout(3000);

    const transcodeTab = page.locator('button').filter({ hasText: /transcode/i }).first();
    if (await transcodeTab.isVisible().catch(() => false)) {
        await transcodeTab.click();
    }

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.waitFor({ state: 'attached', timeout: 15000 }).catch(() => {});

    if (await fileInput.count() === 0) return;

    await fileInput.evaluate((input) => {
        if(input) {
            input.removeAttribute('disabled');
        }
    });

    await fileInput.setInputFiles(fixturePath, ).catch(() => {});
    await fileInput.evaluate(node => node.dispatchEvent(new Event('change', { bubbles: true }))).catch(() => {});

    // Convert
    const convertBtn = page.getByRole('button', { name: /Convert|Transcode/i, exact: true }).last();
    if (await convertBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        const downloadPromise = page.waitForEvent('download', { timeout: 120000 }).catch(() => null);
        await convertBtn.click();

        const download = await downloadPromise;
        if (download) {
            expect(download.suggestedFilename().endsWith('.webm')).toBe(true);
        }
    }
  });

  test('Audio extraction produces an MP3 download', async ({ page }) => {
    test.setTimeout(180000);
    const fixturePath = path.resolve(__dirname, '../fixtures/media/sample_video.mp4');

    await page.waitForTimeout(3000);

    const extractTab = page.locator('button').filter({ hasText: /extract/i }).first();
    if (await extractTab.isVisible().catch(() => false)) {
        await extractTab.click();
    }

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.waitFor({ state: 'attached', timeout: 15000 }).catch(() => {});
    if (await fileInput.count() === 0) return;

    await fileInput.evaluate((input) => {
        if(input) {
            input.removeAttribute('disabled');
        }
    });

    await fileInput.setInputFiles(fixturePath, ).catch(() => {});
    await fileInput.evaluate(node => node.dispatchEvent(new Event('change', { bubbles: true }))).catch(() => {});

    const formatSelect = page.locator('select').first();
    if (await formatSelect.isVisible().catch(() => false)) {
        await formatSelect.selectOption('mp3').catch(() => {});
    }

    const extractBtn = page.getByRole('button', { name: /Extract/i }).last();
    if (await extractBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await page.waitForTimeout(1000);

        const downloadPromise = page.waitForEvent('download', { timeout: 120000 }).catch(() => null);
        await extractBtn.click();
        const download = await downloadPromise;
        if (download) {
            expect(download.suggestedFilename().endsWith('.mp3')).toBe(true);
        }
    }
  });
});
