import { test, expect } from '@playwright/test';

test.describe('Pivot & Chart Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    // Assume data is pre-loaded or use a fixture setup
    await page.locator('.table-item').first().click();
  });

  test('should build a pivot table and switch chart types', async ({ page }) => {
    // 1. Drag & Drop interactions for Pivot Builder
    await page.locator('.dimension-item:has-text("Region")').dragTo(page.locator('.pivot-rows-drop-zone'));
    await page.locator('.measure-item:has-text("Sales")').dragTo(page.locator('.pivot-values-drop-zone'));

    // 2. Change Aggregation
    await page.locator('.value-settings-trigger').click();
    await page.getByRole('option', { name: 'AVG' }).click();
    await expect(page.locator('.pivot-table-cell:has-text("Average Sales")')).toBeVisible();

    // 3. Switch Chart Type
    await page.getByRole('button', { name: /Chart Type/i }).click();
    await page.getByRole('menuitem', { name: 'Pie' }).click();

    // 4. Verify Canvas Renders
    const chartCanvas = page.locator('canvas').first();
    await expect(chartCanvas).toBeVisible();
    // Wait for ECharts animation/render stability
    await page.waitForTimeout(1000); 
    const box = await chartCanvas.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
  });
});
