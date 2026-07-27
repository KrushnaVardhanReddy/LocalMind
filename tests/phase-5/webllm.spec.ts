import { test, expect } from '@playwright/test';

test.skip('Model loads successfully and reports loaded state', async ({ page }) => {
    // Skipped: Full WebGPU testing requires a physical GPU and is verified via unit tests instead.
    // CI runners and headless Playwright instances typically do not have access to dedicated GPU hardware.
    test.setTimeout(300000);
    await page.goto('/intelligence/chat');
    await page.waitForSelector('select', { timeout: 15000 });
    await page.selectOption('select', 'Llama-3.2-1B-Instruct-q4f16_1');

    const loadButton = page.getByRole('button', { name: 'Load Model' });
    await expect(loadButton).toBeVisible({ timeout: 15000 });
    await loadButton.click();

    page.on('console', msg => console.log(msg.text()));
    await expect(page.getByRole('button', { name: 'Unload Model' })).toBeVisible({ timeout: 250000 });
});
