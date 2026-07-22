import { test, expect } from '@playwright/test';

test.describe('Dashboard Builder', () => {
  test('should allow pinning charts and viewing them in the dashboard', async ({ page }) => {
    // Override the timeout for this test
    test.setTimeout(60000);

    await page.goto('/');

    // Wait for DB to initialize
    await page.waitForTimeout(2000);

    // Set custom query
    await page.fill('textarea[placeholder*="Enter SQL query"]', 'SELECT 1 as id, 10 as value UNION ALL SELECT 2, 20 UNION ALL SELECT 3, 30');

    // Execute query by clicking button
    await page.getByRole('button', { name: 'Run Query' }).click();

    // Wait for Result Data
    await page.waitForSelector('text=Result Data', { timeout: 10000 });

    // Set up dialog handler before clicking pin
    page.on('dialog', dialog => dialog.accept());

    // Pin to dashboard
    await page.getByRole('button', { name: 'Pin to Dashboard' }).click();

    // Wait a sec for the localstorage save
    await page.waitForTimeout(1000);

    // Go to dashboard
    await page.getByRole('link', { name: 'View Dashboard' }).click();

    // Check if item is in dashboard
    await expect(page.locator('h3:has-text("Pinned Chart")')).toBeVisible({ timeout: 10000 });
  });
});
