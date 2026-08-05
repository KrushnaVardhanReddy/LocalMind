import { test, expect } from '@playwright/test';

test.describe('Pivot & Chart Builder E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
  });

  test('Pivot Builder Workflow: Drag dimensions, select aggregation, change chart type', async ({ page }) => {
    await page.getByRole('button', { name: 'Try Sample Data' }).click();

    await expect(page.locator('h2', { hasText: 'Pivot Builder' }).first()).toBeVisible({ timeout: 10000 });

    await page.locator('div[draggable="true"]').filter({ hasText: 'Region' }).dragTo(page.locator('#zone-rows'));
    await page.locator('div[draggable="true"]').filter({ hasText: 'Sales' }).dragTo(page.locator('#zone-values'));

    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeVisible({ timeout: 10000 });

    const aggTrigger = page.locator('#zone-values').getByRole('button').filter({ hasText: 'SUM' }).first();
    if (await aggTrigger.isVisible()) {
        await aggTrigger.click();
        await page.getByRole('button', { name: 'AVG', exact: true }).click();
    }

    await page.waitForTimeout(1000);

    await page.locator('button[title="Pie"]').click();

    await expect(canvas.first()).toBeVisible({ timeout: 10000 });
  });

});
