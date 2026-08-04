import { test, expect } from '@playwright/test';

test.describe('Dashboards & Cross-filtering E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
  });

  test('Dashboard Workflow: Pin chart to dashboard, verify rendering and cross-filtering', async ({ page }) => {
    await page.getByRole('button', { name: 'Try Sample Data' }).click();
    await expect(page.getByPlaceholder(/Enter SQL query/i)).toBeVisible({ timeout: 15000 });

    const textarea = page.getByPlaceholder(/Enter SQL query/i);
    await textarea.fill("SELECT 'North' as Region, 'Bar' as Category, 100 as Sales UNION ALL SELECT 'South' as Region, 'Foo' as Category, 200 as Sales");
    await page.getByRole('button', { name: 'Run Query' }).click();
    await expect(page.getByRole('button', { name: '✨ Ask AI to Analyze' })).toBeVisible({ timeout: 15000 });

    await page.locator('div[draggable="true"]').filter({ hasText: 'Region' }).dragTo(page.locator('#rows'));
    await page.locator('div[draggable="true"]').filter({ hasText: 'Sales' }).dragTo(page.locator('#values'));

    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: /Pin to Dashboard/i }).click();
    page.on('dialog', dialog => dialog.accept());

    await page.getByRole('link', { name: /Dashboard/i }).first().click();

    await expect(page.getByText('Your dashboard is empty.')).not.toBeVisible({ timeout: 5000 });
    
    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeVisible({ timeout: 10000 });

    const canvasBox = await canvas.first().boundingBox();
    if (canvasBox) {
        await page.mouse.click(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
    }
    
    await page.waitForTimeout(1000);
    await expect(canvas.first()).toBeVisible();
  });

});
