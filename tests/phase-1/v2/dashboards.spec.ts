import { test, expect } from '@playwright/test';

test.describe('Dashboards & Cross-filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
  });

  test('should pin charts to dashboard and test cross-filtering', async ({ page }) => {
    // 1. Pin Charts
    const charts = page.locator('.chart-card');
    for (let i = 0; i < 3; i++) {
      await charts.nth(i).hover();
      await page.getByRole('button', { name: /Pin to Dashboard/i }).click();
    }

    // Navigate to Dashboard tab
    await page.getByRole('tab', { name: /Dashboard/i }).click();
    await expect(page.locator('.dashboard-grid .chart-widget')).toHaveCount(3);

    // 2. Cross-filtering
    // Click a slice on the first chart (assuming it's a Pie chart)
    const firstChart = page.locator('.chart-widget').first().locator('canvas');
    // Simulate a click on a specific coordinate if exact slice selection is needed, 
    // or use a helper that knows ECharts click points
    await firstChart.click({ position: { x: 100, y: 100 } }); 

    // 3. Verify other charts filter correctly
    // We expect a loading state or a "Filtered" badge to appear on other widgets
    await expect(page.locator('.chart-widget').nth(1).locator('.filter-indicator')).toBeVisible();
    await expect(page.locator('.chart-widget').nth(2).locator('.filter-indicator')).toBeVisible();
  });
});
