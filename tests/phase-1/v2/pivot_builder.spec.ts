import { test, expect } from '@playwright/test';

test.describe('Pivot & Chart Builder E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
  });

  test('Pivot Builder Workflow: Drag dimensions, select aggregation, change chart type', async ({ page }) => {
    await page.getByRole('button', { name: 'Try Sample Data' }).click();
    await expect(page.getByPlaceholder(/Enter SQL query/i)).toBeVisible({ timeout: 15000 });

    const textarea = page.getByPlaceholder(/Enter SQL query/i);
    await textarea.fill("SELECT 'North' as Region, 'Bar' as Category, 100 as Sales UNION ALL SELECT 'South' as Region, 'Foo' as Category, 200 as Sales");
    await page.getByRole('button', { name: 'Run Query' }).click();
    await expect(page.getByRole('button', { name: '✨ Ask AI to Analyze' })).toBeVisible({ timeout: 15000 });

    await expect(page.locator('h2', { hasText: 'Pivot Builder' }).first()).toBeVisible({ timeout: 10000 });

    await page.locator('div[draggable="true"]').filter({ hasText: 'Region' }).dragTo(page.locator('#rows'));
    await page.locator('div[draggable="true"]').filter({ hasText: 'Sales' }).dragTo(page.locator('#values'));

    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeVisible({ timeout: 10000 });

    const aggTrigger = page.locator('#values').getByRole('button').filter({ hasText: 'SUM' });
    if (await aggTrigger.isVisible()) {
        await aggTrigger.click();
        await page.getByRole('button', { name: 'AVG', exact: true }).click();
    }

    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /Pie/i }).first().click();

    await expect(canvas.first()).toBeVisible({ timeout: 10000 });
  });

});
