import { test, expect } from '@playwright/test';

test.describe('Advanced Chart Inspector E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
  });

  test('Chart Inspector Workflow: Open Inspector, Toggle Stacked, Apply JSON Override', async ({ page }) => {
    await page.getByRole('button', { name: 'Try Sample Data' }).click();
    await expect(page.getByPlaceholder(/Enter SQL query/i)).toBeVisible({ timeout: 15000 });

    const textarea = page.getByPlaceholder(/Enter SQL query/i);
    await textarea.fill("SELECT 'North' as Region, 'Bar' as Category, 100 as Sales UNION ALL SELECT 'South' as Region, 'Foo' as Category, 200 as Sales");
    await page.getByRole('button', { name: 'Run Query' }).click();
    await expect(page.getByRole('button', { name: '✨ Ask AI to Analyze' })).toBeVisible({ timeout: 15000 });

    await page.locator('div[draggable="true"]').filter({ hasText: 'Region' }).dragTo(page.locator('#rows'));
    await page.locator('div[draggable="true"]').filter({ hasText: 'Sales' }).dragTo(page.locator('#values'));

    await page.waitForTimeout(2000);
    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Toggle Chart Inspector/i }).click();

    await expect(page.getByText('Chart Inspector')).toBeVisible({ timeout: 10000 });

    const stackedCheckbox = page.getByLabel(/Stacked/i).first();
    if (await stackedCheckbox.isVisible()) {
        await stackedCheckbox.check();
    }

    const jsonEditor = page.locator('textarea').filter({ hasText: '{' }).first();
    if (await jsonEditor.isVisible()) {
        await jsonEditor.fill('{"title": {"text": "Custom Title"}}');
    }

    await page.getByRole('button', { name: /Apply JSON/i }).click();
    await page.waitForTimeout(1000);

    await expect(canvas.first()).toBeVisible({ timeout: 10000 });
  });

});
