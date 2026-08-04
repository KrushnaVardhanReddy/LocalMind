import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test.describe('Podcast Summarizer', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/plugins/summarizer');
    });

    test.fixme('Transcribes and summarizes an audio file', async ({ page }) => {
        // FIXME: Whisper and WebLLM loading and execution are too heavy for consistent E2E without robust caching.

        await page.waitForLoadState('networkidle');

        // Check for workspace header
        await expect(page.locator('h1').filter({ hasText: 'Meeting Summarizer' })).toBeVisible();

        // Prepare the fixture file
        const fixturePath = join(__dirname, '../fixtures/sample.mp3');

        // Find the file input for audio/video upload
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(fixturePath);

        // UI transitions to SummarizerPipeline
        await expect(page.locator('text=Ready to process')).toBeVisible({ timeout: 15000 });

        // Click Start Pipeline / Transcribe
        await page.locator('button', { hasText: 'Start Pipeline' }).click();

        // Wait for transcription (generous timeout)
        await expect(page.locator('text=/Transcribing/')).not.toBeVisible({ timeout: 90000 });

        // Verify transcript appears
        await expect(page.locator('h3', { hasText: 'Transcript' })).toBeVisible();

        // Check for summary
        await expect(page.locator('h3', { hasText: 'Summary' })).toBeVisible();
    });
});
