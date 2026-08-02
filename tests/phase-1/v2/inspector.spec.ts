import { test, expect } from '@playwright/test';

test.describe('Advanced Chart Inspector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    // Setup a basic bar chart
  });

  test('should apply custom JSON overrides and toggle stack mode', async ({ page }) => {
    // 1. Open Inspector
    await page.locator('canvas').first().click();
    await page.getByRole('button', { name: /Open Inspector|Settings/i }).click();
    await expect(page.locator('.inspector-panel')).toBeVisible();

    // 2. Toggle "Stacked"
    const stackToggle = page.getByLabel('Stacked');
    await stackToggle.check();
    
    // 3. Apply JSON Override
    const jsonEditor = page.locator('.json-editor-textarea');
    await jsonEditor.fill('{"title": {"text": "Custom Title", "left": "center"}}');
    await page.getByRole('button', { name: /Apply|Save/i }).click();

    // 4. Verify ECharts State (via page.evaluate for internal instance check if needed, or DOM side effects)
    // We check if the custom title is rendered in the ECharts container (often as a hidden div or accessible name)
    const chartContainer = page.locator('.echarts-container');
    await expect(chartContainer).toContainText('Custom Title');
  });
});
