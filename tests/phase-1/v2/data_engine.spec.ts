import { test, expect } from '@playwright/test';

test.describe('Data Ingestion & SQL Engine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.locator('h1', { hasText: 'LocalMind' })).toBeVisible();
  });

  test('should execute custom SQL and show result grid', async ({ page }) => {
    const sqlEditor = page.locator('textarea[placeholder*="Enter SQL query"]');
    await sqlEditor.click();
    await sqlEditor.fill("SELECT 1 AS Region, 500 AS Sales UNION ALL SELECT 2, 1000");
    await sqlEditor.dispatchEvent('input');
    await page.keyboard.press('Tab');
    
    await page.getByRole('button', { name: 'Run Query' }).click();

    const dataGrid = page.locator('table');
    await expect(dataGrid).toBeVisible({ timeout: 60000 });
    await expect(page.locator('th', { hasText: 'Region' }).first()).toBeVisible();
    await expect(page.locator('th', { hasText: 'Sales' }).first()).toBeVisible();
    await expect(page.locator('td', { hasText: '500' }).first()).toBeVisible();
  });
});
