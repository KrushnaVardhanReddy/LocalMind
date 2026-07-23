import { test, expect } from '@playwright/test';

test('Intelligence UI handles missing webgpu gracefully', async ({ page }) => {
    // Override navigator.gpu to simulate unsupported WebGPU
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'gpu', {
            get: () => undefined
        });
    });

    await page.goto('/intelligence');

    // Check if error message exists
    await expect(page.locator('text=WebGPU is not supported')).toBeVisible();
});

test('Intelligence UI shows load model button when webgpu is supported', async ({ page }) => {
    // Override navigator.gpu to simulate supported WebGPU
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'gpu', {
            get: () => ({})
        });
    });

    await page.goto('/intelligence');

    await expect(page.locator('button', { hasText: 'Load Model' })).toBeVisible();
});
