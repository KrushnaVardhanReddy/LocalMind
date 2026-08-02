import { test, expect } from '@playwright/test';

test.describe('Specialty Analytics Visualizations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
  });

  test('should render Treemaps, Heatmaps, and Network Graphs', async ({ page }) => {
    // 1. HTML Extractor
    await page.getByRole('button', { name: /Extract HTML/i }).click();
    await page.locator('#html-input-url').fill('https://example.com/table');
    await page.getByRole('button', { name: /Extract/i }).click();
    await expect(page.locator('text=Extraction Complete')).toBeVisible();

    // 2. Treemap/Heatmap Rendering
    await page.getByRole('button', { name: /Visualization Type/i }).click();
    await page.getByRole('menuitem', { name: 'Treemap' }).click();
    await expect(page.locator('.treemap-container canvas')).toBeVisible();

    await page.getByRole('button', { name: /Visualization Type/i }).click();
    await page.getByRole('menuitem', { name: 'Heatmap' }).click();
    await expect(page.locator('.heatmap-container canvas')).toBeVisible();

    // 3. Network Graph Visualizer
    await page.getByRole('button', { name: /Visualization Type/i }).click();
    await page.getByRole('menuitem', { name: 'Network Graph' }).click();
    const networkCanvas = page.locator('.network-graph canvas');
    await expect(networkCanvas).toBeVisible();
    
    // Verify interactive nodes exist
    const nodeCount = await page.evaluate(() => window.chartInstance.getOption().series[0].data.length);
    expect(nodeCount).toBeGreaterThan(0);
  });
});
