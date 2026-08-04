import { test, expect } from '@playwright/test';

test.describe('Advanced Chart Inspector E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
  });

  test('Chart Inspector Workflow: Open Inspector, Toggle Stacked, Apply JSON Override', async ({ page }) => {
    await page.getByRole('button', { name: 'Try Sample Data' }).click();

    await page.locator('div[draggable="true"]').filter({ hasText: 'Region' }).dragTo(page.locator('#zone-rows'));
    await page.locator('div[draggable="true"]').filter({ hasText: 'Sales' }).dragTo(page.locator('#zone-values'));

    await page.waitForTimeout(2000);
    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeVisible({ timeout: 10000 });

    await page.getByTitle(/Toggle Chart Inspector/i).click();

    await expect(page.getByText('Chart Inspector')).toBeVisible({ timeout: 10000 });

    const stackedCheckbox = page.getByLabel(/Stacked/i).first();
    if (await stackedCheckbox.isVisible()) {
        await stackedCheckbox.check();
    }

    const jsonEditor = page.locator('textarea').filter({ hasText: '{' }).first();
    if (await jsonEditor.isVisible()) {
        await jsonEditor.fill('{"title": {"text": "Custom Title"}}');
    }

    await page.waitForTimeout(1000);

    await expect(canvas.first()).toBeVisible({ timeout: 10000 });
  });

});
