import { test, expect } from '@playwright/test';

test.describe('Specialty Analytics E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
  });

  test('HTML Extractor', async ({ page }) => {
    await page.goto('/analytics/extractor');
    
    await expect(page.getByRole('heading', { name: /HTML/i }).first()).toBeVisible({ timeout: 10000 });

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();

    await textarea.fill('<table><tr><th>Col 1</th></tr><tr><td>Data 1</td></tr></table>');
    
    await page.getByRole('button', { name: /Extract/i }).click();

    await expect(page.getByText('Data 1')).toBeVisible({ timeout: 5000 });
  });

  test('Network Graph', async ({ page }) => {
    await page.goto('/analytics/network');
    
    await expect(page.getByText('Select a table and columns to visualize the network graph.')).toBeVisible({ timeout: 10000 });
  });

});
