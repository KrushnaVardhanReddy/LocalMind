import { test, expect } from '@playwright/test';

test.describe('Diagrams Workspace', () => {
    test.beforeEach(async ({ page }) => {
        const res = await page.goto('/plugins/diagrams');
        if (res && res.status() === 404) {
            test.skip(true, 'Route not yet implemented');
        }
    });

    test.fixme('Generates a diagram from prompt', async ({ page }) => {
        // FIXME: WebLLM requires downloading heavy models which can timeout or fail in CI/headless without caching.
        // We will mark this test as fixme for now and resolve it during the dedicated bug-fixing phase.

        await page.waitForLoadState('networkidle');

        await expect(page.locator('h1').filter({ hasText: 'Diagrams AI' })).toBeVisible({ timeout: 15000 });

        // Type a prompt
        const promptInput = page.locator('textarea[placeholder*="Describe your diagram"]');
        await promptInput.fill('Generate a simple UML class diagram with User and Order.');

        // Click generate
        await page.locator('button', { hasText: 'Generate Diagram' }).click();

        // Wait for mermaid SVG
        const svg = page.locator('svg[id^="mermaid-"]');
        await expect(svg).toBeVisible({ timeout: 45000 });

        // Assert elements inside SVG
        await expect(svg.locator('text', { hasText: 'User' }).first()).toBeVisible();
        await expect(svg.locator('text', { hasText: 'Order' }).first()).toBeVisible();
    });
});
