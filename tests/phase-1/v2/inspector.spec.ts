import { test, expect } from '@playwright/test';

test.describe('Advanced Chart Inspector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.locator('h1', { hasText: 'LocalMind' })).toBeVisible();
  });

  test.skip('should apply custom JSON overrides', async ({ page }) => {
    // Test skipped: The manual Chart Inspector was deprecated in V2 in favor of the AI Alter Chart feature.
    // The ChartInspector component is no longer wired up to the ChartViewer canvas.
    // Wait for the pivot builder to be ready

    // Select a table to open PivotBuilder which contains the inspector toggle
    await page.locator('select#pivotTableSelect').selectOption({ index: 1 });

    const queryInput = page.locator('textarea[placeholder*="Enter SQL query"]');
    await queryInput.click();
    await queryInput.fill('SELECT 1 AS id, 10 AS val UNION ALL SELECT 2, 20');
    await queryInput.dispatchEvent('input');
    await page.keyboard.press('Tab');
    
    await page.getByRole('button', { name: 'Run Query' }).click();
    await expect(page.locator('text=Execution time:')).toBeVisible({ timeout: 60000 });

    const chartCanvas = page.locator('canvas').first();
    await expect(chartCanvas).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    const inspectorToggle = page.getByTitle('Toggle Chart Inspector');
    await inspectorToggle.click({ force: true });
    
    await expect(page.locator('h2', { hasText: 'Chart Inspector' })).toBeVisible();

    const jsonEditor = page.locator('textarea').filter({ hasText: '{' });
    await expect(jsonEditor).toBeVisible();
    await jsonEditor.click();
    await jsonEditor.fill('{"title": {"text": "Custom Title", "left": "center"}}');
    await jsonEditor.dispatchEvent('input');

    await expect(page.locator('text=Valid')).toBeVisible();
    await expect(chartCanvas).toBeVisible();
  });
});
