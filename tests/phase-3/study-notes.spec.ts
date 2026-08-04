import { test, expect } from '@playwright/test';

test.describe('Study Notes & Flashcard Generator', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/plugins/study-notes');
    });

    test.fixme('Generates flashcards from text', async ({ page }) => {
        // FIXME: WebLLM requires downloading heavy models which can timeout or fail in CI/headless without caching.
        // We will mark this test as fixme for now.

        await page.waitForLoadState('networkidle');

        // Check for header
        await expect(page.locator('h1').filter({ hasText: 'Study Notes & Flashcards' })).toBeVisible();

        // Ensure LLM is loaded
        await expect(page.locator('text=/Loading model/')).not.toBeVisible({ timeout: 60000 });

        // Enter text
        const textarea = page.locator('textarea');
        await textarea.fill('Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water.');

        // Click generate
        await page.locator('button', { hasText: 'Generate Flashcards' }).click();

        // Wait for generation
        await expect(page.locator('text=Generating...')).not.toBeVisible({ timeout: 60000 });

        // Verify flashcard is present
        await expect(page.locator('.flashcard')).toBeVisible({ timeout: 15000 });

        // Assert some text inside the flashcard
        await expect(page.locator('.flashcard', { hasText: /Photosynthesis|plants/i }).first()).toBeVisible();
    });
});
