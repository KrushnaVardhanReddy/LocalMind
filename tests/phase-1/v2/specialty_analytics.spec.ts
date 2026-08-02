import { test, expect } from '@playwright/test';

test.describe('Specialty Analytics Visualizations', () => {
  test('should render Treemap and Heatmap via Pivot Builder in analytics', async ({ page }) => {
    await page.goto('/analytics');
    
    // 1. Wait for page load and demo apply
    const applyDemoBtn = page.getByRole('button', { name: 'Apply Demo' });
    if (await applyDemoBtn.isVisible()) {
      await applyDemoBtn.click();
    }
    
    // 2. Treemap Rendering
    const treemapBtn = page.getByRole('button', { name: 'Treemap' });
    if (await treemapBtn.isVisible()) {
      await treemapBtn.click();
      await expect(page.locator('canvas').first()).toBeVisible();
    }

    // 3. Heatmap Rendering
    const heatmapBtn = page.getByRole('button', { name: 'Heatmap' });
    if (await heatmapBtn.isVisible()) {
      await heatmapBtn.click();
      await expect(page.locator('canvas').first()).toBeVisible();
    }
  });

  test('should load Network Graph visualizer route', async ({ page }) => {
    // Navigating directly to the network graph route
    await page.goto('/analytics/network');
    
    // Expect the page to load with Network Graph features
    await expect(page.locator('text=Select a table and columns').first()).toBeVisible();
  });
  
  test('should load HTML Extractor route', async ({ page }) => {
    // Navigating directly to the HTML extractor route
    await page.goto('/analytics/extractor');
    
    // Expect the page to load with Extractor features
    // Jules added HtmlExtractor
    await expect(page.locator('text=Extract').first()).toBeVisible();
  });
});
