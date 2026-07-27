import { test, expect } from '@playwright/test';

test('Data janitor detects null columns', async ({ page }) => {
    await page.goto('/intelligence/janitor');
    await page.waitForSelector('text=Local AI Data Janitor', { timeout: 15000 });
    await page.getByLabel('Paste Raw Text').click();

    const csvContent = `id,name,phone\n1,Alice,555-1234\n2,Bob,\n3,Charlie,555-9876`;
    await page.getByPlaceholder('Paste CSV or JSON here...').fill(csvContent);
    await page.getByRole('button', { name: 'Load Data' }).click();

    await expect(page.getByText('Data Preview (First 20 Rows)')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Issues Found/)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/Column 'phone' has 1 null values/)).toBeVisible({ timeout: 15000 });
});
