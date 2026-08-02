import { test, expect } from '@playwright/test';

test.describe('Dashboards & Cross-filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.locator('h1', { hasText: 'LocalMind' })).toBeVisible();
  });

  test('should query data and pin chart to dashboard', async ({ page }) => {
    // 1. Enter query via pressSequentially to ensure Svelte 5 bind:value picks it up
    const queryInput = page.locator('textarea[placeholder*="Enter SQL query"]');
    await queryInput.click();
    await queryInput.fill('SELECT 1 AS id, 10 AS val UNION ALL SELECT 2, 20');
    await queryInput.dispatchEvent('input');
    await page.keyboard.press('Tab');
    
    // 2. Click Run Query
    await page.getByRole('button', { name: 'Run Query' }).click();
    
    // Verify result grid appears
    await expect(page.locator('text=Execution time:')).toBeVisible({ timeout: 60000 });

    // Pin to dashboard
    const pinButton = page.getByRole('button', { name: /Pin to Dashboard/i });
    await expect(pinButton).toBeVisible();
    
    // Handle alert from pinning
    page.once('dialog', dialog => dialog.accept());
    await pinButton.click();

    // Navigate to Dashboard tab
    await page.goto('/dashboard');
    
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 60000 });
  });
});
