import { test, expect } from '@playwright/test';

test.describe('Chat UI', () => {
    test.beforeEach(async ({ page }) => {
        // Shared state could go here
    });

    test.skip('Chat returns a streaming response', async ({ page }) => {
        // Skipped: Full WebGPU testing requires a physical GPU and is verified via unit tests instead.
        test.setTimeout(300000);
        await page.goto('/intelligence/chat');
        await page.waitForSelector('select', { timeout: 15000 });
        await page.selectOption('select', 'Llama-3.2-1B-Instruct-q4f16_1');
        const loadButton = page.getByRole('button', { name: 'Load Model' });
        await loadButton.click();

        await expect(page.getByRole('button', { name: 'Unload Model' })).toBeVisible({ timeout: 250000 });

        const chatInput = page.getByPlaceholder('Type your message... (Ctrl+Enter to send)');
        await expect(chatInput).toBeVisible({ timeout: 15000 });
        await chatInput.fill("Say 'hello' and nothing else.");
        await chatInput.press('Control+Enter');

        const assistantMessage = page.getByText(/hello/i).last();
        await expect(assistantMessage).toBeVisible({ timeout: 60000 });

        const privacyBadge = page.getByTestId('privacy-badge');
        await expect(privacyBadge).toBeVisible();
        await expect(privacyBadge).toContainText('Running locally');
    });
});
