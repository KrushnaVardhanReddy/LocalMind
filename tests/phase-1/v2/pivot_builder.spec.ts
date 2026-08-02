import { test, expect } from '@playwright/test';

test.describe('Pivot & Chart Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.locator('h1', { hasText: 'LocalMind' })).toBeVisible();
    
    // Dismiss onboarding to prevent pointer interception
    const dismissBtn = page.getByRole('button', { name: /Dismiss|Got it/i });
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click();
    }
  });

  test('should load onboarding data and switch chart types', async ({ page }) => {
    // 1. Enter query via pressSequentially to ensure Svelte 5 bind:value picks it up
    const queryInput = page.locator('textarea[placeholder*="Enter SQL query"]');
    await queryInput.click();
    await queryInput.fill('SELECT 1 AS id, 10 AS val UNION ALL SELECT 2, 20');
    await queryInput.dispatchEvent('input');
    await page.keyboard.press('Tab');
    
    // 2. Click Run Query
    await page.getByRole('button', { name: 'Run Query' }).click();
    await expect(page.locator('text=Execution time:')).toBeVisible({ timeout: 60000 });

    // 3. Verify Pivot Builder panel is present
    await expect(page.locator('h2', { hasText: 'Pivot Builder' }).first()).toBeVisible();

    // 4. Must select a table to pivot
    await page.locator('select#pivotTableSelect').selectOption({ index: 1 });

    // Switch Chart Type
    const pieButton = page.getByTitle('Pie');
    await pieButton.click();

    const chartCanvas = page.locator('canvas').first();
    await expect(chartCanvas).toBeVisible({ timeout: 15000 });
  });
});
